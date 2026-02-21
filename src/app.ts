import express, { Request, Response, NextFunction } from 'express';
import { httpLogger } from './utils/logger';
import analyticsRouter from './routes/analytics';

const app = express();

app.use(express.json());
app.use(httpLogger);

// Routes
app.use('/analytics', analyticsRouter);

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

export default app;
