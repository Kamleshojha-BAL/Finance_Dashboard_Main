import db from "../config/db.js";

/* ─────────────────────────────────────────────
   CALENDAR → SAP PERIOD CONVERSION
   SAP FY starts April. Apr=001, May=002 … Mar=012
   ───────────────────────────────────────────── */
function toSAPPeriod(calMonth, calYear) {
  const m = Number(calMonth), y = Number(calYear);
  if (m >= 4) return { period: String(m - 3).padStart(3, '0'), fyear: String(y) };
  return { period: String(m + 9).padStart(3, '0'), fyear: String(y - 1) };
}

const toCrores = (val) => +(val / 10000000).toFixed(2);

/* KPI_CODE → numeric ID mapping (frontend expects integer IDs 1-16) */
const KPI_CODE_TO_ID = {
  GP_MARGIN: 1, NP_MARGIN: 2, EBIT_MARGIN: 3, OP_RATIO: 4, EBITDA_MARGIN: 5,
  ROA: 6, ROE: 7, ROI: 8, DEP_RATIO: 9, CAPEX_RATIO: 10, INV_TURNOVER: 11,
  EPS: 12, OCF: 13, FCF: 14, CASH_POS: 15, CURRENT_RATIO: 16
};

/* Target thresholds per KPI ID */
const KPI_TARGETS = {
  1: '>=25%', 2: '>=8%', 3: '>=10%', 4: '<85%', 5: '>=15%',
  6: '>=5%', 7: '>=12%', 8: '>=6%', 9: 'Monitor', 10: '5-15%',
  11: '>=4x', 12: 'Growth YoY', 13: 'Positive', 14: 'Positive',
  15: 'Adequate', 16: '1.5-3.0x'
};

/* ─────────────────────────────────────────────
   GET KPI DATA — from finance_kpi_results
   ───────────────────────────────────────────── */
export const getKPIData = async (month, year) => {
  if (!month || !year) return [];

  const { period, fyear } = toSAPPeriod(month, year);

  const [rows] = await db.execute(
    `SELECT KPI_CODE, KPI_NAME, KPI_CATEGORY, VALUE, UNIT, NUMERATOR, DENOMINATOR
     FROM finance_kpi_results
     WHERE PERIOD = ? AND FYEAR = ?
     ORDER BY KPI_CODE`,
    [period, fyear]
  );

  // Build lookup from DB rows
  const rowMap = {};
  rows.forEach(r => { rowMap[r.KPI_CODE] = r; });

  // Return array of 16 KPIs with numeric IDs for frontend
  return Object.entries(KPI_CODE_TO_ID).map(([code, id]) => {
    const row = rowMap[code];
    const value = row && row.VALUE !== null ? Number(row.VALUE) : null;
    return {
      id,
      name: row ? row.KPI_NAME : code,
      category: row ? row.KPI_CATEGORY : '',
      value,
      unit: row ? row.UNIT : '',
      target: KPI_TARGETS[id] || '',
      numerator: row && row.NUMERATOR !== null ? Number(row.NUMERATOR) : null,
      denominator: row && row.DENOMINATOR !== null ? Number(row.DENOMINATOR) : null,
      status: value !== null ? 'active' : 'pending'
    };
  });
};

/* ─────────────────────────────────────────────
   MAIN DASHBOARD API
   ───────────────────────────────────────────── */
