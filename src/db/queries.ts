import { pool } from './pool';

/* =========================
   Response Types
========================= */

export interface TopMerchant {
  merchant_id: string;
  total_volume: string; // numeric comes back as string from pg
}

export interface MonthlyActiveMerchant {
  month: string; // ISO date string (first day of month)
  active_merchants: number;
}

export interface ProductAdoption {
  product: string;
  merchant_count: number;
}

export interface KycFunnel {
  started: number;
  completed: number;
  conversion_rate: number; // percentage
}

export interface FailureRate {
  product: string;
  failure_rate: number; // percentage
}

/* =========================
   1. Top Merchant
========================= */

export async function getTopMerchant(): Promise<TopMerchant | null> {
  const query = `
    SELECT
      merchant_id,
      SUM(amount) AS total_volume
    FROM merchant_activities
    WHERE status = 'SUCCESS'
      AND amount IS NOT NULL
      AND event_timestamp IS NOT NULL
    GROUP BY merchant_id
    ORDER BY total_volume DESC, merchant_id ASC
    LIMIT 1
  `;

  const { rows } = await pool.query<TopMerchant>(query);

  return rows[0] ?? null;
}

/* =========================
   2. Monthly Active Merchants
========================= */

export async function getMonthlyActiveMerchants(): Promise<
  MonthlyActiveMerchant[]
> {
  const query = `
    SELECT
      DATE_TRUNC('month', event_timestamp AT TIME ZONE 'Africa/Lagos')::date AS month,
      COUNT(DISTINCT merchant_id) AS active_merchants
    FROM merchant_activities
    WHERE event_timestamp IS NOT NULL
    GROUP BY month
    ORDER BY month
  `;

  const { rows } = await pool.query<{ month: Date; active_merchants: string }>(
    query,
  );

  return rows.map((row) => {
    const monthDate = new Date(row.month); // already in local timezone thanks to AT TIME ZONE
    const year = monthDate.getFullYear();
    const month = String(monthDate.getMonth() + 1).padStart(2, '0');

    return {
      month: `${year}-${month}`,
      active_merchants: Number(row.active_merchants),
    };
  });
}

/* =========================
   3. Product Adoption
========================= */

export async function getProductAdoption(): Promise<ProductAdoption[]> {
  const query = `
    SELECT
      product,
      COUNT(DISTINCT merchant_id) AS merchant_count
    FROM merchant_activities
    GROUP BY product
    ORDER BY merchant_count DESC
  `;

  const { rows } = await pool.query(query);

  return rows.map((row) => ({
    product: row.product,
    merchant_count: Number(row.merchant_count),
  }));
}

/* =========================
   4. KYC Funnel
========================= */

export async function getKycFunnel(): Promise<KycFunnel> {
  const query = `
    SELECT
      COUNT(DISTINCT merchant_id) AS started,
      COUNT(DISTINCT merchant_id)
        FILTER (WHERE status = 'SUCCESS') AS completed
    FROM merchant_activities
    WHERE product = 'KYC'
  `;

  const { rows } = await pool.query(query);

  const started = Number(rows[0]?.started ?? 0);
  const completed = Number(rows[0]?.completed ?? 0);

  const conversion_rate =
    started === 0 ? 0 : Number(((completed / started) * 100).toFixed(2));

  return {
    started,
    completed,
    conversion_rate,
  };
}

/* =========================
   5. Failure Rates
========================= */

export async function getFailureRates(): Promise<FailureRate[]> {
  const query = `
    SELECT
      product,
      COUNT(*) FILTER (WHERE status = 'FAILED') AS failed_count,
      COUNT(*) AS total_count
    FROM merchant_activities
    GROUP BY product
  `;

  const { rows } = await pool.query(query);

  return rows.map((row) => {
    const failed = Number(row.failed_count);
    const total = Number(row.total_count);

    const rate = total === 0 ? 0 : Number(((failed / total) * 100).toFixed(2));

    return {
      product: row.product,
      failure_rate: rate,
    };
  });
}
