import { Router } from 'express';
import { getDb } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: any, res) => {
  try {
    const isArchived = req.query.status === 'archived' ? 1 : 0;
    const db = await getDb();
    const activities = await db.all(
      `SELECT a.*, u.username, p.name as projectName 
       FROM activities a 
       JOIN users u ON a.userId = u.id 
       JOIN projects p ON a.projectId = p.id
       LEFT JOIN project_members pm ON p.id = pm.projectId
       WHERE (p.ownerId = ? OR pm.userId = ?) AND a.isArchived = ?
       ORDER BY a.createdAt DESC LIMIT 50`,
       [req.user.id, req.user.id, isArchived]
    );
    res.json(activities);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/archive-all', async (req: any, res) => {
  try {
    const db = await getDb();
    // Archive all activities that belong to projects the user is part of
    await db.run(`
      UPDATE activities 
      SET isArchived = 1 
      WHERE id IN (
        SELECT a.id FROM activities a
        JOIN projects p ON a.projectId = p.id
        LEFT JOIN project_members pm ON p.id = pm.projectId
        WHERE p.ownerId = ? OR pm.userId = ?
      )
    `, [req.user.id, req.user.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/archive', async (req: any, res) => {
  try {
    const db = await getDb();
    await db.run('UPDATE activities SET isArchived = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/unarchive', async (req: any, res) => {
  try {
    const db = await getDb();
    await db.run('UPDATE activities SET isArchived = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
