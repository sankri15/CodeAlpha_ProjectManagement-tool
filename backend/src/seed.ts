import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Connecting to DB...');
  const db = await open({
    filename: path.join(__dirname, '..', 'database.sqlite'),
    driver: sqlite3.Database
  });

  console.log('Wiping existing data...');
  await db.exec(`
    DELETE FROM activities;
    DELETE FROM comments;
    DELETE FROM tasks;
    DELETE FROM sections;
    DELETE FROM project_members;
    DELETE FROM projects;
    DELETE FROM users;
  `);

  console.log('Creating users...');
  const users = [
    { id: randomUUID(), username: 'Emily Carter', email: 'demo@example.com' },
    { id: randomUUID(), username: 'Sarah Jenkins', email: 'sarah@example.com' },
    { id: randomUUID(), username: 'Michael Torres', email: 'mike@example.com' },
    { id: randomUUID(), username: 'Alexander Reed', email: 'alex@example.com' }
  ];

  const hash = await bcrypt.hash('password', 10);
  for (const u of users) {
    await db.run('INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)', [u.id, u.username, u.email, hash]);
  }

  const demoUser = users[0];
  // Create unique projects
  console.log('Creating projects...');
  const projects = [
    { id: randomUUID(), name: 'Neon Launch', description: 'GTM strategy for the new Neon product line', ownerId: demoUser.id },
    { id: randomUUID(), name: 'Atlas Redesign', description: 'Complete UI/UX overhaul for the Atlas platform', ownerId: demoUser.id },
    { id: randomUUID(), name: 'Titan API Migration', description: 'Migrating legacy endpoints to the new Titan GraphQL schema', ownerId: users[1].id },
    { id: randomUUID(), name: 'Zenith Marketing Q3', description: 'Q3 social and paid marketing campaigns', ownerId: users[2].id }
  ];

  for (const p of projects) {
    await db.run('INSERT INTO projects (id, name, description, ownerId) VALUES (?, ?, ?, ?)', [p.id, p.name, p.description, p.ownerId]);
    // Add all users to all projects as a member to ensure they see them
    for (const u of users) {
      await db.run('INSERT INTO project_members (projectId, userId) VALUES (?, ?)', [p.id, u.id]);
    }
  }

  console.log('Creating sections and tasks...');
  
  // Neon Launch
  const neonSections = [
    { id: randomUUID(), name: 'Planning', projectId: projects[0].id, orderIndex: 0 },
    { id: randomUUID(), name: 'Execution', projectId: projects[0].id, orderIndex: 1 },
    { id: randomUUID(), name: 'Launch Day', projectId: projects[0].id, orderIndex: 2 }
  ];
  for (const s of neonSections) {
    await db.run('INSERT INTO sections (id, name, projectId, orderIndex) VALUES (?, ?, ?, ?)', [s.id, s.name, s.projectId, s.orderIndex]);
  }

  const neonTasks = [
    { id: randomUUID(), title: 'Define target audience', projectId: projects[0].id, sec: neonSections[0].id, assignee: demoUser.id, comp: 1 },
    { id: randomUUID(), title: 'Create press release', projectId: projects[0].id, sec: neonSections[1].id, assignee: users[1].id, comp: 0 },
    { id: randomUUID(), title: 'Finalize ad spend budget', projectId: projects[0].id, sec: neonSections[0].id, assignee: demoUser.id, comp: 0 },
    { id: randomUUID(), title: 'Monitor analytics', projectId: projects[0].id, sec: neonSections[2].id, assignee: demoUser.id, comp: 0 }
  ];

  // Atlas Redesign
  const atlasSections = [
    { id: randomUUID(), name: 'To Do', projectId: projects[1].id, orderIndex: 0 },
    { id: randomUUID(), name: 'In Progress', projectId: projects[1].id, orderIndex: 1 },
    { id: randomUUID(), name: 'Done', projectId: projects[1].id, orderIndex: 2 }
  ];
  for (const s of atlasSections) {
    await db.run('INSERT INTO sections (id, name, projectId, orderIndex) VALUES (?, ?, ?, ?)', [s.id, s.name, s.projectId, s.orderIndex]);
  }

  const atlasTasks = [
    { id: randomUUID(), title: 'Dashboard wireframes', projectId: projects[1].id, sec: atlasSections[0].id, assignee: demoUser.id, comp: 1 },
    { id: randomUUID(), title: 'User profile redesign', projectId: projects[1].id, sec: atlasSections[1].id, assignee: users[2].id, comp: 0 },
    { id: randomUUID(), title: 'Export assets for engineering', projectId: projects[1].id, sec: atlasSections[2].id, assignee: demoUser.id, comp: 0 }
  ];

  // Titan API Migration
  const titanSections = [
    { id: randomUUID(), name: 'Backlog', projectId: projects[2].id, orderIndex: 0 },
    { id: randomUUID(), name: 'In Progress', projectId: projects[2].id, orderIndex: 1 },
    { id: randomUUID(), name: 'Done', projectId: projects[2].id, orderIndex: 2 }
  ];
  for (const s of titanSections) {
    await db.run('INSERT INTO sections (id, name, projectId, orderIndex) VALUES (?, ?, ?, ?)', [s.id, s.name, s.projectId, s.orderIndex]);
  }

  const titanTasks = [
    { id: randomUUID(), title: 'Audit REST endpoints', projectId: projects[2].id, sec: titanSections[2].id, assignee: users[1].id, comp: 1 },
    { id: randomUUID(), title: 'Write GraphQL resolvers', projectId: projects[2].id, sec: titanSections[1].id, assignee: demoUser.id, comp: 0 },
    { id: randomUUID(), title: 'Update frontend queries', projectId: projects[2].id, sec: titanSections[0].id, assignee: users[2].id, comp: 0 }
  ];

  // Zenith Marketing Q3
  const zenithSections = [
    { id: randomUUID(), name: 'Ideas', projectId: projects[3].id, orderIndex: 0 },
    { id: randomUUID(), name: 'Scheduled', projectId: projects[3].id, orderIndex: 1 }
  ];
  for (const s of zenithSections) {
    await db.run('INSERT INTO sections (id, name, projectId, orderIndex) VALUES (?, ?, ?, ?)', [s.id, s.name, s.projectId, s.orderIndex]);
  }

  const zenithTasks = [
    { id: randomUUID(), title: 'Summer promo video', projectId: projects[3].id, sec: zenithSections[1].id, assignee: demoUser.id, comp: 0 },
    { id: randomUUID(), title: 'Influencer outreach', projectId: projects[3].id, sec: zenithSections[0].id, assignee: demoUser.id, comp: 0 }
  ];

  const allTasks = [...neonTasks, ...atlasTasks, ...titanTasks, ...zenithTasks];
  const dates = ['2026-07-15', '2026-07-20', '2026-07-30', '2026-08-05'];

  for (let i = 0; i < allTasks.length; i++) {
    const t = allTasks[i];
    const dueDate = dates[i % dates.length];
    await db.run('INSERT INTO tasks (id, title, projectId, sectionId, assigneeId, isCompleted, dueDate) VALUES (?, ?, ?, ?, ?, ?, ?)', [t.id, t.title, t.projectId, t.sec, t.assignee, t.comp, dueDate]);
  }

  // Generate activities
  console.log('Generating activities...');
  const actions = ['completed task', 'commented on', 'changed status of', 'uploaded a file to'];
  for (let i = 0; i < 15; i++) {
    const actUser = users[Math.floor(Math.random() * users.length)];
    const actProject = projects[Math.floor(Math.random() * projects.length)];
    const actAction = actions[Math.floor(Math.random() * actions.length)];
    const actTarget = allTasks[Math.floor(Math.random() * allTasks.length)].title;
    
    await db.run(
      'INSERT INTO activities (id, projectId, userId, action, target) VALUES (?, ?, ?, ?, ?)',
      [randomUUID(), actProject.id, actUser.id, actAction, actTarget]
    );
  }

  console.log('Done seeding demo data!');
}

seed().catch(console.error);
