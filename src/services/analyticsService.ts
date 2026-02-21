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
  {
    month: string;
    active_merchants: number;
  }[]
> {
  const rows: MonthlyActiveMerchant[] = await getMonthlyActiveMerchants();

  return rows.map((row) => ({
    month: row.month,
    active_merchants: row.active_merchants,
  }));
}

/* =========================
   Product Adoption
========================= */

export async function fetchProductAdoption(): Promise<
  {
    product: string;
    merchants: number;
  }[]
> {
  const rows: ProductAdoption[] = await getProductAdoption();

  return rows.map((row) => ({
    product: row.product,
    merchants: row.merchant_count,
  }));
}

/* =========================
   KYC Funnel
========================= */

export async function fetchKycFunnel(): Promise<{
  started: number;
  completed: number;
  conversion_rate: number;
}> {
  const funnel: KycFunnel = await getKycFunnel();

  return {
    started: funnel.started,
    completed: funnel.completed,
    conversion_rate: funnel.conversion_rate,
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
