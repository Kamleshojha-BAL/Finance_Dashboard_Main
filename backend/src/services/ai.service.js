import db from "../config/db.js";

/* -----------------------------------------
AI ALERT DETECTION
------------------------------------------ */

export const detectFinanceAlerts = async () => {

  const [rows] = await db.execute(`
    SELECT
      KPI_CODE,
      KPI_NAME,
      VALUE,
      PERIOD,
      FYEAR
    FROM finance_kpi_results
    WHERE VALUE IS NOT NULL
    ORDER BY FYEAR DESC, PERIOD DESC
    LIMIT 32
  `);

  const alerts = [];

  // Group by KPI_CODE, compare consecutive periods
  const byKpi = {};
  rows.forEach(r => {
    if (!byKpi[r.KPI_CODE]) byKpi[r.KPI_CODE] = [];
    byKpi[r.KPI_CODE].push(r);
  });

  for (const [code, kpiRows] of Object.entries(byKpi)) {
    if (kpiRows.length < 2) continue;
    const current = kpiRows[0];
    const previous = kpiRows[1];

    if (Number(previous.VALUE) === 0) continue;

    const change =
      ((Number(current.VALUE) - Number(previous.VALUE)) / Math.abs(Number(previous.VALUE))) * 100;

    if (change > 10) {
      alerts.push(
        `⚠ ${current.KPI_NAME} increased ${change.toFixed(2)}% compared to last period`
      );
    }

    if (change < -5) {
      alerts.push(
        `⚠ ${current.KPI_NAME} dropped ${Math.abs(change).toFixed(2)}% compared to last period`
      );
    }
  }

  return alerts;
};

/* -----------------------------------------
AI INSIGHTS (Placeholder for OpenAI)
------------------------------------------ */

export const generateAIInsights = async () => {

  const [rows] = await db.execute(`
    SELECT
      KPI_CODE,
      KPI_NAME,
      VALUE,
      UNIT
    FROM finance_kpi_results
    ORDER BY FYEAR DESC, PERIOD DESC
    LIMIT 16
  `);

  return {
    message: "AI insights generation will be connected to OpenAI later",
    data: rows
  };
};
