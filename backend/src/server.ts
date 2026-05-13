import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import pool from './config/db';
import { initSocket } from './socket';

// Import Routes
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import projectRoutes from './modules/projects/project.routes';
import taskRoutes from './modules/tasks/task.routes';
import documentRoutes from './modules/documents/document.routes';
import meetingRoutes from './modules/meetings/meeting.routes';
import evaluationRoutes from './modules/evaluations/evaluation.routes';
import batchRoutes from './modules/batches/batch.routes';
import commsRoutes from './modules/communication/comms.routes';
import adminRoutes from './modules/admin/admin.routes';
import studentRoutes from './modules/student/student.routes';
import guideRoutes from './modules/guide/guide.routes';
import coordinatorRoutes from './modules/coordinator/coordinator.routes';
import extensionRoutes from './modules/extensions/extension.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import githubRoutes from './modules/projects/github.routes';

// Import Utilities
import { errorHandler } from './middleware/error.middleware';
import { UPLOAD_DIR, UPLOAD_URL_PREFIX } from './config/storage';

// Load environment variables
dotenv.config();

const app: Application = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.io
initSocket(server);

// Global Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Serve uploaded files with CORS so the frontend PDF viewer can fetch them
app.use(UPLOAD_URL_PREFIX, (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    next();
}, express.static(UPLOAD_DIR));

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/comms', commsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/guide', guideRoutes);
app.use('/api/coordinator', coordinatorRoutes);
app.use('/api/extensions', extensionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/github', githubRoutes);

// Basic Health Check Route (Checks Express AND Postgres)
app.get('/health', async (req: Request, res: Response) => {
  try {
    const dbRes = await pool.query('SELECT NOW()');
    res.status(200).json({
      status: 'UP',
      message: 'APMS Server is running',
      database_time: dbRes.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      status: 'DOWN',
      error: 'Database connection failed'
    });
  }
});

// Global Error Handler (Must be registered last)
app.use(errorHandler);

// Start the server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🚀 APMS Server running on http://localhost:${PORT}`);
  });
}

export default server;
