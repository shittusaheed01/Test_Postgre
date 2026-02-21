import { Router, Request, Response, NextFunction } from 'express';
import {
  fetchTopMerchant,
  fetchMonthlyActiveMerchants,
  fetchProductAdoption,
  fetchKycFunnel,
  fetchFailureRates,
} from '../services/analyticsService';

const router = Router();

/* =========================
   GET /analytics/top-merchant
========================= */
router.get(
  '/top-merchant',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await fetchTopMerchant();

      if (!result) {
        return res.status(200).json({
          message: 'No merchant data available',
        });
      }

      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

/* =========================
   GET /analytics/monthly-active-merchants
========================= */
router.get(
  '/monthly-active-merchants',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await fetchMonthlyActiveMerchants();
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

/* =========================
   GET /analytics/product-adoption
========================= */
router.get(
  '/product-adoption',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await fetchProductAdoption();
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

/* =========================
   GET /analytics/kyc-funnel
========================= */
router.get(
  '/kyc-funnel',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await fetchKycFunnel();
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

/* =========================
   GET /analytics/failure-rates
========================= */
router.get(
  '/failure-rates',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await fetchFailureRates();
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
