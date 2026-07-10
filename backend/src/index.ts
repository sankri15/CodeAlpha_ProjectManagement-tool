import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { getDb } from './db';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import taskRoutes from './routes/tasks';
import commentRoutes from './routes/comments';
import sectionRoutes from './routes/sections';
import activitiesRoutes from './routes/activities';
import portfoliosRoutes from './routes/portfolios';
import { randomUUID } from 'crypto';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// Attach io to req for routes to use
app.use((req: any, res, next) => {
  req.io = io;
  next();
});

// Initialize DB and Routes
async function start() {
  await getDb();
  console.log("Database initialized");

  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/sections', sectionRoutes);
  app.use('/api/activities', activitiesRoutes);
  app.use('/api/portfolios', portfoliosRoutes);

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Join a room for a specific project board
    socket.on('joinProject', (projectId) => {
      socket.join(projectId);
      console.log(`Socket ${socket.id} joined project ${projectId}`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
