import { Router } from 'express';
import { randomUUID } from 'crypto';
import { getDb } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: any, res) => {
  try {
    const db = await getDb();
    
    // Get all portfolios owned by the user
    const portfolios = await db.all('SELECT * FROM portfolios WHERE ownerId = ?', [req.user.id]);
    
    // For each portfolio, fetch its projects and their aggregated stats
    const enrichedPortfolios = await Promise.all(portfolios.map(async (portfolio) => {
      const projects = await db.all(`
        SELECT p.*,
          (SELECT COUNT(*) FROM tasks WHERE projectId = p.id) as totalTasks,
          (SELECT COUNT(*) FROM tasks WHERE projectId = p.id AND isCompleted = 1) as completedTasks
        FROM projects p
        JOIN portfolio_projects pp ON p.id = pp.projectId
        WHERE pp.portfolioId = ?
      `, [portfolio.id]);
      
      const enrichedProjects = await Promise.all(projects.map(async (project) => {
        const members = await db.all(`
          SELECT u.id, u.username
          FROM users u
          JOIN project_members pm ON u.id = pm.userId
          WHERE pm.projectId = ?
          UNION
          SELECT u.id, u.username
          FROM users u
          WHERE u.id = ?
        `, [project.id, project.ownerId]);
        return { ...project, members, memberCount: members.length };
      }));
      
      return { ...portfolio, projects: enrichedProjects };
    }));

    res.json(enrichedPortfolios);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req: any, res) => {
  const { name, projectIds } = req.body;
  try {
    const db = await getDb();
    const portfolioId = randomUUID();
    
    await db.run('INSERT INTO portfolios (id, name, ownerId) VALUES (?, ?, ?)', [portfolioId, name, req.user.id]);
    
    if (projectIds && Array.isArray(projectIds)) {
      for (const projectId of projectIds) {
        await db.run('INSERT INTO portfolio_projects (portfolioId, projectId) VALUES (?, ?)', [portfolioId, projectId]);
      }
    }
    
    const newPortfolio = await db.get('SELECT * FROM portfolios WHERE id = ?', [portfolioId]);
    res.status(201).json(newPortfolio);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
