import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (db) return db;
  
  db = await open({
    filename: path.join(__dirname, '..', 'database.sqlite'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      ownerId TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(ownerId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'Todo',
      priority TEXT DEFAULT 'Medium',
      dueDate TEXT,
      projectId TEXT NOT NULL,
      assigneeId TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(projectId) REFERENCES projects(id),
      FOREIGN KEY(assigneeId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      taskId TEXT NOT NULL,
      authorId TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(taskId) REFERENCES tasks(id),
      FOREIGN KEY(authorId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS project_members (
      projectId TEXT NOT NULL,
      userId TEXT NOT NULL,
      PRIMARY KEY (projectId, userId),
      FOREIGN KEY(projectId) REFERENCES projects(id),
      FOREIGN KEY(userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      userId TEXT NOT NULL,
      action TEXT NOT NULL,
      target TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(projectId) REFERENCES projects(id),
      FOREIGN KEY(userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      projectId TEXT NOT NULL,
      orderIndex INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(projectId) REFERENCES projects(id)
    );
    CREATE TABLE IF NOT EXISTS portfolios (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      ownerId TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(ownerId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS portfolio_projects (
      portfolioId TEXT NOT NULL,
      projectId TEXT NOT NULL,
      PRIMARY KEY (portfolioId, projectId),
      FOREIGN KEY(portfolioId) REFERENCES portfolios(id),
      FOREIGN KEY(projectId) REFERENCES projects(id)
    );
  `);

  try { await db.exec('ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT "Medium"'); } catch(e) {}
  try { await db.exec('ALTER TABLE tasks ADD COLUMN dueDate TEXT'); } catch(e) {}
  try { await db.exec('ALTER TABLE tasks ADD COLUMN sectionId TEXT'); } catch(e) {}
  try { await db.exec('ALTER TABLE tasks ADD COLUMN orderIndex INTEGER DEFAULT 0'); } catch(e) {}
  try { await db.exec('ALTER TABLE tasks ADD COLUMN isCompleted BOOLEAN DEFAULT 0'); } catch(e) {}
  try { await db.exec('ALTER TABLE tasks ADD COLUMN parentId TEXT'); } catch(e) {}
  try { await db.exec('ALTER TABLE activities ADD COLUMN taskId TEXT'); } catch(e) {}
  try { await db.exec('ALTER TABLE comments ADD COLUMN attachmentName TEXT'); } catch(e) {}

  return db;
}
