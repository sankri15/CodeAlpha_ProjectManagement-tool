import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { getDb } from '../db';
import { JWT_SECRET, authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const db = await getDb();
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = randomUUID();
    
    await db.run(
      'INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)',
      [id, username, email, hashedPassword]
    );
    
    // Auto-assign new user to all existing demo projects
    const projects = await db.all('SELECT id FROM projects');
    for (const p of projects) {
      await db.run('INSERT INTO project_members (projectId, userId) VALUES (?, ?)', [p.id, id]);
    }
    
    res.status(201).json({ message: 'User created' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', authMiddleware, async (req: any, res) => {
  try {
    const db = await getDb();
    const user = await db.get('SELECT id, username, email FROM users WHERE id = ?', [req.user.id]);
    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
