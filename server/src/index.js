import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/database.js';
import { PORT, UPLOAD_DIR, isOriginAllowed, validateEnv } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import notFoundHandler from './middleware/notFoundHandler.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/usersRoutes.js';
import projectRoutes from './routes/projectsRoutes.js';
import taskRoutes from './routes/tasksRoutes.js';
import listRoutes from './routes/listRoutes.js';
import backlogRoutes from './routes/backlogRoutes.js';
import boardRoutes from './routes/boardRoutes.js';
import timelineRoutes from './routes/timelineRoutes.js';
import commentRoutes from './routes/commentsRoutes.js';
import sprintRoutes from './routes/sprintsRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import homeRoutes from './routes/homeRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const clientDistDir = path.resolve(currentDir, '../../client/dist');

validateEnv();

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log('Created uploads directory:', UPLOAD_DIR);
}

// Initialize Express Application
const app = express();
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}
app.disable('x-powered-by');

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// CORS Configuration
app.use(cors({
  origin: (origin, cb) => {
    cb(null, isOriginAllowed(origin) ? origin || true : false);
  },
  credentials: true,
}));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, status: 'ok' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/tasks', taskRoutes);
app.use('/api/projects/:projectId/list', listRoutes);
app.use('/api/projects/:projectId/backlog', backlogRoutes);
app.use('/api/projects/:projectId/board', boardRoutes);
app.use('/api/projects/:projectId/timeline', timelineRoutes);
app.use('/api/projects/:projectId/sprints', sprintRoutes);
app.use('/api/tasks/:taskId/comments', commentRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);

app.use('/uploads', express.static(UPLOAD_DIR));

if (fs.existsSync(clientDistDir)) {
  app.use(express.static(clientDistDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
      next();
      return;
    }
    res.sendFile(path.join(clientDistDir, 'index.html'));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

// Server Startup
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Start Application
start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
