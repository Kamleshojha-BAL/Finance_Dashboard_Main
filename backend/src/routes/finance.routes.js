import express from "express";

import {
  refreshDashboard,
  getFinanceDashboard,
  getPLTrend,
  getCostStructure,
  getRevenueMix,
  getKPIFormulaValues,
  getAIInsights,
  getAIAlerts,
  getProfitabilityBreakdown,
  getTrialBalanceSummary,
  getFiscalYears
} from "../controllers/finance.controller.js";

const router = express.Router();

/* Dashboard Refresh */
router.post("/refresh-dashboard", refreshDashboard);

/* KPI Dashboard */
router.get("/dashboard", getFinanceDashboard);

/* Charts */
router.get("/pl-trend", getPLTrend);
router.get("/cost-structure", getCostStructure);
router.get("/revenue-mix", getRevenueMix);

/* KPI Formula Values */
router.get("/kpi-formula-values", getKPIFormulaValues);

/* AI */
router.get("/ai-insights", getAIInsights);
router.get("/ai-alerts", getAIAlerts);

/* Profitability Breakdown */
router.get("/profitability-breakdown", getProfitabilityBreakdown);

/* Trial Balance Summary */
router.get("/trial-balance", getTrialBalanceSummary);

/* Fiscal Years */
router.get("/fiscal-years", getFiscalYears);

export default router;
