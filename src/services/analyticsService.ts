import {
  getTopMerchant,
  getMonthlyActiveMerchants,
  getProductAdoption,
  getKycFunnel,
  getFailureRates,
  TopMerchant,
  MonthlyActiveMerchant,
  ProductAdoption,
  KycFunnel,
  FailureRate,
} from '../db/queries';

/* =========================
   Top Merchant
========================= */

export async function fetchTopMerchant(): Promise<{
  merchant_id: string;
  total_volume: number;
} | null> {
  const result = await getTopMerchant();

  if (!result) {
    return null;
  }

  return {
    merchant_id: result.merchant_id,
    total_volume: Number(result.total_volume),
  };
}

/* =========================
   Monthly Active Merchants
========================= */

export async function fetchMonthlyActiveMerchants(): Promise<
  Record<string, number>
> {
  const rows: MonthlyActiveMerchant[] = await getMonthlyActiveMerchants();

  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.month] = row.active_merchants;
    return acc;
  }, {});
}

/* =========================
   Product Adoption
========================= */

export async function fetchProductAdoption(): Promise<Record<string, number>> {
  const rows: ProductAdoption[] = await getProductAdoption();

  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.product] = row.merchant_count;
    return acc;
  }, {});
}

/* =========================
   KYC Funnel
========================= */

export async function fetchKycFunnel(): Promise<{
  documents_submitted: number;
  verifications_completed: number;
  tier_upgrades: number;
}> {
  const funnel: KycFunnel = await getKycFunnel();

  return {
    documents_submitted: funnel.documents_submitted,
    verifications_completed: funnel.verifications_completed,
    tier_upgrades: funnel.tier_upgrades,
  };
}

/* =========================
   Failure Rates
========================= */

export async function fetchFailureRates(): Promise<
  {
    product: string;
    failure_rate: number;
  }[]
> {
  const rows: FailureRate[] = await getFailureRates();

  return rows.map((row) => ({
    product: row.product,
    failure_rate: row.failure_rate,
  }));
}
