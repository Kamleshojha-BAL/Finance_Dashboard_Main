import db from "../config/db.js";

/* ─────────────────────────────────────────────
   GL LABELS — from user's GL Master List
   ───────────────────────────────────────────── */

const GL_LABELS = {
  '0060101010': 'Dom Sale FeCr',
  '0060101016': 'Dom Sale Cr brqt',
  '0060102010': 'Exp Sale FeCr',
  '0060102020': 'Exp Third Party Sale',
  '0060102060': 'Duty Drawback',
  '0060105010': 'Sales Tailing',
  '0060201010': 'Int on Bank Deposits',
  '0060201020': 'Int on Investments',
  '0060201030': 'Interest on Others',
  '0060201040': 'Interest from Others',
  '0060202030': 'Realised Forex P/L',
  '0060202031': 'Manual Forex P/L',
  '0060202120': 'Sales Scrap',
  '0060202130': 'Creditors W/Back',
  '0060202140': 'Lia & Prov W/Back',
  '0060202150': 'Miscellanous Receipt',
  '0060202160': 'Insurance Claims',
  '0060202180': 'Asset Sale Clearing'
};

/* Revenue from Operations GLs */
const REVENUE_OPS_GLS = [
  '0060101010', '0060101016', '0060102010', '0060102020',
  '0060102060', '0060105010', '0060202120'
];

/* Other Income GLs */
const OTHER_INCOME_GLS = [
  '0060201010', '0060201020', '0060201030', '0060201040',
  '0060202130', '0060202140', '0060202150', '0060202160', '0060202180'
];

const toCrores = (val) => +(val / 10000000).toFixed(2);

/* ─────────────────────────────────────────────
   KPI METADATA — matches kpi_finance_master
   ───────────────────────────────────────────── */
const KPI_META = {
  1:  { name: 'Gross Profit Margin',   category: 'Profitability',    unit: '%',        target: '>=25%' },
  2:  { name: 'Net Profit Margin',     category: 'Profitability',    unit: '%',        target: '>=8%' },
  3:  { name: 'EBIT Margin',           category: 'Profitability',    unit: '%',        target: '>=10%' },
  4:  { name: 'Operating Ratio',       category: 'Cost Efficiency',  unit: '%',        target: '<85%' },
  5:  { name: 'EBITDA Margin',         category: 'Profitability',    unit: '%',        target: '>=15%' },
  6:  { name: 'ROA',                   category: 'Returns',          unit: '%',        target: '>=5%' },
  7:  { name: 'ROE',                   category: 'Returns',          unit: '%',        target: '>=12%' },
  8:  { name: 'ROI',                   category: 'Returns',          unit: '%',        target: '>=6%' },
  9:  { name: 'Depreciation Ratio',    category: 'Asset Management', unit: '%',        target: 'Monitor' },
  10: { name: 'CapEx Ratio',           category: 'Investment',       unit: '%',        target: '5-15%' },
  11: { name: 'Inventory Turnover',    category: 'Working Capital',  unit: 'Times',    target: '>=4x' },
  12: { name: 'EPS',                   category: 'Valuation',        unit: 'Rs',       target: 'Growth YoY' },
  13: { name: 'Operating Cash Flow',   category: 'Cash Flow',        unit: 'Rs Cr',    target: 'Positive' },
  14: { name: 'Free Cash Flow',        category: 'Cash Flow',        unit: 'Rs Cr',    target: 'Positive' },
  15: { name: 'Cash Position',         category: 'Liquidity',        unit: 'Rs Cr',    target: 'Adequate' },
  16: { name: 'Current Ratio',         category: 'Liquidity',        unit: 'Times',    target: '1.5-3.0x' }
};

/* ─────────────────────────────────────────────
   MAIN DASHBOARD API
   ───────────────────────────────────────────── */
