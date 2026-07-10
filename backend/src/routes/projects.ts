import { Router } from 'express';
import { randomUUID } from 'crypto';
import { getDb } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.post('/', async (req: any, res) => {
  const { name, description } = req.body;
  try {
    const db = await getDb();
    const id = randomUUID();
    await db.run(
      'INSERT INTO projects (id, name, description, ownerId) VALUES (?, ?, ?, ?)',
      [id, name, description, req.user.id]
    );
    await db.run(
      'INSERT INTO project_members (projectId, userId) VALUES (?, ?)',
      [id, req.user.id]
    );

    // Create default sections
    const defaultSections = ['Todo', 'In Progress', 'Done'];
    for (let i = 0; i < defaultSections.length; i++) {
      await db.run(
        'INSERT INTO sections (id, name, projectId, orderIndex) VALUES (?, ?, ?, ?)',
        [randomUUID(), defaultSections[i], id, i]
      );
    }

    const project = await db.get('SELECT * FROM projects WHERE id = ?', [id]);
    res.status(201).json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req: any, res) => {
  try {
    const db = await getDb();
    const projects = await db.all(
      `SELECT p.*, u.username as ownerName,
        (SELECT COUNT(*) FROM tasks WHERE projectId = p.id) as totalTasks,
        (SELECT COUNT(*) FROM tasks WHERE projectId = p.id AND isCompleted = 1) as completedTasks,
        (SELECT COUNT(*) FROM project_members WHERE projectId = p.id) as memberCount
       FROM projects p 
       LEFT JOIN project_members pm ON p.id = pm.projectId 
       LEFT JOIN users u ON p.ownerId = u.id
       WHERE p.ownerId = ? OR pm.userId = ?
       GROUP BY p.id`, 
       [req.user.id, req.user.id]
    );
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req: any, res) => {
  try {
    const db = await getDb();
    const project = await db.get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    const tasks = await db.all('SELECT t.*, (SELECT COUNT(*) FROM comments WHERE taskId = t.id) as commentCount FROM tasks t WHERE projectId = ? ORDER BY orderIndex ASC', [req.params.id]);
    const sections = await db.all('SELECT * FROM sections WHERE projectId = ? ORDER BY orderIndex ASC', [req.params.id]);
    const members = await db.all(
      'SELECT u.id, u.username, u.email FROM users u JOIN project_members pm ON u.id = pm.userId WHERE pm.projectId = ?', 
      [req.params.id]
    );
    const activities = await db.all(
      'SELECT a.*, u.username FROM activities a JOIN users u ON a.userId = u.id WHERE a.projectId = ? ORDER BY a.createdAt DESC LIMIT 50',
      [req.params.id]
    );
    if (!project) return res.status(404).json({ message: 'Not found' });
    res.json({ ...project, tasks, sections, members, activities });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/members', async (req: any, res) => {
  const { email } = req.body;
  try {
    const db = await getDb();
    const userToInvite = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (!userToInvite) return res.status(404).json({ message: 'User not found' });
    
    await db.run(
      'INSERT OR IGNORE INTO project_members (projectId, userId) VALUES (?, ?)',
      [req.params.id, userToInvite.id]
    );
    res.json({ message: 'Collaborator added' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
