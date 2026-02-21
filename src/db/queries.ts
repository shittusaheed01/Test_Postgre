import { pool } from './pool';

/* =========================
   Response Types
========================= */

export interface TopMerchant {
  merchant_id: string;
  total_volume: number;
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
  documents_submitted: number;
  verifications_completed: number;
  tier_upgrades: number;
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
      ROUND(SUM(amount), 2) AS total_volume
    FROM merchant_activities
    WHERE status = 'SUCCESS'
      AND amount IS NOT NULL
      AND event_timestamp IS NOT NULL
    GROUP BY merchant_id
    ORDER BY total_volume DESC, merchant_id ASC
    LIMIT 1
  `;

  const { rows } = await pool.query<{
    merchant_id: string;
    total_volume: string;
  }>(query);

  if (!rows[0]) {
    return null;
  }

  return {
    merchant_id: rows[0].merchant_id,
    total_volume: Number(rows[0].total_volume),
  };
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
    const monthDate = new Date(row.month);
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

export async function getKycFunnel(): Promise<{
  documents_submitted: number;
  verifications_completed: number;
  tier_upgrades: number;
}> {
  const query = `
    SELECT
      COUNT(DISTINCT merchant_id)
        FILTER (WHERE product = 'KYC') AS documents_submitted,

      COUNT(DISTINCT merchant_id)
        FILTER (
          WHERE product = 'KYC'
          AND status = 'SUCCESS'
        ) AS verifications_completed,

      COUNT(DISTINCT merchant_id)
        FILTER (
          WHERE product = 'KYC'
          AND status = 'SUCCESS'
          AND merchant_tier IN ('VERIFIED', 'PREMIUM')
        ) AS tier_upgrades
    FROM merchant_activities
  `;

  const { rows } = await pool.query<{
    documents_submitted: string;
    verifications_completed: string;
    tier_upgrades: string;
  }>(query);

  return {
    documents_submitted: Number(rows[0]?.documents_submitted ?? 0),
    verifications_completed: Number(rows[0]?.verifications_completed ?? 0),
    tier_upgrades: Number(rows[0]?.tier_upgrades ?? 0),
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
    const failed = Number(row.failed_count ?? 0);
    const total = Number(row.total_count ?? 0);

    const rate = total === 0 ? 0 : Number(((failed / total) * 100).toFixed(1));

    return {
      product: row.product,
      failure_rate: rate,
    };
  });
}