export const getDashboardData = async (month, year) => {
  if (!month || !year) return { revenueSummary: {}, revenueBreakdown: [], otherIncomeBreakdown: [], kpis: [] };

  const { period, fyear } = toSAPPeriod(month, year);

  // Get all Revenue rows from finance_period_summary
  const [revRows] = await db.execute(
    `SELECT GLNO, GL_DESC, CATEGORY, NET_AMOUNT
     FROM finance_period_summary
     WHERE PERIOD = ? AND FYEAR = ? AND PL_GROUP = 'Revenue'
     ORDER BY ABS(NET_AMOUNT) DESC`,
    [period, fyear]
  );

  // Split by category
  const revenueOpsRows = revRows.filter(r => r.CATEGORY === 'Rev. from Operation');
  const otherIncRows = revRows.filter(r => r.CATEGORY === 'Other Income');

  const totalRevenueOps = revenueOpsRows.reduce((s, r) => s + Number(r.NET_AMOUNT), 0);
  const totalOtherIncome = otherIncRows.reduce((s, r) => s + Number(r.NET_AMOUNT), 0);
  const totalRevenue = totalRevenueOps + totalOtherIncome;

  // Export vs Domestic
  const exportGLs = ['0060102010', '0060102020'];
  const domesticGLs = ['0060101010', '0060101016'];

  const exportRevenue = revenueOpsRows
    .filter(r => exportGLs.includes(r.GLNO))
    .reduce((s, r) => s + Number(r.NET_AMOUNT), 0);
  const domesticRevenue = revenueOpsRows
    .filter(r => domesticGLs.includes(r.GLNO))
    .reduce((s, r) => s + Number(r.NET_AMOUNT), 0);

  // 16 KPIs
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

  const revenueBreakdown = revenueOpsRows.map(r => ({
    glno: r.GLNO,
    label: r.GL_DESC || r.GLNO,
    amount: Number(r.NET_AMOUNT),
    crores: toCrores(Number(r.NET_AMOUNT))
  }));

  const otherIncomeBreakdown = otherIncRows
    .filter(r => Number(r.NET_AMOUNT) !== 0)
    .map(r => ({
      glno: r.GLNO,
      label: r.GL_DESC || r.GLNO,
      amount: Number(r.NET_AMOUNT),
      crores: toCrores(Number(r.NET_AMOUNT))
    }));

  return { revenueSummary, revenueBreakdown, otherIncomeBreakdown, kpis };
};

/* ─────────────────────────────────────────────
   P&L TREND (Monthly) — from finance_period_summary
   ───────────────────────────────────────────── */
export const getPLTrend = async () => {
  const [rows] = await db.execute(`
    SELECT
      PERIOD, FYEAR,
      SUM(CASE WHEN CATEGORY = 'Rev. from Operation' THEN NET_AMOUNT ELSE 0 END) AS revenueFromOps,
      SUM(CASE WHEN CATEGORY != 'Rev. from Operation' THEN NET_AMOUNT ELSE 0 END) AS otherIncome,
      SUM(NET_AMOUNT) AS totalRevenue
    FROM finance_period_summary
    WHERE PL_GROUP = 'Revenue'
    GROUP BY FYEAR, PERIOD
    ORDER BY FYEAR, PERIOD
  `);

  // Convert SAP period back to calendar month for display
  const periodToMonth = (period, fyear) => {
    const p = Number(period);
    const fy = Number(fyear);
    if (p <= 9) return { month: p + 3, year: fy };
    return { month: p - 9, year: fy + 1 };
  };

  const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return rows.map(r => {
    const { month, year } = periodToMonth(r.PERIOD, r.FYEAR);
    return {
      month,
      year,
      label: `${MONTH_NAMES[month]} ${year}`,
      revenueFromOps: toCrores(Number(r.revenueFromOps)),
      otherIncome: toCrores(Number(r.otherIncome)),
      totalRevenue: toCrores(Number(r.totalRevenue))
    };
  });
};

/* ─────────────────────────────────────────────
   REVENUE MIX (Pie Chart)
   ───────────────────────────────────────────── */
export const getRevenueMix = async (month, year) => {
  if (!month || !year) return [];

  const { period, fyear } = toSAPPeriod(month, year);

  const [rows] = await db.execute(
    `SELECT GLNO, GL_DESC, NET_AMOUNT
     FROM finance_period_summary
     WHERE PERIOD = ? AND FYEAR = ? AND CATEGORY = 'Rev. from Operation'
     ORDER BY ABS(NET_AMOUNT) DESC`,
    [period, fyear]
  );

  return rows
    .filter(r => Number(r.NET_AMOUNT) > 0)
    .map(r => ({
      name: r.GL_DESC || r.GLNO,
      glno: r.GLNO,
      value: toCrores(Number(r.NET_AMOUNT)),
      amount: Number(r.NET_AMOUNT)
    }));
};

/* ─────────────────────────────────────────────
   COST STRUCTURE — from finance_period_summary 7series
   ───────────────────────────────────────────── */
