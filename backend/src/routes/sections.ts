import { Router } from 'express';
import { randomUUID } from 'crypto';
import { getDb } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.post('/', async (req: any, res) => {
  const { name, projectId } = req.body;
  try {
    const db = await getDb();
    const id = randomUUID();
    
    // Get max order index
    const maxOrder = await db.get('SELECT MAX(orderIndex) as max FROM sections WHERE projectId = ?', [projectId]);
    const nextOrder = maxOrder && maxOrder.max !== null ? maxOrder.max + 1 : 0;

    await db.run(
      'INSERT INTO sections (id, name, projectId, orderIndex) VALUES (?, ?, ?, ?)',
      [id, name, projectId, nextOrder]
    );
    const section = await db.get('SELECT * FROM sections WHERE id = ?', [id]);
    
    // Broadcast
    req.io.to(projectId).emit('sectionAdded', section);
    
    res.status(201).json(section);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req: any, res) => {
  const { name, orderIndex } = req.body;
  try {
    const db = await getDb();
    const section = await db.get('SELECT * FROM sections WHERE id = ?', [req.params.id]);
    if (!section) return res.status(404).json({ message: 'Not found' });

    let query = 'UPDATE sections SET ';
    const params = [];
    if (name !== undefined) {
      query += 'name = ?, ';
      params.push(name);
    }
    if (orderIndex !== undefined) {
      query += 'orderIndex = ?, ';
      params.push(orderIndex);
    }
    
    if (params.length > 0) {
      query = query.slice(0, -2) + ' WHERE id = ?';
      params.push(req.params.id);
      await db.run(query, params);
    }

    const updatedSection = await db.get('SELECT * FROM sections WHERE id = ?', [req.params.id]);
    req.io.to(section.projectId).emit('sectionUpdated', updatedSection);
    res.json(updatedSection);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req: any, res) => {
  try {
    const db = await getDb();
    const section = await db.get('SELECT * FROM sections WHERE id = ?', [req.params.id]);
    if (!section) return res.status(404).json({ message: 'Not found' });

    await db.run('DELETE FROM tasks WHERE sectionId = ?', [req.params.id]);
    await db.run('DELETE FROM sections WHERE id = ?', [req.params.id]);
    
    req.io.to(section.projectId).emit('sectionDeleted', { id: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
