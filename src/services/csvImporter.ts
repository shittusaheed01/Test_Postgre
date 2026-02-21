import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { PoolClient } from 'pg';
import { pool } from '../db/pool';
import { logger } from '../utils/logger';

const DATA_DIR = path.resolve(process.cwd(), 'data');

const BATCH_SIZE = 1000;

type ActivityRow = {
  event_id: string;
  merchant_id: string;
  event_timestamp: string;
  product: string;
  event_type: string;
  amount: string;
  status: string;
  channel: string;
  region: string;
  merchant_tier: string;
};

async function createTableIfNotExists() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS merchant_activities (
      event_id TEXT PRIMARY KEY,
      merchant_id TEXT,
      event_timestamp TIMESTAMP,
      product TEXT,
      event_type TEXT,
      amount NUMERIC,
      status TEXT,
      channel TEXT,
      region TEXT,
      merchant_tier TEXT
    );
  `);
}

async function isTableEmpty(): Promise<boolean> {
  const { rows } = await pool.query(
    'SELECT 1 FROM merchant_activities LIMIT 1',
  );
  return rows.length === 0;
}

async function insertBatch(client: PoolClient, batch: ActivityRow[]) {
  if (batch.length === 0) return;

  const values: unknown[] = [];
  const placeholders: string[] = [];

  batch.forEach((row, index) => {
    const offset = index * 10;
    placeholders.push(
      `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5},
        $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10})`,
    );

    const parsedTimestamp = row.event_timestamp
      ? new Date(row.event_timestamp)
      : null;

    const safeTimestamp =
      parsedTimestamp && !isNaN(parsedTimestamp.getTime())
        ? parsedTimestamp
        : null;

    if (row.event_timestamp && !safeTimestamp) {
      logger.warn(`Invalid timestamp skipped: ${row.event_timestamp}`);
    }
    const parsedAmount = Number(row.amount);

    if (!Number.isFinite(parsedAmount)) {
      logger.warn(
        `Invalid amount detected: ${row.amount} for event_id: ${row.event_id} - defaulting to 0`,
      );
    }

    // Use the validated amount here
    values.push(
      row.event_id,
      row.merchant_id,
      safeTimestamp,
      row.product,
      row.event_type,
      Number.isFinite(parsedAmount) ? parsedAmount : 0, // <-- safe amount
      row.status,
      row.channel,
      row.region,
      row.merchant_tier,
    );
  });

  const query = `
    INSERT INTO merchant_activities (
      event_id,
      merchant_id,
      event_timestamp,
      product,
      event_type,
      amount,
      status,
      channel,
      region,
      merchant_tier
    )
    VALUES ${placeholders.join(',')}
    ON CONFLICT (event_id) DO NOTHING
  `;

  await client.query(query, values);
}

async function importFile(client: PoolClient, filePath: string) {
  return new Promise<void>((resolve, reject) => {
    const batch: ActivityRow[] = [];

    const stream = fs.createReadStream(filePath).pipe(csv());

    stream.on('data', async (row: ActivityRow) => {
      batch.push(row);

      if (batch.length >= BATCH_SIZE) {
        stream.pause();
        try {
          await insertBatch(client, batch.splice(0, BATCH_SIZE));
          stream.resume();
        } catch (err) {
          stream.destroy(err as Error);
        }
      }
    });

    stream.on('end', async () => {
      try {
        await insertBatch(client, batch);
        resolve();
      } catch (err) {
        reject(err);
      }
    });

    stream.on('error', reject);
  });
}

export async function runCsvImportIfNeeded(): Promise<void> {
  await createTableIfNotExists();

  if (!fs.existsSync(DATA_DIR)) {
    logger.warn('CSV import skipped. data/ directory not found');
    return;
  }

  const shouldImport = await isTableEmpty();
  if (!shouldImport) {
    logger.info('CSV import skipped. Table already contains data');
    return;
  }

  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.csv'));

  if (files.length === 0) {
    logger.warn('CSV import skipped. No CSV files found');
    return;
  }

  logger.info(`Starting CSV import. Files: ${files.length}`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const file of files) {
      const filePath = path.join(DATA_DIR, file);
      logger.info(`Importing ${file}`);
      await importFile(client, filePath);
    }

    await client.query('COMMIT');
    logger.info('CSV import completed successfully');
  } catch (error: any) {
    await client.query('ROLLBACK');
    logger.error('CSV import failed', error);
    throw error;
  } finally {
    client.release();
  }
}
