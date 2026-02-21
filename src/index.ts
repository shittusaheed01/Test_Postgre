import 'dotenv/config';
import app from './app';
import { pool, verifyConnection } from './db/pool';
import { runCsvImportIfNeeded } from './services/csvImporter';

const PORT = Number(process.env.PORT ?? 8080);

async function start(): Promise<void> {
  try {
    await verifyConnection();
  } catch (error) {
    console.error('Database connection failed', error);
    process.exit(1);
  }

  await runCsvImportIfNeeded();

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`${signal} received — shutting down`);
    server.close();
    await pool.end();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