export const getDashboardData = async (month, year) => {

  const dateFilter = month && year
    ? 'AND MONTH(POSTDATE) = ? AND YEAR(POSTDATE) = ?'
    : '';
  const dateParams = month && year ? [Number(month), Number(year)] : [];

  // Revenue from Operations
  const [revenueRows] = await db.execute(`
    SELECT GLNO, SUM(AMOUNTINCOMPANY) AS amount
    FROM zfi_finance_accounts_updated
    WHERE GLNO IN (${REVENUE_OPS_GLS.map(() => '?').join(',')})
    ${dateFilter}
    GROUP BY GLNO
    ORDER BY SUM(AMOUNTINCOMPANY) DESC
  `, [...REVENUE_OPS_GLS, ...dateParams]);

  // Other Income
  const [otherIncRows] = await db.execute(`
    SELECT GLNO, SUM(AMOUNTINCOMPANY) AS amount
    FROM zfi_finance_accounts_updated
    WHERE GLNO IN (${OTHER_INCOME_GLS.map(() => '?').join(',')})
    ${dateFilter}
    GROUP BY GLNO
    ORDER BY SUM(AMOUNTINCOMPANY) DESC
  `, [...OTHER_INCOME_GLS, ...dateParams]);

  // Totals
  const totalRevenueOps = revenueRows.reduce((s, r) => s + Number(r.amount), 0);
  const totalOtherIncome = otherIncRows.reduce((s, r) => s + Number(r.amount), 0);
  const totalRevenue = totalRevenueOps + totalOtherIncome;

  // Export vs Domestic
  const domesticRevenue = revenueRows
    .filter(r => ['0060101010', '0060101016'].includes(r.GLNO))
    .reduce((s, r) => s + Number(r.amount), 0);
  const exportRevenue = revenueRows
    .filter(r => ['0060102010', '0060102020'].includes(r.GLNO))
    .reduce((s, r) => s + Number(r.amount), 0);

  // 16 KPIs from kpi_finance_transaction
  const kpis = await getKPIData(month, year);

  const revenueSummary = {
    revenueFromOps: { value: totalRevenueOps, crores: toCrores(totalRevenueOps) },
    otherIncome: { value: totalOtherIncome, crores: toCrores(totalOtherIncome) },
    totalRevenue: { value: totalRevenue, crores: toCrores(totalRevenue) },
    domesticRevenue: { value: domesticRevenue, crores: toCrores(domesticRevenue) },
    exportRevenue: { value: exportRevenue, crores: toCrores(exportRevenue) },
    exportPct: totalRevenueOps > 0 ? +((exportRevenue / totalRevenueOps) * 100).toFixed(1) : 0,
    domesticPct: totalRevenueOps > 0 ? +((domesticRevenue / totalRevenueOps) * 100).toFixed(1) : 0
  };

  const revenueBreakdown = revenueRows.map(r => ({
    glno: r.GLNO,
    label: GL_LABELS[r.GLNO] || r.GLNO,
    amount: Number(r.amount),
    crores: toCrores(Number(r.amount))
  }));

  const otherIncomeBreakdown = otherIncRows
    .filter(r => Number(r.amount) !== 0)
    .map(r => ({
      glno: r.GLNO,
      label: GL_LABELS[r.GLNO] || r.GLNO,
      amount: Number(r.amount),
      crores: toCrores(Number(r.amount))
    }));

  return {
    revenueSummary,
    revenueBreakdown,
    otherIncomeBreakdown,
    kpis
  };
};

/* ─────────────────────────────────────────────
   P&L TREND (Monthly)
   ───────────────────────────────────────────── */
export const getPLTrend = async () => {

  const [rows] = await db.execute(`
    SELECT
      MONTH(POSTDATE) AS month,
      YEAR(POSTDATE) AS year,
      SUM(CASE WHEN GLNO IN (${REVENUE_OPS_GLS.map(() => '?').join(',')}) THEN AMOUNTINCOMPANY ELSE 0 END) AS revenueFromOps,
      SUM(CASE WHEN GLNO IN (${OTHER_INCOME_GLS.map(() => '?').join(',')}) THEN AMOUNTINCOMPANY ELSE 0 END) AS otherIncome,
      SUM(AMOUNTINCOMPANY) AS totalRevenue
    FROM zfi_finance_accounts_updated
    GROUP BY YEAR(POSTDATE), MONTH(POSTDATE)
    ORDER BY YEAR(POSTDATE), MONTH(POSTDATE)
  `, [...REVENUE_OPS_GLS, ...OTHER_INCOME_GLS]);

  return rows.map(r => ({
    month: r.month,
    year: r.year,
    label: `${['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][r.month]} ${r.year}`,
    revenueFromOps: toCrores(Number(r.revenueFromOps)),
    otherIncome: toCrores(Number(r.otherIncome)),
    totalRevenue: toCrores(Number(r.totalRevenue))
  }));
};

