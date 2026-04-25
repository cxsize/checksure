import express from 'express';
import { onRequest } from 'firebase-functions/v2/https';
import { requireAdmin } from '../middleware/requireAdmin';
import { errorHandler } from '../middleware/errorHandler';
import { usersRouter } from './routes/users';
import { sitesRouter } from './routes/sites';
import { attendanceRouter } from './routes/attendance';
import { leaveRouter } from './routes/leave';

const app = express();
app.use(express.json());

app.use('/admin', requireAdmin);
app.use('/admin/users', usersRouter);
app.use('/admin/sites', sitesRouter);
app.use('/admin/attendance', attendanceRouter);
app.use('/admin/leave', leaveRouter);

app.use(errorHandler);

export const adminApi = onRequest(
  { cors: true, region: 'asia-southeast1' },
  app,
);
