import { Router } from 'express';
import { randomUUID } from 'crypto';
import { getDb } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.post('/', async (req: any, res) => {
  const { text, taskId, attachmentName } = req.body;
  try {
    const db = await getDb();
    const id = randomUUID();
    await db.run(
      'INSERT INTO comments (id, text, taskId, authorId, attachmentName) VALUES (?, ?, ?, ?, ?)',
      [id, text, taskId, req.user.id, attachmentName || null]
    );
    const comment = await db.get('SELECT c.*, u.username as authorName FROM comments c JOIN users u ON c.authorId = u.id WHERE c.id = ?', [id]);
    
    // Broadcast via socket.io to the project room (need to get projectId)
    const task = await db.get('SELECT projectId, title FROM tasks WHERE id = ?', [taskId]);
    if (task) {
      req.io.to(task.projectId).emit('commentAdded', comment);
      
      // Log activity
      const activityId = randomUUID();
      await db.run(
        'INSERT INTO activities (id, projectId, userId, action, target, taskId) VALUES (?, ?, ?, ?, ?, ?)',
        [activityId, task.projectId, req.user.id, 'commented on task', task.title, taskId]
      );
      const activity = await db.get('SELECT a.*, u.username FROM activities a JOIN users u ON a.userId = u.id WHERE a.id = ?', [activityId]);
      req.io.to(task.projectId).emit('activityAdded', activity);
    }

    res.status(201).json(comment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