/* ─────────────────────────────────────────────
   REVENUE MIX (Pie Chart)
   ───────────────────────────────────────────── */
export const getRevenueMix = async (month, year) => {

  const dateFilter = month && year
    ? 'AND MONTH(POSTDATE) = ? AND YEAR(POSTDATE) = ?'
    : '';
  const dateParams = month && year ? [Number(month), Number(year)] : [];

  const [rows] = await db.execute(`
    SELECT GLNO, SUM(AMOUNTINCOMPANY) AS revenue
    FROM zfi_finance_accounts_updated
    WHERE GLNO IN (${REVENUE_OPS_GLS.map(() => '?').join(',')})
    ${dateFilter}
    GROUP BY GLNO
    ORDER BY SUM(AMOUNTINCOMPANY) DESC
  `, [...REVENUE_OPS_GLS, ...dateParams]);

  return rows
    .filter(r => Number(r.revenue) > 0)
    .map(r => ({
      name: GL_LABELS[r.GLNO] || r.GLNO,
      glno: r.GLNO,
      value: toCrores(Number(r.revenue)),
      amount: Number(r.revenue)
    }));
};

/* ─────────────────────────────────────────────
   COST STRUCTURE (needs 7xxx series)
   ───────────────────────────────────────────── */
export const getCostStructure = async () => {
  const [rows] = await db.execute(`
    SELECT GLNO, ABS(SUM(AMOUNTINCOMPANY)) AS amount
    FROM zfi_finance_accounts_updated
    WHERE GLNO LIKE '007%' OR GLNO LIKE '7%'
    GROUP BY GLNO
    ORDER BY ABS(SUM(AMOUNTINCOMPANY)) DESC
    LIMIT 10
  `);

  if (rows.length === 0) {
    return { status: 'pending', message: 'Awaiting 7xxx GL series.', data: [] };
  }
  return { status: 'active', data: rows };
};

/* ─────────────────────────────────────────────
   DAILY REVENUE TREND
   ───────────────────────────────────────────── */
export const getDailyRevenueTrend = async () => {
  const [rows] = await db.execute(`
    SELECT POSTDATE AS date, SUM(AMOUNTINCOMPANY) AS dailyRevenue
    FROM zfi_finance_accounts_updated
    WHERE GLNO IN (${REVENUE_OPS_GLS.map(() => '?').join(',')})
    GROUP BY POSTDATE
    ORDER BY POSTDATE
  `, REVENUE_OPS_GLS);

  return rows.map(r => ({
    date: r.date,
    revenue: toCrores(Number(r.dailyRevenue))
  }));
};

/* ─────────────────────────────────────────────
   REFRESH KPI — calls the stored procedure
   ───────────────────────────────────────────── */
export const refreshKPI = async (month, year, empId) => {
  await db.execute("CALL SP_REFRESH_FINANCE_KPI_TRANSACTION(?,?,?)", [
    Number(month), Number(year), empId || 'SYSTEM'
  ]);
  return { refreshed: true, month, year };
};

/* ─────────────────────────────────────────────
   GET KPI FORMULA VALUES — raw component values for formula breakdown
   ───────────────────────────────────────────── */
