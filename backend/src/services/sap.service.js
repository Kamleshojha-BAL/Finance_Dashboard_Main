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

/* Smart formatter: returns { display, raw, crores } — always in Cr */
function formatIndian(val) {
  const crores = +(val / 10000000).toFixed(2);
  return { display: `${crores} Cr`, raw: val, crores };
}

/* Resolve period filter params.
   - If month is provided → single period + fyear (monthly mode)
   - If only fyear is provided → all periods for that fyear (yearly mode)
   Returns { filterSQL, params, fyear, isYearly } */
function resolvePeriodFilter(month, year, fyear) {
  if (month) {
    const sap = toSAPPeriod(month, year);
    return { filterSQL: 'PERIOD = ? AND FYEAR = ?', params: [sap.period, sap.fyear], fyear: sap.fyear, isYearly: false };
  }
  if (fyear) {
    return { filterSQL: 'FYEAR = ?', params: [String(fyear)], fyear: String(fyear), isYearly: true };
  }
  return null;
}

/* YTD filter: for monthly mode returns PERIOD BETWEEN '001' AND selected; for yearly same as resolvePeriodFilter */
function resolveYTDFilter(month, year, fyear) {
  if (month) {
    const sap = toSAPPeriod(month, year);
    return { filterSQL: "PERIOD BETWEEN '001' AND ? AND FYEAR = ?", params: [sap.period, sap.fyear], fyear: sap.fyear, isYearly: false };
  }
  if (fyear) return { filterSQL: 'FYEAR = ?', params: [String(fyear)], fyear: String(fyear), isYearly: true };
  return null;
}

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
export const getKPIData = async (month, year, fyear) => {
  const pf = resolvePeriodFilter(month, year, fyear);
  if (!pf) return [];

  let rows;
  if (pf.isYearly) {
    // Yearly: aggregate numerator/denominator across all periods, recalculate value
    const [aggRows] = await db.execute(
      `SELECT KPI_CODE, KPI_NAME, KPI_CATEGORY, UNIT,
              SUM(NUMERATOR) AS NUMERATOR, SUM(DENOMINATOR) AS DENOMINATOR
       FROM finance_kpi_results
       WHERE ${pf.filterSQL}
       GROUP BY KPI_CODE, KPI_NAME, KPI_CATEGORY, UNIT
       ORDER BY KPI_CODE`,
      pf.params
    );
    // Recalculate VALUE from aggregated numerator/denominator
    rows = aggRows.map(r => {
      const num = Number(r.NUMERATOR), den = Number(r.DENOMINATOR);
      let value = null;
      if (den !== 0 && r.UNIT === '%') value = +(num / den * 100).toFixed(2);
      else if (den !== 0 && r.UNIT === 'x') value = +(num / den).toFixed(2);
      else if (den !== 0 && r.UNIT === 'Rs') value = +(num / den).toFixed(2);
      else if (r.UNIT === 'Cr') value = +(num / 10000000).toFixed(2);
      else if (den !== 0) value = +(num / den).toFixed(2);
      else value = num !== 0 ? +num.toFixed(2) : null;
      return { ...r, VALUE: value, NUMERATOR: num, DENOMINATOR: den };
    });
  } else {
    const [monthRows] = await db.execute(
      `SELECT KPI_CODE, KPI_NAME, KPI_CATEGORY, VALUE, UNIT, NUMERATOR, DENOMINATOR
       FROM finance_kpi_results
       WHERE ${pf.filterSQL}
       ORDER BY KPI_CODE`,
      pf.params
    );
    rows = monthRows;
  }

  const rowMap = {};
  rows.forEach(r => { rowMap[r.KPI_CODE] = r; });

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
export const getDashboardData = async (month, year, fyear) => {
  const pf = resolvePeriodFilter(month, year, fyear);
  if (!pf) return { revenueSummary: {}, revenueBreakdown: [], otherIncomeBreakdown: [], kpis: [] };
  const ytd = resolveYTDFilter(month, year, fyear);

  // Revenue query — monthly (selected period only) for Executive Overview cards
  const revQuery = pf.isYearly
    ? `SELECT GLNO, GL_DESC, CATEGORY, SUM(NET_AMOUNT) AS NET_AMOUNT
       FROM finance_period_summary
       WHERE ${pf.filterSQL} AND PL_GROUP = 'Revenue'
       GROUP BY GLNO, GL_DESC, CATEGORY
       ORDER BY ABS(SUM(NET_AMOUNT)) DESC`
    : `SELECT GLNO, GL_DESC, CATEGORY, NET_AMOUNT
       FROM finance_period_summary
       WHERE ${pf.filterSQL} AND PL_GROUP = 'Revenue'
       ORDER BY ABS(NET_AMOUNT) DESC`;

  const [revRows] = await db.execute(revQuery, pf.params);

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

  // Expense data — monthly (selected period only) for Executive Overview cards
  const expQuery = pf.isYearly
    ? `SELECT CATEGORY, SUM(NET_AMOUNT) AS signed_amount
       FROM finance_period_summary
       WHERE ${pf.filterSQL} AND PL_GROUP = 'Expense'
       GROUP BY CATEGORY
       ORDER BY ABS(SUM(NET_AMOUNT)) DESC`
    : `SELECT CATEGORY, SUM(NET_AMOUNT) AS signed_amount
       FROM finance_period_summary
       WHERE ${pf.filterSQL} AND PL_GROUP = 'Expense'
       GROUP BY CATEGORY
       ORDER BY ABS(SUM(NET_AMOUNT)) DESC`;

  const [expRows] = await db.execute(expQuery, pf.params);

  let totalExpensesSigned = 0;
  let cogsSigned = 0;
  expRows.forEach(r => {
    const signed = Number(r.signed_amount);
    totalExpensesSigned += signed;
    if (r.CATEGORY === 'Cost of Material Consumed') cogsSigned = Math.abs(signed);
  });

  const totalExpenses = Math.abs(totalExpensesSigned);

  // ── COGS as per Excel GP Margin (data-driven from gl_group_mapping table) ──
  const [cogsMappingDash] = await db.execute(
    'SELECT GLNO, COGS_TYPE FROM gl_group_mapping WHERE IS_COGS = 1 AND COGS_TYPE IN (?, ?)',
    ['FACTORY_EMP', 'MFG_OTHER']
  );
  const factoryEmpGLsDash = cogsMappingDash.filter(r => r.COGS_TYPE === 'FACTORY_EMP').map(r => r.GLNO);
  const mfgOtherGLsDash = cogsMappingDash.filter(r => r.COGS_TYPE === 'MFG_OTHER').map(r => r.GLNO);
  const allCogsGLs = [...factoryEmpGLsDash, ...mfgOtherGLsDash];

  let factoryEmpTotal = 0, mfgOtherExpTotal = 0, wagesForPF = 0;

  if (allCogsGLs.length > 0) {
    const glPlaceholders = allCogsGLs.map(() => '?').join(',');
    const glQuery = pf.isYearly
      ? `SELECT GLNO, SUM(NET_AMOUNT) AS NET_AMOUNT
         FROM finance_period_summary
         WHERE ${pf.filterSQL} AND GLNO IN (${glPlaceholders})
         GROUP BY GLNO`
      : `SELECT GLNO, NET_AMOUNT
         FROM finance_period_summary
         WHERE ${pf.filterSQL} AND GLNO IN (${glPlaceholders})`;

    const [glRows] = await db.execute(glQuery, [...pf.params, ...allCogsGLs]);
    const glAmounts = {};
    glRows.forEach(r => { glAmounts[r.GLNO] = Number(r.NET_AMOUNT); });

    const factoryEmpSet = new Set(factoryEmpGLsDash);
    const mfgOtherSet = new Set(mfgOtherGLsDash);
    Object.entries(glAmounts).forEach(([gl, amt]) => {
      if (factoryEmpSet.has(gl)) factoryEmpTotal += amt;
      if (mfgOtherSet.has(gl)) mfgOtherExpTotal += amt;
    });
    wagesForPF = glAmounts['0070501020'] || 0;
  }
  const pfCalcDash = wagesForPF * 0.12;

  // Category-level expense amounts for COGS
  const changesInInvAmt = Math.abs(Number((expRows.find(r => r.CATEGORY === 'Changes in Inv') || {}).signed_amount || 0));
  const powerAmt = Math.abs(Number((expRows.find(r => r.CATEGORY === 'Power') || {}).signed_amount || 0));

  // Excel COGS = COMC + Changes in Inv + Power + Factory Employee + PF + Mfg Other Exp
  const cogsExcelDash = cogsSigned + changesInInvAmt + powerAmt + factoryEmpTotal + pfCalcDash + mfgOtherExpTotal;

  const grossProfit = Math.abs(totalRevenueOps) - cogsExcelDash;
  const netIncome = Math.abs(totalRevenue) - totalExpenses;

  const expenseSummary = {
    totalExpenses: { value: totalExpenses, crores: toCrores(totalExpenses), ...formatIndian(totalExpenses) },
    comc: { value: cogsSigned, crores: toCrores(cogsSigned), ...formatIndian(cogsSigned) },
    cogs: { value: cogsExcelDash, crores: toCrores(cogsExcelDash), ...formatIndian(cogsExcelDash) },
    grossProfit: { value: grossProfit, crores: toCrores(grossProfit), ...formatIndian(grossProfit) },
    netIncome: { value: netIncome, crores: toCrores(netIncome), ...formatIndian(netIncome) },
    grossProfitPct: Math.abs(totalRevenueOps) > 0 ? +((grossProfit / Math.abs(totalRevenueOps)) * 100).toFixed(1) : 0,
    netIncomePct: Math.abs(totalRevenue) > 0 ? +((netIncome / Math.abs(totalRevenue)) * 100).toFixed(1) : 0
  };

  // 16 KPIs — read from finance_kpi_results, then override GP/NP with YTD Excel-methodology
  const kpis = await getKPIData(month, year, fyear);

  // ── YTD queries for KPI % overrides (separate from monthly card data) ──
  {
    const [ytdRevRows] = await db.execute(
      `SELECT CATEGORY, SUM(NET_AMOUNT) AS NET_AMOUNT
       FROM finance_period_summary
       WHERE ${ytd.filterSQL} AND PL_GROUP = 'Revenue'
       GROUP BY CATEGORY`, ytd.params);
    const ytdRevOps = ytdRevRows.filter(r => r.CATEGORY === 'Rev. from Operation').reduce((s, r) => s + Number(r.NET_AMOUNT), 0);
    const ytdOtherInc = ytdRevRows.filter(r => r.CATEGORY === 'Other Income').reduce((s, r) => s + Number(r.NET_AMOUNT), 0);
    const ytdTotalRev = ytdRevOps + ytdOtherInc;

    const [ytdExpRows] = await db.execute(
      `SELECT CATEGORY, SUM(NET_AMOUNT) AS signed_amount
       FROM finance_period_summary
       WHERE ${ytd.filterSQL} AND PL_GROUP = 'Expense'
       GROUP BY CATEGORY`, ytd.params);
    let ytdTotalExpSigned = 0, ytdCogsSigned = 0;
    ytdExpRows.forEach(r => {
      const signed = Number(r.signed_amount);
      ytdTotalExpSigned += signed;
      if (r.CATEGORY === 'Cost of Material Consumed') ytdCogsSigned = Math.abs(signed);
    });
    const ytdTotalExp = Math.abs(ytdTotalExpSigned);
    const ytdChangesInInv = Math.abs(Number((ytdExpRows.find(r => r.CATEGORY === 'Changes in Inv') || {}).signed_amount || 0));
    const ytdPower = Math.abs(Number((ytdExpRows.find(r => r.CATEGORY === 'Power') || {}).signed_amount || 0));

    // COGS GLs for YTD
    let ytdFactoryEmp = 0, ytdMfgOther = 0, ytdWages = 0;
    if (allCogsGLs.length > 0) {
      const ph = allCogsGLs.map(() => '?').join(',');
      const [ytdGLRows] = await db.execute(
        `SELECT GLNO, SUM(NET_AMOUNT) AS NET_AMOUNT FROM finance_period_summary
         WHERE ${ytd.filterSQL} AND GLNO IN (${ph}) GROUP BY GLNO`,
        [...ytd.params, ...allCogsGLs]);
      const ytdGLA = {};
      ytdGLRows.forEach(r => { ytdGLA[r.GLNO] = Number(r.NET_AMOUNT); });
      const feSet = new Set(factoryEmpGLsDash), moSet = new Set(mfgOtherGLsDash);
      Object.entries(ytdGLA).forEach(([gl, amt]) => {
        if (feSet.has(gl)) ytdFactoryEmp += amt;
        if (moSet.has(gl)) ytdMfgOther += amt;
      });
      ytdWages = ytdGLA['0070501020'] || 0;
    }
    const ytdPF = ytdWages * 0.12;
    const ytdCogsExcel = ytdCogsSigned + ytdChangesInInv + ytdPower + ytdFactoryEmp + ytdPF + ytdMfgOther;
    const ytdGP = Math.abs(ytdRevOps) - ytdCogsExcel;
    const ytdNI = Math.abs(ytdTotalRev) - ytdTotalExp;

    // Override GP_MARGIN (id=1)
    const gpKpi = kpis.find(k => k.id === 1);
    if (gpKpi && Math.abs(ytdRevOps) > 0) {
      gpKpi.value = +((ytdGP / Math.abs(ytdRevOps)) * 100).toFixed(2);
      gpKpi.numerator = ytdGP;
      gpKpi.denominator = Math.abs(ytdRevOps);
      gpKpi.status = 'active';
    }
    // Override NP_MARGIN (id=2)
    const npKpi = kpis.find(k => k.id === 2);
    if (npKpi && Math.abs(ytdTotalRev) > 0) {
      npKpi.value = +((ytdNI / Math.abs(ytdTotalRev)) * 100).toFixed(2);
      npKpi.numerator = ytdNI;
      npKpi.denominator = Math.abs(ytdTotalRev);
      npKpi.status = 'active';
    }
  }

  const revenueSummary = {
    revenueFromOps: { value: totalRevenueOps, crores: toCrores(totalRevenueOps), ...formatIndian(totalRevenueOps) },
    otherIncome: { value: totalOtherIncome, crores: toCrores(totalOtherIncome), ...formatIndian(totalOtherIncome) },
    totalRevenue: { value: totalRevenue, crores: toCrores(totalRevenue), ...formatIndian(totalRevenue) },
    domesticRevenue: { value: domesticRevenue, crores: toCrores(domesticRevenue), ...formatIndian(domesticRevenue) },
    exportRevenue: { value: exportRevenue, crores: toCrores(exportRevenue), ...formatIndian(exportRevenue) },
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

  return { revenueSummary, expenseSummary, revenueBreakdown, otherIncomeBreakdown, kpis };
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
export const getRevenueMix = async (month, year, fyear) => {
  const pf = resolvePeriodFilter(month, year, fyear);
  if (!pf) return [];

  const query = pf.isYearly
    ? `SELECT GLNO, GL_DESC, SUM(NET_AMOUNT) AS NET_AMOUNT
       FROM finance_period_summary
       WHERE ${pf.filterSQL} AND CATEGORY = 'Rev. from Operation'
       GROUP BY GLNO, GL_DESC
       ORDER BY ABS(SUM(NET_AMOUNT)) DESC`
    : `SELECT GLNO, GL_DESC, NET_AMOUNT
       FROM finance_period_summary
       WHERE ${pf.filterSQL} AND CATEGORY = 'Rev. from Operation'
       ORDER BY ABS(NET_AMOUNT) DESC`;

  const [rows] = await db.execute(query, pf.params);

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
export const getCostStructure = async (month, year, fyear) => {
  const pf = resolvePeriodFilter(month, year, fyear);
  const params = [];
  let periodFilter = '';

  if (pf) {
    periodFilter = `AND ${pf.filterSQL}`;
    params.push(...pf.params);
  }

  const [rows] = await db.execute(`
    SELECT CATEGORY, SUM(NET_AMOUNT) AS amount
    FROM finance_period_summary
    WHERE PL_GROUP = 'Expense' ${periodFilter}
    GROUP BY CATEGORY
    ORDER BY ABS(SUM(NET_AMOUNT)) DESC
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
export const getKPIFormulaValues = async (month, year, fyear) => {
  const pf = resolveYTDFilter(month, year, fyear);
  if (!pf) return {};

  // Always aggregate (YTD for monthly, full year for yearly)
  const query = `SELECT GLNO, GL_DESC, CATEGORY, BS_GROUP, PL_GROUP, SUM(NET_AMOUNT) AS NET_AMOUNT
       FROM finance_period_summary
       WHERE ${pf.filterSQL}
       GROUP BY GLNO, GL_DESC, CATEGORY, BS_GROUP, PL_GROUP`;

  const [allRows] = await db.execute(query, pf.params);

  // Helper: sum NET_AMOUNT for rows matching a filter
  const sumBy = (filterFn) => allRows.filter(filterFn).reduce((s, r) => s + Number(r.NET_AMOUNT), 0);

  // Revenue components
  const revOps = sumBy(r => r.CATEGORY === 'Rev. from Operation');
  const otherIncome = sumBy(r => r.CATEGORY === 'Other Income');
  const totalRevenue = revOps + otherIncome;

  // Expense components from 7series (category names match DB exactly)
  const cogs = sumBy(r => r.CATEGORY === 'Cost of Material Consumed');
  const changesInInv = sumBy(r => r.CATEGORY === 'Changes in Inv');
  const employeeCost = sumBy(r => r.CATEGORY === 'Employee Cost');
  const powerCost = sumBy(r => r.CATEGORY === 'Power');
  const otherExp = sumBy(r => r.CATEGORY === 'Other Exp');
  const depreciation = sumBy(r => r.CATEGORY === 'Depreciation');
  const financeCost = sumBy(r => r.CATEGORY === 'Finance Cost');
  const taxExp = sumBy(r => r.CATEGORY === 'Current Tax');
  const totalExpenses = sumBy(r => r.PL_GROUP === 'Expense');

  // ── COGS as per Excel GP Margin sheet (data-driven from gl_group_mapping table) ──
  // Load COGS GL classification from database (not hardcoded)
  const [cogsMapping] = await db.execute(
    'SELECT GLNO, COGS_TYPE FROM gl_group_mapping WHERE IS_COGS = 1'
  );
  const cogsGLSet = new Set(cogsMapping.map(r => r.GLNO));
  const factoryEmpGLSet = new Set(cogsMapping.filter(r => r.COGS_TYPE === 'FACTORY_EMP').map(r => r.GLNO));
  const mfgOtherGLSet = new Set(cogsMapping.filter(r => r.COGS_TYPE === 'MFG_OTHER').map(r => r.GLNO));

  const factoryEmployeeCost = sumBy(r => factoryEmpGLSet.has(r.GLNO));
  // PF = 12% of Wages (GL 0070501020) as per Excel formula
  const wagesAmt = sumBy(r => r.GLNO === '0070501020');
  const pfCalc = wagesAmt * 0.12;
  const mfgOtherExp = sumBy(r => mfgOtherGLSet.has(r.GLNO));

  // Total COGS (Excel methodology): COMC + Changes in Inv + Power + Factory Employee + PF + Mfg Other Exp
  const cogsExcel = cogs + changesInInv + powerCost + factoryEmployeeCost + pfCalc + mfgOtherExp;

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

  // Expense GL values grouped by category for card popups
  const expenseGLsByCategory = {};
  allRows.filter(r => r.PL_GROUP === 'Expense').forEach(r => {
    const cat = r.CATEGORY || 'Other';
    if (!expenseGLsByCategory[cat]) expenseGLsByCategory[cat] = [];
    expenseGLsByCategory[cat].push({
      glno: r.GLNO,
      desc: r.GL_DESC || r.GLNO,
      amount: Number(r.NET_AMOUNT),
      formatted: cr(Number(r.NET_AMOUNT))
    });
  });
  // Sort each category by absolute amount desc
  Object.values(expenseGLsByCategory).forEach(gls => gls.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)));

  // Build flat expense GL list for Total Expenses card
  const allExpenseGLs = allRows
    .filter(r => r.PL_GROUP === 'Expense' && Number(r.NET_AMOUNT) !== 0)
    .map(r => ({
      glno: r.GLNO,
      desc: r.GL_DESC || r.GLNO,
      category: r.CATEGORY,
      amount: Number(r.NET_AMOUNT),
      formatted: cr(Number(r.NET_AMOUNT))
    }))
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

  // COGS GLs specifically
  const cogsGLs = (expenseGLsByCategory['Cost of Material Consumed'] || [])
    .filter(g => g.amount > 0);

  const formulaValues = {
    1: { // GP Margin (Excel methodology: COGS includes COMC + Changes in Inv + Power + Factory Employee + Mfg Other Exp)
      revOps: cr(Math.abs(revOps)),
      cogsBreakdown: {
        comc: cr(Math.abs(cogs)),
        changesInInv: cr(Math.abs(changesInInv)),
        power: cr(Math.abs(powerCost)),
        factoryEmployee: cr(Math.abs(factoryEmployeeCost + pfCalc)),
        mfgOtherExp: cr(Math.abs(mfgOtherExp)),
      },
      cogs: cr(Math.abs(cogsExcel)),
      grossProfit: cr(Math.abs(revOps) - Math.abs(cogsExcel)),
      result: revOps !== 0 ? pct((Math.abs(revOps) - Math.abs(cogsExcel)) / Math.abs(revOps) * 100) : '--'
    },
    2: { // NP Margin (Excel: Net Profit = Total Revenue - All Expenses)
      totalRevenue: cr(Math.abs(totalRevenue)), totalExpenses: cr(Math.abs(totalExpenses)),
      netProfit: cr(Math.abs(totalRevenue) - Math.abs(totalExpenses)),
      result: totalRevenue !== 0 ? pct((Math.abs(totalRevenue) - Math.abs(totalExpenses)) / Math.abs(totalRevenue) * 100) : '--'
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
    },
    // Expense card popups
    201: { // Total Expenses — GL-level breakdown
      glBreakdown: allExpenseGLs,
      result: cr(Math.abs(totalExpenses))
    },
    202: { // Cost of Materials — GL-level breakdown
      glBreakdown: cogsGLs,
      revOps: cr(revOps),
      cogsPct: revOps !== 0 ? pct(Math.abs(cogs) / revOps * 100) : '--',
      result: cr(Math.abs(cogs))
    },
    203: { // Gross Profit (uses full Excel COGS: COMC + Changes in Inv + Power + Factory Emp + Mfg Other)
      revOps: cr(Math.abs(revOps)),
      cogs: cr(Math.abs(cogsExcel)),
      cogsBreakdown: {
        comc: cr(Math.abs(cogs)),
        changesInInv: cr(Math.abs(changesInInv)),
        power: cr(Math.abs(powerCost)),
        factoryEmployee: cr(Math.abs(factoryEmployeeCost + pfCalc)),
        mfgOtherExp: cr(Math.abs(mfgOtherExp)),
      },
      grossProfit: cr(Math.abs(revOps) - Math.abs(cogsExcel)),
      result: revOps !== 0 ? pct((Math.abs(revOps) - Math.abs(cogsExcel)) / Math.abs(revOps) * 100) : '--'
    },
    204: { // Net Income
      totalRevenue: cr(totalRevenue), totalExpenses: cr(Math.abs(totalExpenses)),
      netIncome: cr(netIncome),
      result: totalRevenue !== 0 ? pct(netIncome / totalRevenue * 100) : '--'
    }
  };

  return formulaValues;
};

/* ─────────────────────────────────────────────
   PROFITABILITY BREAKDOWN — matches Excel GP/NP/EBIT/EBITDA sheets
   ───────────────────────────────────────────── */
export const getProfitabilityBreakdown = async (month, year, fyear) => {
  const pf = resolvePeriodFilter(month, year, fyear);
  if (!pf) return null;

  // Get all GL-level data — always YTD (cumulative Apr to selected month)
  const ytdFilter = pf.isYearly
    ? pf.filterSQL
    : `PERIOD BETWEEN '001' AND ? AND FYEAR = ?`;

  const query = `SELECT GLNO, GL_DESC, CATEGORY, PL_GROUP, SUM(NET_AMOUNT) AS NET_AMOUNT
     FROM finance_period_summary WHERE ${ytdFilter}
     GROUP BY GLNO, GL_DESC, CATEGORY, PL_GROUP`;

  const [allRows] = await db.execute(query, pf.params);

  const sumBy = (fn) => allRows.filter(fn).reduce((s, r) => s + Number(r.NET_AMOUNT), 0);
  const abs = Math.abs;
  const cr = (v) => +(abs(v) / 10000000).toFixed(2);

  // ── Revenue ──
  const revOps = sumBy(r => r.CATEGORY === 'Rev. from Operation');
  const otherIncome = sumBy(r => r.CATEGORY === 'Other Income');
  const totalRevenue = revOps + otherIncome;

  // ── Expense categories ──
  const comc = sumBy(r => r.CATEGORY === 'Cost of Material Consumed');
  const changesInInv = sumBy(r => r.CATEGORY === 'Changes in Inv');
  const power = sumBy(r => r.CATEGORY === 'Power');
  const employeeCost = sumBy(r => r.CATEGORY === 'Employee Cost');
  const financeCost = sumBy(r => r.CATEGORY === 'Finance Cost');
  const depreciation = sumBy(r => r.CATEGORY === 'Depreciation');
  const otherExp = sumBy(r => r.CATEGORY === 'Other Exp');
  const currentTax = sumBy(r => r.CATEGORY === 'Current Tax');
  const totalExpenses = sumBy(r => r.PL_GROUP === 'Expense');

  // ── COGS breakdown (SAP Excel methodology) ──
  // Factory Employee: specific 9 GLs + PF@12% of Wages + ESI GL
  const FACTORY_EMP_GLS = new Set([
    '0070501020','0070501110','0070501130','0070501170','0070501180',
    '0070501210','0070501230','0070501240','0070501380'
  ]);

  const factoryEmpRows = allRows
    .filter(r => FACTORY_EMP_GLS.has(r.GLNO) && Number(r.NET_AMOUNT) !== 0)
    .map(r => ({ glno: r.GLNO, desc: r.GL_DESC, amount: abs(Number(r.NET_AMOUNT)), crores: cr(Number(r.NET_AMOUNT)) }))
    .sort((a, b) => b.amount - a.amount);

  const factoryEmpTotal = factoryEmpRows.reduce((s, r) => s + r.amount, 0);
  const wagesAmt = abs(sumBy(r => r.GLNO === '0070501020'));
  const pfCalc = wagesAmt * 0.12;
  const esiAmt = abs(sumBy(r => r.GLNO === '0070501530'));

  const contributionRows = [
    { glno: 'Formula', desc: 'Provident Fund @12% of Wages', amount: pfCalc, crores: cr(pfCalc) },
    { glno: '0070501530', desc: 'ESI Contribution', amount: esiAmt, crores: cr(esiAmt) }
  ].filter(r => r.amount > 0);

  // Manufacturing Other Exp: 5 specific GL_GROUPs from gl_group_mapping
  const MFG_GROUPS = [
    'Other Exp-Consumption of Stores',
    'Other Exp-Contract Labour Chg',
    'Other Exp-Packing & carriage Chg',
    'Other Exp-Rent & Hire Chg',
    'Other Exp-R&M'
  ];
  const [mfgMapping] = await db.execute(
    `SELECT GLNO, GL_GROUP FROM gl_group_mapping WHERE GL_GROUP IN (${MFG_GROUPS.map(() => '?').join(',')})`,
    MFG_GROUPS
  );
  const mfgGLGroupMap = {};
  mfgMapping.forEach(r => { mfgGLGroupMap[r.GLNO] = r.GL_GROUP; });
  const mfgGLSet = new Set(mfgMapping.map(r => r.GLNO));

  const mfgGroupTotals = {};
  allRows.filter(r => mfgGLSet.has(r.GLNO) && Number(r.NET_AMOUNT) !== 0).forEach(r => {
    const group = mfgGLGroupMap[r.GLNO] || 'Other';
    if (!mfgGroupTotals[group]) mfgGroupTotals[group] = { label: group, amount: 0, gls: [] };
    const amt = abs(Number(r.NET_AMOUNT));
    mfgGroupTotals[group].amount += amt;
    mfgGroupTotals[group].gls.push({ glno: r.GLNO, desc: r.GL_DESC, amount: amt, crores: cr(Number(r.NET_AMOUNT)) });
  });
  Object.values(mfgGroupTotals).forEach(g => {
    g.crores = +(g.amount / 10000000).toFixed(2);
    g.gls.sort((a, b) => b.amount - a.amount);
  });
  const mfgGroups = Object.values(mfgGroupTotals).sort((a, b) => b.amount - a.amount);
  const mfgOtherTotal = mfgGroups.reduce((s, g) => s + g.amount, 0);

  // Total COGS = COMC + Changes in Inv + Power + Factory Emp + PF + ESI + 5 Mfg groups
  const totalCOGS = abs(comc) + abs(changesInInv) + abs(power)
    + factoryEmpTotal + pfCalc + esiAmt + mfgOtherTotal;
  const grossProfit = abs(revOps) - totalCOGS;
  const gpMargin = abs(revOps) > 0 ? (grossProfit / abs(revOps) * 100) : 0;

  // NP Margin
  const netProfit = abs(totalRevenue) - abs(totalExpenses);
  const npMargin = abs(totalRevenue) > 0 ? (netProfit / abs(totalRevenue) * 100) : 0;

  // EBIT
  const opexExclInterest = abs(totalExpenses) - abs(financeCost);
  const ebit = abs(revOps) - opexExclInterest;
  const ebitMargin = abs(revOps) > 0 ? (ebit / abs(revOps) * 100) : 0;

  // EBITDA
  const opexExclIntDep = abs(totalExpenses) - abs(financeCost) - abs(depreciation);
  const ebitda = abs(revOps) - opexExclIntDep;
  const ebitdaMargin = abs(revOps) > 0 ? (ebitda / abs(revOps) * 100) : 0;

  return {
    gpMargin: {
      margin: +gpMargin.toFixed(2),
      revOps: cr(revOps),
      cogs: {
        total: +(totalCOGS / 10000000).toFixed(2),
        comc: cr(comc),
        changesInInv: cr(changesInInv),
        power: cr(power),
        factoryEmployee: {
          total: +((factoryEmpTotal + pfCalc + esiAmt) / 10000000).toFixed(2),
          glRows: factoryEmpRows,
          contributions: contributionRows
        },
        mfgOtherExp: {
          total: +(mfgOtherTotal / 10000000).toFixed(2),
          groups: mfgGroups
        }
      },
      grossProfit: +(grossProfit / 10000000).toFixed(2)
    },
    npMargin: {
      margin: +npMargin.toFixed(2),
      totalRevenue: cr(totalRevenue),
      expenses: [
        { label: 'Cost of Raw Materials Consumed', crores: cr(comc) },
        { label: '(Increase)/Decrease in Inventories', crores: cr(changesInInv) },
        { label: 'Power', crores: cr(power) },
        { label: 'Employee Benefit Expenses', crores: cr(employeeCost) },
        { label: 'Finance Costs', crores: cr(financeCost) },
        { label: 'Depreciation & Amortization', crores: cr(depreciation) },
        { label: 'Other Expenses', crores: cr(otherExp) },
        { label: 'Current Tax', crores: cr(currentTax) },
      ],
      totalExpenses: cr(totalExpenses),
      netProfit: +(netProfit / 10000000).toFixed(2)
    },
    ebit: {
      margin: +ebitMargin.toFixed(2),
      revOps: cr(revOps),
      opExExclInterest: +(opexExclInterest / 10000000).toFixed(2),
      ebit: +(ebit / 10000000).toFixed(2)
    },
    ebitda: {
      margin: +ebitdaMargin.toFixed(2),
      revOps: cr(revOps),
      opExExclIntDep: +(opexExclIntDep / 10000000).toFixed(2),
      ebitda: +(ebitda / 10000000).toFixed(2)
    }
  };
};

/* ─────────────────────────────────────────────
   TRIAL BALANCE SUMMARY — matches Excel <GL> sheet rows 2-22
   ───────────────────────────────────────────── */
export const getTrialBalanceSummary = async (month, year, fyear) => {
  const pf = resolvePeriodFilter(month, year, fyear);
  if (!pf) return [];

  // Define the Particulars order (matches Excel <GL> sheet)
  const PARTICULARS_ORDER = [
    // Balance Sheet items (by BS_GROUP)
    { key: 'Equity',                  type: 'bs', group: 'Equity' },
    { key: 'Other Equity',            type: 'bs', group: 'Other Equity' },
    { key: 'Profit',                  type: 'calculated' },
    { key: 'Non Current Liability',   type: 'bs', group: 'Non Current Liability' },
    { key: 'Current Liab',            type: 'bs', group: 'Current Liab' },
    { key: 'Non Current Assets',      type: 'bs', group: 'Non Current Assets' },
    { key: 'Current Assets',          type: 'bs', group: 'Current Assets' },
    // P&L items (by CATEGORY)
    { key: 'Rev. from Operation',     type: 'pl', category: 'Rev. from Operation' },
    { key: 'Other Income',            type: 'pl', category: 'Other Income' },
    { key: 'Cost of Material Consumed', type: 'pl', category: 'Cost of Material Consumed' },
    { key: 'Changes in Inv',          type: 'pl', category: 'Changes in Inv' },
    { key: 'Power',                   type: 'pl', category: 'Power' },
    { key: 'Employee Cost',           type: 'pl', category: 'Employee Cost' },
    { key: 'Finance Cost',            type: 'pl', category: 'Finance Cost' },
    { key: 'Depreciation',            type: 'pl', category: 'Depreciation' },
    { key: 'Other Exp',               type: 'pl', category: 'Other Exp' },
    { key: 'Exceptional Items',       type: 'pl', category: 'Exceptional Items' },
    { key: 'Current Tax',             type: 'pl', category: 'Current Tax' },
    { key: 'Deferred Tax',            type: 'pl', category: 'Deferred Tax' },
    { key: 'OCI-Net-manual',          type: 'pl', category: 'OCI-Net-manual' },
    { key: 'Total',                   type: 'calculated' },
  ];

  // BS items are cumulative: need Opening Balance (Period 000) + selected period
  // P&L items are activity-based: need only the selected period
  let bsRows, plRows;
  if (pf.isYearly) {
    // Yearly: single query, all periods including 000
    const [allRows] = await db.execute(
      `SELECT CATEGORY, BS_GROUP, PL_GROUP, SUM(NET_AMOUNT) AS NET_AMOUNT
       FROM finance_period_summary WHERE ${pf.filterSQL}
       GROUP BY CATEGORY, BS_GROUP, PL_GROUP`,
      pf.params
    );
    bsRows = allRows;
    plRows = allRows;
  } else {
    // Monthly: BS needs opening balance (000) + selected period; P&L needs only selected period
    const [bs] = await db.execute(
      `SELECT CATEGORY, BS_GROUP, PL_GROUP, SUM(NET_AMOUNT) AS NET_AMOUNT
       FROM finance_period_summary
       WHERE PERIOD IN ('000', ?) AND FYEAR = ? AND BS_GROUP IS NOT NULL
       GROUP BY CATEGORY, BS_GROUP, PL_GROUP`,
      pf.params
    );
    // P&L: YTD cumulative from Period 001 through selected period
    const [pl] = await db.execute(
      `SELECT CATEGORY, BS_GROUP, PL_GROUP, SUM(NET_AMOUNT) AS NET_AMOUNT
       FROM finance_period_summary
       WHERE PERIOD BETWEEN '001' AND ? AND FYEAR = ? AND PL_GROUP IS NOT NULL
       GROUP BY CATEGORY, BS_GROUP, PL_GROUP`,
      pf.params
    );
    bsRows = bs;
    plRows = pl;
  }

  // Build lookup maps
  const bsMap = {};   // BS_GROUP → total
  const plMap = {};   // CATEGORY → total
  let totalRevenuePL = 0;
  let totalExpensePL = 0;

  bsRows.forEach(r => {
    const amt = Number(r.NET_AMOUNT);
    if (r.BS_GROUP) {
      bsMap[r.BS_GROUP] = (bsMap[r.BS_GROUP] || 0) + amt;
    }
  });

  plRows.forEach(r => {
    const amt = Number(r.NET_AMOUNT);
    if (r.PL_GROUP) {
      plMap[r.CATEGORY] = (plMap[r.CATEGORY] || 0) + amt;
      if (r.PL_GROUP === 'Revenue') totalRevenuePL += amt;
      else if (r.PL_GROUP === 'Expense') totalExpensePL += amt;
    }
  });

  // Calculate Profit = Total Revenue - Total Expenses (excludes BS items)
  const profit = totalRevenuePL - totalExpensePL;

  // Total = Net Profit (same as Profit row — BS items excluded)
  const totalAll = profit;

  // Build result
  return PARTICULARS_ORDER.map(item => {
    let amount = 0;
    if (item.type === 'bs') {
      amount = bsMap[item.group] || 0;
    } else if (item.type === 'pl') {
      amount = plMap[item.category] || 0;
    } else if (item.key === 'Profit') {
      amount = profit;
    } else if (item.key === 'Total') {
      amount = totalAll;
    }

    return {
      particular: item.key,
      amount,
      crores: toCrores(amount),
      type: item.type === 'bs' ? 'Balance Sheet' : item.type === 'pl' ? 'P&L' : 'Calculated',
      hasData: amount !== 0
    };
  });
};

/* ─────────────────────────────────────────────
   AVAILABLE FISCAL YEARS — from finance_kpi_results
   ───────────────────────────────────────────── */
export const getAvailableFiscalYears = async () => {
  const [rows] = await db.execute(
    `SELECT DISTINCT FYEAR FROM finance_kpi_results ORDER BY FYEAR DESC`
  );

  return rows.map(r => {
    const fy = Number(r.FYEAR);
    return {
      fyear: fy,
      label: `FY ${fy}-${String(fy + 1).slice(-2)}`
    };
  });
};
