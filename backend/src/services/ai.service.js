import db from "../config/db.js";

/* -----------------------------------------
AI ALERT DETECTION
------------------------------------------ */

export const detectFinanceAlerts = async () => {

const [rows] = await db.execute(`
SELECT 
  KPI_ID,
  KPI_VALUE,
  KPI_MONTH,
  KPI_YEAR
FROM kpi_transaction
ORDER BY KPI_YEAR DESC, KPI_MONTH DESC
LIMIT 12


`);

const alerts = [];

for (let i = 0; i < rows.length - 1; i++) {


const current = rows[i];
const previous = rows[i + 1];

if (!previous) continue;

const change =
  ((current.KPI_VALUE - previous.KPI_VALUE) / previous.KPI_VALUE) * 100;

if (change > 10) {

  alerts.push(
    `⚠ KPI ${current.KPI_ID} increased ${change.toFixed(2)}% compared to last month`
  );

}

if (change < -5) {

  alerts.push(
    `⚠ KPI ${current.KPI_ID} dropped ${Math.abs(change).toFixed(2)}% compared to last month`
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
  KPI_ID,
  KPI_VALUE
FROM kpi_transaction
ORDER BY KPI_YEAR DESC, KPI_MONTH DESC
LIMIT 5


`);

return {
message: "AI insights generation will be connected to OpenAI later",
data: rows
};

};