export const getCostStructure = async (month, year) => {
  const params = [];
  let periodFilter = '';

  if (month && year) {
    const { period, fyear } = toSAPPeriod(month, year);
    periodFilter = 'AND PERIOD = ? AND FYEAR = ?';
    params.push(period, fyear);
  }

  const [rows] = await db.execute(`
    SELECT CATEGORY, SUM(ABS(NET_AMOUNT)) AS amount
    FROM finance_period_summary
    WHERE PL_GROUP = 'Expense' ${periodFilter}
    GROUP BY CATEGORY
    ORDER BY SUM(ABS(NET_AMOUNT)) DESC
  `, params);

  if (rows.length === 0) {
    return { status: 'pending', message: 'No expense data available.', data: [] };
  }

  return {
    status: 'active',
    data: rows.map(r => ({
      category: r.CATEGORY,
      amount: Number(r.amount),
      crores: toCrores(Number(r.amount))
    }))
  };
};

/* ─────────────────────────────────────────────
   REFRESH KPI — calls sp_build_finance_summary
   ───────────────────────────────────────────── */
export const refreshKPI = async (month, year) => {
  const { period, fyear } = toSAPPeriod(month, year);
  await db.execute("CALL sp_build_finance_summary(?, ?)", [period, fyear]);
  return { refreshed: true, period, fyear, month, year };
};

/* ─────────────────────────────────────────────
   GET KPI FORMULA VALUES — component values for modal
   ───────────────────────────────────────────── */
