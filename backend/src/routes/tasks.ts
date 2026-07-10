import { Router } from 'express';
import { randomUUID } from 'crypto';
import { getDb } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.post('/', async (req: any, res) => {
  const { title, description, projectId, assigneeId, priority, dueDate, sectionId, parentId } = req.body;
  try {
    const db = await getDb();
    
    let targetSectionId = sectionId;
    if (!targetSectionId && !parentId) {
       // Get default section for this project
       const firstSection = await db.get('SELECT id FROM sections WHERE projectId = ? ORDER BY orderIndex ASC LIMIT 1', [projectId]);
       targetSectionId = firstSection ? firstSection.id : null;
    }

    const id = randomUUID();
    await db.run(
      'INSERT INTO tasks (id, title, description, projectId, assigneeId, priority, dueDate, sectionId, parentId) VALUES (?, ?, ?, ?, ?, coalesce(?, "Medium"), ?, ?, ?)',
      [id, title, description, projectId, assigneeId || null, priority, dueDate || null, targetSectionId, parentId || null]
    );
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    
    // Log activity
    let actionStr = 'created task';
    if (assigneeId && assigneeId !== req.user.id) {
      const assigneeUser = await db.get('SELECT username FROM users WHERE id = ?', [assigneeId]);
      if (assigneeUser) {
        actionStr = `assigned task to ${assigneeUser.username}`;
      }
    }

    const activityId = randomUUID();
    await db.run(
      'INSERT INTO activities (id, projectId, userId, action, target, taskId) VALUES (?, ?, ?, ?, ?, ?)',
      [activityId, projectId, req.user.id, actionStr, title, id]
    );
    const activity = await db.get('SELECT a.*, u.username FROM activities a JOIN users u ON a.userId = u.id WHERE a.id = ?', [activityId]);

    // Broadcast via socket.io
    req.io.to(projectId).emit('taskAdded', task);
    req.io.to(projectId).emit('activityAdded', activity);
    
    res.status(201).json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req: any, res) => {
  const { title, description, status, assigneeId, priority, dueDate, sectionId, orderIndex, isCompleted, parentId } = req.body;
  try {
    const db = await getDb();
    const oldTask = await db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);

    await db.run(
      'UPDATE tasks SET title = coalesce(?, title), description = coalesce(?, description), status = coalesce(?, status), assigneeId = coalesce(?, assigneeId), priority = coalesce(?, priority), dueDate = coalesce(?, dueDate), sectionId = coalesce(?, sectionId), orderIndex = coalesce(?, orderIndex), isCompleted = coalesce(?, isCompleted), parentId = coalesce(?, parentId) WHERE id = ?',
      [title, description, status, assigneeId, priority, dueDate, sectionId, orderIndex, isCompleted, parentId, req.params.id]
    );
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    
    // Log activity based on what changed
    let action = 'updated task';
    if (sectionId && oldTask.sectionId !== sectionId) {
      const section = await db.get('SELECT name FROM sections WHERE id = ?', [sectionId]);
      action = `moved task to ${section?.name || 'new section'}`;
    } else if (isCompleted !== undefined && oldTask.isCompleted !== isCompleted) {
      action = isCompleted ? 'completed task' : 'uncompleted task';
    } else if (assigneeId && oldTask.assigneeId !== assigneeId) {
      if (assigneeId === req.user.id) {
        action = 'claimed task';
      } else {
        const assigneeUser = await db.get('SELECT username FROM users WHERE id = ?', [assigneeId]);
        action = assigneeUser ? `assigned task to ${assigneeUser.username}` : 'reassigned task';
      }
    }

    // Only log if something major changed
    if (action !== 'updated task' || (title && title !== oldTask.title)) {
      const activityId = randomUUID();
      await db.run(
        'INSERT INTO activities (id, projectId, userId, action, target, taskId) VALUES (?, ?, ?, ?, ?, ?)',
        [activityId, task.projectId, req.user.id, action, task.title, task.id]
      );
      const activity = await db.get('SELECT a.*, u.username FROM activities a JOIN users u ON a.userId = u.id WHERE a.id = ?', [activityId]);
      req.io.to(task.projectId).emit('activityAdded', activity);
    }

    // Broadcast via socket.io
    req.io.to(task.projectId).emit('taskUpdated', task);

    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/all', async (req: any, res) => {
  try {
    const db = await getDb();
    const tasks = await db.all(`
      SELECT t.*, u.username as assigneeName, p.name as projectName,
      (SELECT COUNT(*) FROM comments WHERE taskId = t.id) as commentCount
      FROM tasks t 
      JOIN projects p ON t.projectId = p.id
      LEFT JOIN project_members pm ON p.id = pm.projectId 
      LEFT JOIN users u ON t.assigneeId = u.id
      WHERE p.ownerId = ? OR pm.userId = ?
      GROUP BY t.id
    `, [req.user.id, req.user.id]);
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', async (req: any, res) => {
  try {
    const db = await getDb();
    const tasks = await db.all('SELECT t.*, p.name as projectName, (SELECT COUNT(*) FROM comments WHERE taskId = t.id) as commentCount FROM tasks t JOIN projects p ON t.projectId = p.id WHERE t.assigneeId = ?', [req.user.id]);
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req: any, res) => {
  try {
    const db = await getDb();
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) return res.status(404).json({ message: 'Not found' });
    const comments = await db.all('SELECT c.*, u.username as authorName FROM comments c JOIN users u ON c.authorId = u.id WHERE c.taskId = ? ORDER BY c.createdAt DESC', [req.params.id]);
    const subtasks = await db.all('SELECT * FROM tasks WHERE parentId = ? ORDER BY createdAt ASC', [req.params.id]);
    res.json({ ...task, comments, subtasks });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req: any, res) => {
  try {
    const db = await getDb();
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) return res.status(404).json({ message: 'Not found' });

    // Delete subtasks and comments
    await db.run('DELETE FROM tasks WHERE parentId = ?', [req.params.id]);
    await db.run('DELETE FROM comments WHERE taskId = ?', [req.params.id]);
    // Delete task
    await db.run('DELETE FROM tasks WHERE id = ?', [req.params.id]);

    req.io.to(task.projectId).emit('taskDeleted', { id: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
