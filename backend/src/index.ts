import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import path from 'node:path';
import {
  connectDatabase,
  databaseStatus,
  disconnectDatabase,
} from './db';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import listingRoutes from './routes/listings';
import requestRoutes from './routes/requests';

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  }),
);
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'CampusRent API',
    database: databaseStatus(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/requests', requestRoutes);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    if (
      err instanceof mongoose.Error.ValidationError ||
      err instanceof mongoose.Error.CastError
    ) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  },
);

async function startServer() {
  await connectDatabase();

  const server = app.listen(port, () => {
    console.log(`CampusRent API running on http://localhost:${port}`);
  });

  async function shutDown() {
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  }

  process.once('SIGINT', () => void shutDown());
  process.once('SIGTERM', () => void shutDown());
}

void startServer().catch((error) => {
  console.error('Could not start CampusRent API:', error);
  process.exitCode = 1;
});

export default app;