export const getKPIFormulaValues = async (month, year) => {
  if (!month || !year) return {};
  const m = Number(month), y = Number(year);

  const sumGL = async (whereClause, params = []) => {
    const [rows] = await db.execute(
      `SELECT COALESCE(SUM(AMOUNTINCOMPANY), 0) AS total FROM zfi_finance_accounts_updated WHERE ${whereClause} AND MONTH(POSTDATE) = ? AND YEAR(POSTDATE) = ?`,
      [...params, m, y]
    );
    return Number(rows[0].total);
  };

  const glSum = async (glnos) => {
    const [rows] = await db.execute(
      `SELECT GLNO, COALESCE(SUM(AMOUNTINCOMPANY), 0) AS total FROM zfi_finance_accounts_updated WHERE GLNO IN (${glnos.map(() => '?').join(',')}) AND MONTH(POSTDATE) = ? AND YEAR(POSTDATE) = ? GROUP BY GLNO`,
      [...glnos, m, y]
    );
    const result = {};
    glnos.forEach(gl => { result[gl] = 0; });
    rows.forEach(r => { result[r.GLNO] = Number(r.total); });
    return result;
  };

  // Get individual GL values for revenue & other income
  const revGLValues = await glSum(REVENUE_OPS_GLS);
  const otherGLValues = await glSum(OTHER_INCOME_GLS);

  const revOps = Object.values(revGLValues).reduce((s, v) => s + v, 0);
  const otherIncome = Object.values(otherGLValues).reduce((s, v) => s + v, 0);
  const totalRevenue = revOps + otherIncome;

  // Expense components
  const cogs = await sumGL(
    `(GLNO BETWEEN '0070101010' AND '0070101999' OR GLNO BETWEEN '0070301000' AND '0070301999' OR GLNO BETWEEN '0070401010' AND '0070401999' OR GLNO BETWEEN '0070501020' AND '0070501999' OR GLNO BETWEEN '0070801010' AND '0070801999' OR GLNO BETWEEN '0070802000' AND '0070802999' OR GLNO BETWEEN '0070806000' AND '0070806999' OR GLNO BETWEEN '0070812010' AND '0070812999' OR GLNO BETWEEN '0070803000' AND '0070803999')`
  );
  const depreciation = await sumGL(`GLNO BETWEEN '0070601010' AND '0070601999'`);
  const financeCost = await sumGL(`GLNO BETWEEN '0070701000' AND '0070701999'`);
  const totalExpenses = await sumGL(`GLNO BETWEEN '0070000000' AND '0079999999'`);

  // Balance sheet
  const totalAssets = await sumGL(`GLNO BETWEEN '0040000000' AND '0059999999'`);
  const equity = await sumGL(`GLNO BETWEEN '0010000000' AND '0019999999'`);
  const currentAssets = await sumGL(`GLNO BETWEEN '0050000000' AND '0059999999'`);
  const currentLiab = await sumGL(`GLNO BETWEEN '0030000000' AND '0039999999'`);
  const inventory = await sumGL(`GLNO BETWEEN '0050200000' AND '0050299999'`);
  const cash = await sumGL(`GLNO BETWEEN '0050401110' AND '0050402122'`);
  const capex = await sumGL(`GLNO BETWEEN '0040301000' AND '0040399999'`);

  const invIncomeGLs = await glSum(['0060201010', '0060201020']);
  const invIncome = Object.values(invIncomeGLs).reduce((s, v) => s + v, 0);
  const investments = await sumGL(`(GLNO BETWEEN '0040200000' AND '0040299999' OR GLNO = '0050601512')`);

  const netIncome = totalRevenue - totalExpenses;
  const shares = 93325411;
  const cr = (v) => `Rs ${(v / 10000000).toFixed(2)} Cr`;
  const pct = (v) => `${v.toFixed(2)}%`;

  // Export breakdown
  const expSaleFeCr = revGLValues['0060102010'] || 0;
  const expThirdParty = revGLValues['0060102020'] || 0;
  const exportTotal = expSaleFeCr + expThirdParty;

  // Build formula values per KPI
  const formulaValues = {
    1: { // GP Margin
      revOps: cr(revOps), cogs: cr(cogs),
      grossProfit: cr(revOps - cogs),
      result: revOps !== 0 ? pct((revOps - cogs) / revOps * 100) : '--'
    },
    2: { // NP Margin
      totalRevenue: cr(totalRevenue), totalExpenses: cr(totalExpenses),
      netProfit: cr(netIncome),
      result: totalRevenue !== 0 ? pct((totalRevenue - totalExpenses) / totalRevenue * 100) : '--'
    },
    3: { // EBIT
      revOps: cr(revOps), totalExpenses: cr(totalExpenses),
      financeCost: cr(financeCost), depreciation: cr(depreciation),
      ebit: cr(revOps - totalExpenses + financeCost + depreciation),
      result: revOps !== 0 ? pct((revOps - totalExpenses + financeCost + depreciation) / revOps * 100) : '--'
    },
    4: { // Operating Ratio
      totalExpenses: cr(totalExpenses), financeCost: cr(financeCost),
      depreciation: cr(depreciation),
      opex: cr(totalExpenses - financeCost - depreciation),
      totalRevenue: cr(totalRevenue),
      result: totalRevenue !== 0 ? pct((totalExpenses - financeCost - depreciation) / totalRevenue * 100) : '--'
    },
    5: { // EBITDA
      revOps: cr(revOps), totalExpenses: cr(totalExpenses),
      financeCost: cr(financeCost), depreciation: cr(depreciation),
      ebitda: cr(revOps - totalExpenses + financeCost + depreciation + depreciation),
      result: revOps !== 0 ? pct((revOps - totalExpenses + financeCost + depreciation + depreciation) / revOps * 100) : '--'
    },
    6: { // ROA
      netIncome: cr(netIncome), totalAssets: cr(totalAssets),
      result: totalAssets !== 0 ? pct(netIncome / totalAssets * 100) : '--'
    },
    7: { // ROE
      netIncome: cr(netIncome), equity: cr(equity),
      result: equity !== 0 ? pct(netIncome / equity * 100) : '--'
    },
    8: { // ROI
      invIncome: cr(invIncome), investments: cr(investments),
      result: investments !== 0 ? pct(invIncome / investments * 100) : '--'
    },
    9: { accDep: '--', grossAssets: '--', result: '--' },
    10: { // CapEx Ratio
      capex: cr(capex), totalRevenue: cr(totalRevenue),
      result: totalRevenue !== 0 ? pct(capex / totalRevenue * 100) : '--'
    },
    11: { // Inventory Turnover
      cogs: cr(cogs), inventory: cr(inventory),
      result: inventory !== 0 ? `${(cogs / inventory).toFixed(2)}x` : '--'
    },
    12: { // EPS
      totalRevenue: cr(totalRevenue), totalExpenses: cr(totalExpenses),
      netIncome: cr(netIncome),
      shares: '9,33,25,411',
      result: `Rs ${(netIncome / shares).toFixed(2)}`
    },
    13: { // OCF
      netIncome: cr(netIncome), depreciation: cr(depreciation),
      ocfRaw: cr(netIncome + depreciation),
      result: `Rs ${((netIncome + depreciation) / 10000000).toFixed(2)} Cr`
    },
    14: { // FCF
      netIncome: cr(netIncome), depreciation: cr(depreciation), capex: cr(capex),
      fcfRaw: cr(netIncome + depreciation - capex),
      result: `Rs ${((netIncome + depreciation - capex) / 10000000).toFixed(2)} Cr`
    },
    15: { // Cash Position
      cashRaw: cr(cash),
      result: `Rs ${(cash / 10000000).toFixed(2)} Cr`
    },
    16: { // Current Ratio
      currentAssets: cr(currentAssets), currentLiab: cr(currentLiab),
      result: currentLiab !== 0 ? `${(currentAssets / currentLiab).toFixed(2)}x` : '--'
    },
    // Revenue card popups
    101: {
      ...Object.fromEntries(REVENUE_OPS_GLS.map(gl => [`gl_${gl}`, cr(revGLValues[gl] || 0)])),
      result: cr(revOps)
    },
    102: {
      ...Object.fromEntries(OTHER_INCOME_GLS.map(gl => [`gl_${gl}`, cr(otherGLValues[gl] || 0)])),
      result: cr(otherIncome)
    },
    103: {
      revOps: cr(revOps), otherIncome: cr(otherIncome),
      result: cr(totalRevenue)
    },
    104: {
      expSaleFeCr: cr(expSaleFeCr), expThirdParty: cr(expThirdParty),
      exportTotal: cr(exportTotal), revOps: cr(revOps),
      result: revOps !== 0 ? pct(exportTotal / revOps * 100) : '--'
    }
  };

  return formulaValues;
};

/* ─────────────────────────────────────────────
   GET KPI DATA — from kpi_finance_transaction
   ───────────────────────────────────────────── */
export const getKPIData = async (month, year) => {
  if (!month || !year) return [];

  const [rows] = await db.execute(`
    SELECT t.KPI_ID, t.KPI_VALUE
    FROM kpi_finance_transaction t
    WHERE t.KPI_MONTH = ? AND t.KPI_YEAR = ?
    ORDER BY t.KPI_ID
  `, [Number(month), Number(year)]);

  return Array.from({ length: 16 }, (_, i) => {
    const id = i + 1;
    const meta = KPI_META[id];
    const row = rows.find(r => r.KPI_ID === id);
    const rawVal = row && row.KPI_VALUE !== null ? Number(row.KPI_VALUE) : null;
    const value = rawVal !== null && !isNaN(rawVal) ? rawVal : null;
    return {
      id,
      name: meta.name,
      category: meta.category,
      value,
      unit: meta.unit,
      target: meta.target,
      status: value !== null ? 'active' : 'pending'
    };
  });
};