export const getKPIFormulaValues = async (month, year) => {
  if (!month || !year) return {};

  const { period, fyear } = toSAPPeriod(month, year);

  // Single query to get all summary rows for the period
  const [allRows] = await db.execute(
    `SELECT GLNO, GL_DESC, CATEGORY, BS_GROUP, PL_GROUP, NET_AMOUNT
     FROM finance_period_summary
     WHERE PERIOD = ? AND FYEAR = ?`,
    [period, fyear]
  );

  // Helper: sum NET_AMOUNT for rows matching a filter
  const sumBy = (filterFn) => allRows.filter(filterFn).reduce((s, r) => s + Number(r.NET_AMOUNT), 0);

  // Revenue components
  const revOps = sumBy(r => r.CATEGORY === 'Rev. from Operation');
  const otherIncome = sumBy(r => r.CATEGORY === 'Other Income');
  const totalRevenue = revOps + otherIncome;

  // Expense components from 7series
  const cogs = sumBy(r => r.CATEGORY === 'Cost of Material Consumed');
  const changesInInv = sumBy(r => r.CATEGORY === 'Changes in Inventories');
  const employeeCost = sumBy(r => r.CATEGORY === 'Employee Cost');
  const powerCost = sumBy(r => r.CATEGORY === 'Power & Fuel Cost');
  const otherExp = sumBy(r => r.CATEGORY === 'Other Expenses');
  const depreciation = sumBy(r => r.CATEGORY === 'Depreciation');
  const financeCost = sumBy(r => r.CATEGORY === 'Finance Cost');
  const taxExp = sumBy(r => r.CATEGORY === 'Tax Expenses');
  const totalExpenses = sumBy(r => r.PL_GROUP === 'Expense');

  // Balance sheet components
  const totalAssets = sumBy(r => r.BS_GROUP === 'Non Current Assets' || r.BS_GROUP === 'Current Assets');
  const equity = sumBy(r => r.BS_GROUP === 'Equity' || r.BS_GROUP === 'Other Equity');
  const currentAssets = sumBy(r => r.BS_GROUP === 'Current Assets');
  const currentLiab = sumBy(r => r.BS_GROUP === 'Current Liab');
  const nonCurrentLiab = sumBy(r => r.BS_GROUP === 'Non Current Liability');

  // Specific GL-based components
  const inventory = sumBy(r => r.GLNO && (r.GLNO.startsWith('005020') || r.GLNO.startsWith('005021') || r.GLNO.startsWith('005022') || r.GLNO.startsWith('005023')));
  const cash = sumBy(r => r.GLNO && (r.GLNO.startsWith('005040')));
  const capex = sumBy(r => r.GLNO && r.GLNO.startsWith('004030'));

  // Gross block & accumulated depreciation for dep ratio
  const grossBlock = sumBy(r => r.GLNO && (r.GLNO >= '0040101010' && r.GLNO <= '0040201030'));
  const accumDep = sumBy(r => r.GLNO && (r.GLNO >= '0040101022' && r.GLNO <= '0050601512') && r.GL_DESC && r.GL_DESC.toLowerCase().includes('dep'));

  // Investment income & investments for ROI
  const invIncome = sumBy(r => ['0060201010', '0060201020'].includes(r.GLNO));
  const investments = sumBy(r => (r.GLNO >= '0040200000' && r.GLNO <= '0040299999') || r.GLNO === '0050601512');

  // Export breakdown
  const expSaleFeCr = sumBy(r => r.GLNO === '0060102010');
  const expThirdParty = sumBy(r => r.GLNO === '0060102020');
  const exportTotal = expSaleFeCr + expThirdParty;

  const netIncome = totalRevenue - totalExpenses;
  const shares = 933254110;

  const cr = (v) => `Rs ${(v / 10000000).toFixed(2)} Cr`;
  const pct = (v) => `${v.toFixed(2)}%`;

  // OpEx = TotalExp - Finance Cost - Depreciation
  const opex = totalExpenses - financeCost - depreciation;
  const ebit = revOps - opex;
  const ebitda = ebit + depreciation;

  // Revenue GL values for card popups
  const revGLValues = {};
  const otherGLValues = {};
  allRows.filter(r => r.CATEGORY === 'Rev. from Operation').forEach(r => { revGLValues[r.GLNO] = Number(r.NET_AMOUNT); });
  allRows.filter(r => r.CATEGORY === 'Other Income').forEach(r => { otherGLValues[r.GLNO] = Number(r.NET_AMOUNT); });

  const formulaValues = {
    1: { // GP Margin
      revOps: cr(revOps), cogs: cr(Math.abs(cogs)),
      grossProfit: cr(revOps - Math.abs(cogs)),
      result: revOps !== 0 ? pct((revOps - Math.abs(cogs)) / revOps * 100) : '--'
    },
    2: { // NP Margin
      totalRevenue: cr(totalRevenue), totalExpenses: cr(totalExpenses),
      netProfit: cr(netIncome),
      result: totalRevenue !== 0 ? pct(netIncome / totalRevenue * 100) : '--'
    },
    3: { // EBIT Margin
      revOps: cr(revOps), totalExpenses: cr(totalExpenses),
      financeCost: cr(financeCost), depreciation: cr(depreciation),
      ebit: cr(ebit),
      result: revOps !== 0 ? pct(ebit / revOps * 100) : '--'
    },
    4: { // Operating Ratio
      totalExpenses: cr(totalExpenses), financeCost: cr(financeCost),
      depreciation: cr(depreciation),
      opex: cr(opex),
      totalRevenue: cr(totalRevenue),
      result: totalRevenue !== 0 ? pct(opex / totalRevenue * 100) : '--'
    },
    5: { // EBITDA Margin
      revOps: cr(revOps), totalExpenses: cr(totalExpenses),
      financeCost: cr(financeCost), depreciation: cr(depreciation),
      ebitda: cr(ebitda),
      result: revOps !== 0 ? pct(ebitda / revOps * 100) : '--'
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
    9: { // Depreciation Ratio
      accDep: cr(accumDep), grossAssets: cr(grossBlock),
      result: grossBlock !== 0 ? pct(accumDep / grossBlock * 100) : '--'
    },
    10: { // CapEx Ratio
      capex: cr(capex), totalRevenue: cr(totalRevenue),
      result: totalRevenue !== 0 ? pct(capex / totalRevenue * 100) : '--'
    },
    11: { // Inventory Turnover
      cogs: cr(Math.abs(cogs)), inventory: cr(inventory),
      result: inventory !== 0 ? `${(Math.abs(cogs) / inventory).toFixed(2)}x` : '--'
    },
    12: { // EPS
      totalRevenue: cr(totalRevenue), totalExpenses: cr(totalExpenses),
      netIncome: cr(netIncome),
      shares: '9,33,25,4110',
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
      ...Object.fromEntries(Object.entries(revGLValues).map(([gl, v]) => [`gl_${gl}`, cr(v)])),
      result: cr(revOps)
    },
    102: {
      ...Object.fromEntries(Object.entries(otherGLValues).map(([gl, v]) => [`gl_${gl}`, cr(v)])),
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
