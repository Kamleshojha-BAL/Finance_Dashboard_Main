const KPI_DETAILS = {
  1: {
    name: "Gross Profit Margin",
    section: "Profitability",
    formula: "(Revenue from Operations - COGS) / Revenue from Operations x 100",
    formulaTerms: [
      { label: "Revenue from Operations", key: "revOps" },
      { label: "COGS - Raw Materials", key: "cogsBreakdown.comc", indent: true },
      { label: "COGS - Changes in Inventory", key: "cogsBreakdown.changesInInv", indent: true },
      { label: "COGS - Power", key: "cogsBreakdown.power", indent: true },
      { label: "COGS - Factory Employee Cost", key: "cogsBreakdown.factoryEmployee", indent: true },
      { label: "COGS - Mfg Other Expenses", key: "cogsBreakdown.mfgOtherExp", indent: true },
      { label: "Total COGS", key: "cogs", derived: true },
      { label: "Gross Profit", key: "grossProfit", derived: true },
      { label: "GP Margin", key: "result", derived: true }
    ],
    hasCOGSBreakdown: true,
    description: "Measures the percentage of revenue retained after deducting manufacturing costs (COGS). COGS includes raw materials, inventory changes, power, factory employee cost, and manufacturing overheads (stores, contract labour, packing, rent, R&M).",
    glAccounts: [
      { group: "Revenue from Operations", gls: [
        { code: "0060101010", name: "Dom Sale FeCr" },
        { code: "0060101016", name: "Dom Sale Cr brqt" },
        { code: "0060102010", name: "Exp Sale FeCr" },
        { code: "0060102020", name: "Exp Third Party Sale" },
        { code: "0060102060", name: "Duty Drawback" },
        { code: "0060105010", name: "Sales Tailing" },
        { code: "0060202120", name: "Sales Scrap" }
      ]},
      { group: "COGS (Cost of Goods Sold)", gls: [
        { code: "70101xxx", name: "Raw Material Consumption" },
        { code: "70301xxx", name: "Changes in Inventory" },
        { code: "70401xxx", name: "Power & Fuel" },
        { code: "70501xxx", name: "Employee Cost (Factory)" },
        { code: "70801xxx", name: "Stores & Spares" },
        { code: "70802xxx", name: "Contract Labour" },
        { code: "70803xxx", name: "Repairs & Maintenance" },
        { code: "70806xxx", name: "Packing Material" },
        { code: "70812xxx", name: "Rent (Factory)" }
      ]}
    ],
    unit: "%",
    target: ">=25%"
  },
  2: {
    name: "Net Profit Margin",
    section: "Profitability",
    formula: "(Total Revenue - Total Expenses) / Total Revenue x 100",
    formulaTerms: [
      { label: "Total Revenue", key: "totalRevenue" },
      { label: "Total Expenses", key: "totalExpenses" },
      { label: "Net Profit", key: "netProfit", derived: true },
      { label: "NP Margin", key: "result", derived: true }
    ],
    description: "Shows how much of each rupee of revenue translates into profit after all expenses. Includes operating expenses, depreciation, finance costs, and taxes.",
    glAccounts: [
      { group: "Total Revenue", gls: [
        { code: "60101xxx-60202xxx", name: "Revenue from Ops + Other Income (all 6-series)" }
      ]},
      { group: "Total Expenses", gls: [
        { code: "70000000-79999999", name: "All 7-series expense GLs" }
      ]}
    ],
    unit: "%",
    target: ">=8%"
  },
  3: {
    name: "EBIT Margin",
    section: "Profitability",
    formula: "(Revenue - Total Expenses + Finance Cost + Depreciation) / Revenue x 100",
    formulaTerms: [
      { label: "Revenue from Operations", key: "revOps" },
      { label: "Total Expenses", key: "totalExpenses" },
      { label: "Finance Cost (added back)", key: "financeCost" },
      { label: "Depreciation (added back)", key: "depreciation" },
      { label: "EBIT", key: "ebit", derived: true },
      { label: "EBIT Margin", key: "result", derived: true }
    ],
    description: "Earnings Before Interest and Tax as a percentage of revenue. Excludes the impact of financing decisions and tax, focusing on operational profitability.",
    glAccounts: [
      { group: "Revenue from Operations", gls: [
        { code: "60101xxx-60105xxx", name: "All Revenue from Ops GLs" }
      ]},
      { group: "Total Expenses", gls: [
        { code: "70000000-79999999", name: "All 7-series expense GLs" }
      ]},
      { group: "Finance Cost (added back)", gls: [
        { code: "70701xxx", name: "Interest & Finance Charges" }
      ]},
      { group: "Depreciation (added back)", gls: [
        { code: "70601xxx", name: "Depreciation & Amortisation" }
      ]}
    ],
    unit: "%",
    target: ">=10%"
  },
  4: {
    name: "Operating Ratio",
    section: "Cost Efficiency",
    formula: "(Total Expenses - Finance Cost - Depreciation) / Total Revenue x 100",
    formulaTerms: [
      { label: "Total Expenses", key: "totalExpenses" },
      { label: "Finance Cost (excluded)", key: "financeCost" },
      { label: "Depreciation (excluded)", key: "depreciation" },
      { label: "Operating Expenses", key: "opex", derived: true },
      { label: "Total Revenue", key: "totalRevenue" },
      { label: "Operating Ratio", key: "result", derived: true }
    ],
    description: "Measures what percentage of revenue is consumed by operating expenses. A lower ratio indicates better operational efficiency. Target is below 85%.",
    glAccounts: [
      { group: "Operating Expenses", gls: [
        { code: "70000000-79999999", name: "All expenses minus Finance Cost minus Depreciation" }
      ]},
      { group: "Excluded from OpEx", gls: [
        { code: "70701xxx", name: "Finance Cost (excluded)" },
        { code: "70601xxx", name: "Depreciation (excluded)" }
      ]},
      { group: "Total Revenue", gls: [
        { code: "6-series", name: "Revenue from Ops + Other Income" }
      ]}
    ],
    unit: "%",
    target: "<85%"
  },
  5: {
    name: "EBITDA Margin",
    section: "Profitability",
    formula: "(EBIT + Depreciation) / Revenue x 100",
    formulaTerms: [
      { label: "Revenue from Operations", key: "revOps" },
      { label: "Total Expenses", key: "totalExpenses" },
      { label: "Finance Cost (added back)", key: "financeCost" },
      { label: "Depreciation (added back x2)", key: "depreciation" },
      { label: "EBITDA", key: "ebitda", derived: true },
      { label: "EBITDA Margin", key: "result", derived: true }
    ],
    description: "Earnings Before Interest, Tax, Depreciation and Amortisation as a percentage of revenue. Best indicator of core operational cash-generating ability.",
    glAccounts: [
      { group: "EBIT Components", gls: [
        { code: "60101xxx-60202xxx", name: "Revenue (all 6-series)" },
        { code: "70000000-79999999", name: "Less: Total Expenses" },
        { code: "70701xxx", name: "Add back: Finance Cost" },
        { code: "70601xxx", name: "Add back: Depreciation (x2 for EBITDA)" }
      ]}
    ],
    unit: "%",
    target: ">=15%"
  },
  6: {
    name: "Return on Assets (ROA)",
    section: "Returns",
    formula: "Net Income / Total Assets x 100",
    formulaTerms: [
      { label: "Net Income", key: "netIncome" },
      { label: "Total Assets", key: "totalAssets" },
      { label: "ROA", key: "result", derived: true }
    ],
    description: "Measures how efficiently the company uses its assets to generate profit. Higher ROA indicates better asset utilisation.",
    glAccounts: [
      { group: "Net Income", gls: [
        { code: "6-series minus 7-series", name: "Total Revenue - Total Expenses" }
      ]},
      { group: "Total Assets", gls: [
        { code: "40000000-59999999", name: "Non-Current Assets (4-series) + Current Assets (5-series)" }
      ]}
    ],
    unit: "%",
    target: ">=5%"
  },
  7: {
    name: "Return on Equity (ROE)",
    section: "Returns",
    formula: "Net Income / Shareholders Equity x 100",
    formulaTerms: [
      { label: "Net Income", key: "netIncome" },
      { label: "Shareholders Equity", key: "equity" },
      { label: "ROE", key: "result", derived: true }
    ],
    description: "Measures the return generated on shareholders' investment. Indicates how effectively management uses equity capital to generate profits.",
    glAccounts: [
      { group: "Net Income", gls: [
        { code: "6-series minus 7-series", name: "Total Revenue - Total Expenses" }
      ]},
      { group: "Shareholders Equity", gls: [
        { code: "10000000-19999999", name: "All 1-series GLs (Share Capital + Reserves)" }
      ]}
    ],
    unit: "%",
    target: ">=12%"
  },
  8: {
    name: "Return on Investment (ROI)",
    section: "Returns",
    formula: "Investment Income / Total Investments x 100",
    formulaTerms: [
      { label: "Investment Income", key: "invIncome" },
      { label: "Total Investments", key: "investments" },
      { label: "ROI", key: "result", derived: true }
    ],
    description: "Measures the return earned on the company's investments including interest income and investment gains.",
    glAccounts: [
      { group: "Investment Income", gls: [
        { code: "0060201010", name: "Interest on Bank Deposits" },
        { code: "0060201020", name: "Interest on Investments" }
      ]},
      { group: "Total Investments", gls: [
        { code: "40200000-40299999", name: "Non-Current Investments (402xxx)" },
        { code: "0050601512", name: "Current Investments" }
      ]}
    ],
    unit: "%",
    target: ">=6%"
  },
  9: {
    name: "Depreciation Ratio",
    section: "Asset Management",
    formula: "Accumulated Depreciation / Gross Fixed Assets x 100",
    formulaTerms: [
      { label: "Accumulated Depreciation", key: "accDep" },
      { label: "Gross Fixed Assets", key: "grossAssets" },
      { label: "Depreciation Ratio", key: "result", derived: true }
    ],
    description: "Indicates the age and condition of fixed assets. A high ratio suggests aging assets that may need replacement soon.",
    glAccounts: [
      { group: "Data Required", gls: [
        { code: "4-series", name: "Gross Fixed Assets and Accumulated Depreciation GLs (not yet loaded)" }
      ]}
    ],
    unit: "%",
    target: "Monitor"
  },
  10: {
    name: "CapEx Ratio",
    section: "Investment",
    formula: "Capital Expenditure / Total Revenue x 100",
    formulaTerms: [
      { label: "Capital Expenditure", key: "capex" },
      { label: "Total Revenue", key: "totalRevenue" },
      { label: "CapEx Ratio", key: "result", derived: true }
    ],
    description: "Shows how much revenue is being reinvested in capital assets. Indicates the company's investment intensity for growth.",
    glAccounts: [
      { group: "Capital Expenditure", gls: [
        { code: "40301000-40399999", name: "CWIP + Asset Additions (403xxx)" }
      ]},
      { group: "Total Revenue", gls: [
        { code: "6-series", name: "Revenue from Ops + Other Income" }
      ]}
    ],
    unit: "%",
    target: "5-15%"
  },
  11: {
    name: "Inventory Turnover",
    section: "Working Capital",
    formula: "COGS / Average Inventory",
    formulaTerms: [
      { label: "COGS", key: "cogs" },
      { label: "Inventory", key: "inventory" },
      { label: "Inventory Turnover", key: "result", derived: true }
    ],
    description: "Measures how many times inventory is sold and replaced in a period. Higher turnover indicates efficient inventory management.",
    glAccounts: [
      { group: "COGS", gls: [
        { code: "70101xxx-70812xxx", name: "Cost of Goods Sold components" }
      ]},
      { group: "Inventory", gls: [
        { code: "50200000-50299999", name: "All inventory GLs (502xxx)" }
      ]}
    ],
    unit: "Times",
    target: ">=4x"
  },
  12: {
    name: "Earnings Per Share (EPS)",
    section: "Valuation",
    formula: "Net Income / Outstanding Shares (9,33,25,411)",
    formulaTerms: [
      { label: "Total Revenue", key: "totalRevenue" },
      { label: "Total Expenses", key: "totalExpenses" },
      { label: "Net Income", key: "netIncome", derived: true },
      { label: "Outstanding Shares", key: "shares" },
      { label: "EPS", key: "result", derived: true }
    ],
    description: "Profit allocated to each outstanding share. Key metric for investors to assess per-share profitability and compare with market price.",
    glAccounts: [
      { group: "Net Income", gls: [
        { code: "6-series minus 7-series", name: "Total Revenue - Total Expenses" }
      ]},
      { group: "Outstanding Shares", gls: [
        { code: "Fixed", name: "9,33,25,411 shares (constant)" }
      ]}
    ],
    unit: "Rs",
    target: "Growth YoY"
  },
  13: {
    name: "Operating Cash Flow (OCF)",
    section: "Cash Flow",
    formula: "(Net Income + Depreciation) / 1,00,00,000",
    formulaTerms: [
      { label: "Net Income", key: "netIncome" },
      { label: "Depreciation (added back)", key: "depreciation" },
      { label: "OCF (raw)", key: "ocfRaw", derived: true },
      { label: "OCF (in Crores)", key: "result", derived: true }
    ],
    description: "Cash generated from core business operations. Simplified as Net Income plus Depreciation (non-cash charge added back). Expressed in Crores.",
    glAccounts: [
      { group: "Net Income", gls: [
        { code: "6-series minus 7-series", name: "Total Revenue - Total Expenses" }
      ]},
      { group: "Depreciation (added back)", gls: [
        { code: "70601xxx", name: "Depreciation & Amortisation" }
      ]}
    ],
    unit: "Rs Cr",
    target: "Positive"
  },
  14: {
    name: "Free Cash Flow (FCF)",
    section: "Cash Flow",
    formula: "(OCF - CapEx) / 1,00,00,000",
    formulaTerms: [
      { label: "Net Income", key: "netIncome" },
      { label: "Depreciation (added back)", key: "depreciation" },
      { label: "CapEx (subtracted)", key: "capex" },
      { label: "FCF (raw)", key: "fcfRaw", derived: true },
      { label: "FCF (in Crores)", key: "result", derived: true }
    ],
    description: "Cash available after maintaining/expanding the asset base. Positive FCF means the company generates enough cash to fund operations and investments.",
    glAccounts: [
      { group: "OCF Components", gls: [
        { code: "6-series minus 7-series", name: "Net Income" },
        { code: "70601xxx", name: "Add: Depreciation" }
      ]},
      { group: "CapEx (subtracted)", gls: [
        { code: "40301000-40399999", name: "Capital Expenditure (403xxx)" }
      ]}
    ],
    unit: "Rs Cr",
    target: "Positive"
  },
  15: {
    name: "Cash Position",
    section: "Liquidity",
    formula: "Cash & Bank Balance / 1,00,00,000",
    formulaTerms: [
      { label: "Cash & Bank Balance (raw)", key: "cashRaw" },
      { label: "Cash Position (in Crores)", key: "result", derived: true }
    ],
    description: "Total liquid cash available with the company including bank deposits. Expressed in Crores for easy reading.",
    glAccounts: [
      { group: "Cash & Bank Balance", gls: [
        { code: "50401110-50402122", name: "Cash on Hand + Bank Balances (504xxx)" }
      ]}
    ],
    unit: "Rs Cr",
    target: "Adequate"
  },
  16: {
    name: "Current Ratio",
    section: "Liquidity",
    formula: "Current Assets / Current Liabilities",
    formulaTerms: [
      { label: "Current Assets", key: "currentAssets" },
      { label: "Current Liabilities", key: "currentLiab" },
      { label: "Current Ratio", key: "result", derived: true }
    ],
    description: "Measures the company's ability to pay short-term obligations. A ratio above 1.5 indicates good short-term financial health.",
    glAccounts: [
      { group: "Current Assets", gls: [
        { code: "50000000-59999999", name: "All 5-series GLs (Inventory, Receivables, Cash, etc.)" }
      ]},
      { group: "Current Liabilities", gls: [
        { code: "30000000-39999999", name: "All 3-series GLs (Payables, Short-term Borrowings)" }
      ]}
    ],
    unit: "Times",
    target: "1.5-3.0x"
  },
  // Revenue card popups (use IDs 101-104 to avoid conflicts)
  101: {
    name: "Revenue from Operations",
    section: "Revenue",
    formula: "Sum of all Operational Revenue GL accounts",
    formulaTerms: [
      { label: "Dom Sale FeCr (0060101010)", key: "gl_0060101010" },
      { label: "Dom Sale Cr brqt (0060101016)", key: "gl_0060101016" },
      { label: "Exp Sale FeCr (0060102010)", key: "gl_0060102010" },
      { label: "Exp Third Party Sale (0060102020)", key: "gl_0060102020" },
      { label: "Duty Drawback (0060102060)", key: "gl_0060102060" },
      { label: "Sales Tailing (0060105010)", key: "gl_0060105010" },
      { label: "Sales Scrap (0060202120)", key: "gl_0060202120" },
      { label: "Total Revenue from Operations", key: "result", derived: true }
    ],
    description: "Revenue earned from the company's core manufacturing and trading operations. Includes domestic sales, export sales, duty drawback, and scrap sales.",
    glAccounts: [
      { group: "Revenue from Operations", gls: [
        { code: "0060101010", name: "Dom Sale FeCr" },
        { code: "0060101016", name: "Dom Sale Cr brqt" },
        { code: "0060102010", name: "Exp Sale FeCr" },
        { code: "0060102020", name: "Exp Third Party Sale" },
        { code: "0060102060", name: "Duty Drawback" },
        { code: "0060105010", name: "Sales Tailing" },
        { code: "0060202120", name: "Sales Scrap" }
      ]}
    ],
    unit: "Rs Cr",
    target: "Growth"
  },
  102: {
    name: "Other Income",
    section: "Revenue",
    formula: "Sum of all Non-Operational Income GL accounts",
    formulaTerms: [
      { label: "Int on Bank Deposits (0060201010)", key: "gl_0060201010" },
      { label: "Int on Investments (0060201020)", key: "gl_0060201020" },
      { label: "Interest on Others (0060201030)", key: "gl_0060201030" },
      { label: "Interest from Others (0060201040)", key: "gl_0060201040" },
      { label: "Realised Forex P/L (0060202030)", key: "gl_0060202030" },
      { label: "Manual Forex P/L (0060202031)", key: "gl_0060202031" },
      { label: "Creditors W/Back (0060202130)", key: "gl_0060202130" },
      { label: "Lia & Prov W/Back (0060202140)", key: "gl_0060202140" },
      { label: "Miscellaneous Receipt (0060202150)", key: "gl_0060202150" },
      { label: "Insurance Claims (0060202160)", key: "gl_0060202160" },
      { label: "Asset Sale Clearing (0060202180)", key: "gl_0060202180" },
      { label: "Total Other Income", key: "result", derived: true }
    ],
    description: "Income from non-core activities including interest earned, write-backs, insurance claims and miscellaneous receipts.",
    glAccounts: [
      { group: "Other Income", gls: [
        { code: "0060201010", name: "Int on Bank Deposits" },
        { code: "0060201020", name: "Int on Investments" },
        { code: "0060201030", name: "Interest on Others" },
        { code: "0060201040", name: "Interest from Others" },
        { code: "0060202030", name: "Realised Forex P/L" },
        { code: "0060202031", name: "Manual Forex P/L" },
        { code: "0060202130", name: "Creditors W/Back" },
        { code: "0060202140", name: "Lia & Prov W/Back" },
        { code: "0060202150", name: "Miscellaneous Receipt" },
        { code: "0060202160", name: "Insurance Claims" },
        { code: "0060202180", name: "Asset Sale Clearing" }
      ]}
    ],
    unit: "Rs Cr",
    target: "Monitor"
  },
  103: {
    name: "Total Revenue",
    section: "Revenue",
    formula: "Revenue from Operations + Other Income",
    formulaTerms: [
      { label: "Revenue from Operations", key: "revOps" },
      { label: "Other Income", key: "otherIncome" },
      { label: "Total Revenue", key: "result", derived: true }
    ],
    description: "Combined total of operational revenue and other income. This is the top-line figure used as the denominator for most profitability ratios.",
    glAccounts: [
      { group: "Revenue from Operations", gls: [
        { code: "60101xxx-60202120", name: "All operational revenue GLs" }
      ]},
      { group: "Other Income", gls: [
        { code: "60201xxx-60202180", name: "All other income GLs" }
      ]}
    ],
    unit: "Rs Cr",
    target: "Growth"
  },
  104: {
    name: "Export Revenue",
    section: "Revenue",
    formula: "Export Sales / Revenue from Operations x 100",
    formulaTerms: [
      { label: "Exp Sale FeCr (0060102010)", key: "expSaleFeCr" },
      { label: "Exp Third Party Sale (0060102020)", key: "expThirdParty" },
      { label: "Total Export Revenue", key: "exportTotal", derived: true },
      { label: "Revenue from Operations", key: "revOps" },
      { label: "Export %", key: "result", derived: true }
    ],
    description: "Percentage of operational revenue coming from export sales. Higher export share reduces dependence on domestic market and provides forex earnings.",
    glAccounts: [
      { group: "Export Revenue", gls: [
        { code: "0060102010", name: "Exp Sale FeCr" },
        { code: "0060102020", name: "Exp Third Party Sale" }
      ]},
      { group: "Revenue from Operations (denominator)", gls: [
        { code: "60101xxx-60202120", name: "All operational revenue GLs" }
      ]}
    ],
    unit: "%",
    target: ">50%"
  },
  // Expense card popups (IDs 201-204)
  201: {
    name: "Total Expenses",
    section: "Expenses",
    formula: "Sum of all Expense GL accounts (7-series)",
    formulaTerms: [
      { label: "Total Expenses", key: "result", derived: true }
    ],
    hasGLBreakdown: true,
    description: "Total of all operating and non-operating expenses including materials, employee costs, power, depreciation, finance cost, and taxes.",
    glAccounts: [],
    unit: "Rs Cr",
    target: "Monitor"
  },
  202: {
    name: "Cost of Materials",
    section: "Expenses",
    formula: "Cost of Material Consumed GL accounts",
    formulaTerms: [
      { label: "Revenue from Operations", key: "revOps" },
      { label: "COGS as % of Revenue", key: "cogsPct", derived: true },
      { label: "Total COGS", key: "result", derived: true }
    ],
    hasGLBreakdown: true,
    description: "Direct cost of raw materials consumed in production. This is the largest expense component and directly impacts gross profit margin.",
    glAccounts: [],
    unit: "Rs Cr",
    target: "Monitor"
  },
  203: {
    name: "Gross Profit",
    section: "Profitability",
    formula: "Revenue from Operations - COGS (Excel methodology)",
    formulaTerms: [
      { label: "Revenue from Operations", key: "revOps" },
      { label: "COGS - Raw Materials", key: "cogsBreakdown.comc", indent: true },
      { label: "COGS - Changes in Inventory", key: "cogsBreakdown.changesInInv", indent: true },
      { label: "COGS - Power", key: "cogsBreakdown.power", indent: true },
      { label: "COGS - Factory Employee Cost", key: "cogsBreakdown.factoryEmployee", indent: true },
      { label: "COGS - Mfg Other Expenses", key: "cogsBreakdown.mfgOtherExp", indent: true },
      { label: "Total COGS", key: "cogs", derived: true },
      { label: "Gross Profit", key: "grossProfit", derived: true },
      { label: "GP Margin", key: "result", derived: true }
    ],
    description: "Revenue remaining after deducting full COGS (raw materials, inventory changes, power, factory employee costs, and manufacturing overheads). Matches Excel GP Margin methodology.",
    glAccounts: [
      { group: "Revenue from Operations", gls: [
        { code: "60101xxx-60105xxx", name: "All operational revenue GLs" }
      ]},
      { group: "COGS (Cost of Goods Sold)", gls: [
        { code: "70101xxx", name: "Raw Material Consumption" },
        { code: "70301xxx", name: "Changes in Inventory" },
        { code: "70401xxx", name: "Power & Fuel" },
        { code: "70501xxx", name: "Employee Cost (Factory)" },
        { code: "70801xxx", name: "Mfg Other Exp (Stores, Contract Labour, R&M, etc.)" }
      ]}
    ],
    unit: "Rs Cr",
    target: "Growth"
  },
  204: {
    name: "Net Income",
    section: "Profitability",
    formula: "Total Revenue - Total Expenses",
    formulaTerms: [
      { label: "Total Revenue", key: "totalRevenue" },
      { label: "Total Expenses", key: "totalExpenses" },
      { label: "Net Income", key: "netIncome", derived: true },
      { label: "Net Income Margin", key: "result", derived: true }
    ],
    description: "Bottom-line profit after all expenses including operations, depreciation, finance costs, and taxes. The ultimate measure of company profitability.",
    glAccounts: [
      { group: "Total Revenue", gls: [
        { code: "6-series", name: "Revenue from Ops + Other Income" }
      ]},
      { group: "Total Expenses", gls: [
        { code: "7-series", name: "All expense categories" }
      ]}
    ],
    unit: "Rs Cr",
    target: "Positive"
  }
};


const formatTermValue = (val) => {
  if (val === null || val === undefined || val === '--') return <span className="text-muted">--</span>;
  if (typeof val === 'string') return val;
  // If already formatted string
  return val;
};

const formatValue = (value, unit) => {
  if (value === null || value === undefined) return "--";
  const v = Number(value);
  if (unit === '%') return `${v.toFixed(2)}%`;
  if (unit === 'Times') return `${v.toFixed(2)}x`;
  if (unit === 'Rs') return `Rs ${v.toFixed(2)}`;
  if (unit === 'Rs Cr') return `Rs ${v.toFixed(2)} Cr`;
  return `${v.toFixed(2)} ${unit}`;
};

const KPIDetailModal = ({ kpiId, kpiValue, onClose, formulaValues }) => {
  if (!kpiId) return null;

  const detail = KPI_DETAILS[kpiId];
  if (!detail) return null;

  const isActive = kpiValue !== null && kpiValue !== undefined;

  return (
    <div
      className="modal d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header" style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>
            <div>
              <h5 className="modal-title text-white fw-bold mb-0">{detail.name}</h5>
              <small className="text-white-50">{detail.section}</small>
            </div>
            <button className="btn-close btn-close-white" onClick={onClose} />
          </div>

          <div className="modal-body">
            {/* Value + Status */}
            <div className="row mb-4">
              <div className="col-md-4 text-center">
                <div className="text-muted" style={{ fontSize: "12px", fontWeight: 600 }}>CURRENT VALUE</div>
                <div style={{
                  fontSize: "36px", fontWeight: "bold",
                  color: isActive ? "#198754" : "#6c757d"
                }}>
                  {formatValue(kpiValue, detail.unit)}
                </div>
              </div>
              <div className="col-md-4 text-center">
                <div className="text-muted" style={{ fontSize: "12px", fontWeight: 600 }}>TARGET</div>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#0d6efd" }}>
                  {detail.target}
                </div>
              </div>
              <div className="col-md-4 text-center">
                <div className="text-muted" style={{ fontSize: "12px", fontWeight: 600 }}>STATUS</div>
                <div className="mt-1">
                  {isActive
                    ? <span className="badge bg-success" style={{ fontSize: "14px" }}>Active</span>
                    : <span className="badge bg-warning text-dark" style={{ fontSize: "14px" }}>Awaiting Data</span>
                  }
                </div>
              </div>
            </div>

            {/* Formula */}
            <div className="card bg-light border-0 mb-3">
              <div className="card-body py-2">
                <div className="text-muted" style={{ fontSize: "11px", fontWeight: 600 }}>FORMULA</div>
                <div className="fw-bold" style={{ fontSize: "15px", fontFamily: "monospace" }}>
                  {detail.formula}
                </div>
              </div>
            </div>

            {/* GL Breakdown (for expense cards with dynamic GL data) */}
            {detail.hasGLBreakdown && formulaValues && formulaValues.glBreakdown && formulaValues.glBreakdown.length > 0 && (
              <div className="card border-primary mb-3">
                <div className="card-header bg-primary bg-opacity-10 py-2">
                  <div className="fw-bold" style={{ fontSize: "12px", color: "#0d6efd" }}>
                    GL ACCOUNT BREAKDOWN
                  </div>
                </div>
                <div className="card-body py-2">
                  <table className="table table-sm table-hover mb-0" style={{ fontSize: "13px" }}>
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "120px" }}>GL Code</th>
                        <th>Description</th>
                        {formulaValues.glBreakdown[0].category && <th>Category</th>}
                        <th className="text-end" style={{ width: "140px" }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formulaValues.glBreakdown.map((gl, i) => (
                        <tr key={i}>
                          <td className="font-monospace">{gl.glno}</td>
                          <td>{gl.desc}</td>
                          {gl.category && <td><span className="badge bg-secondary bg-opacity-25 text-dark" style={{ fontSize: "11px" }}>{gl.category}</span></td>}
                          <td className="text-end fw-bold">{gl.formatted}</td>
                        </tr>
                      ))}
                      <tr className="table-primary fw-bold">
                        <td colSpan={formulaValues.glBreakdown[0].category ? 3 : 2}>Total</td>
                        <td className="text-end">{formatTermValue(formulaValues.result)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Formula Calculated Values */}
            {detail.formulaTerms && formulaValues && (
              <div className="card border-primary mb-3">
                <div className="card-header bg-primary bg-opacity-10 py-2">
                  <div className="fw-bold" style={{ fontSize: "12px", color: "#0d6efd" }}>
                    CALCULATED VALUES
                  </div>
                </div>
                <div className="card-body py-2">
                  <table className="table table-sm mb-0" style={{ fontSize: "13px" }}>
                    <tbody>
                      {detail.formulaTerms.map((term, i) => {
                        // Support nested keys like "cogsBreakdown.comc"
                        let val = term.key.includes('.')
                          ? term.key.split('.').reduce((obj, k) => obj && obj[k], formulaValues)
                          : formulaValues[term.key];
                        return (
                          <tr key={i} style={{
                            fontWeight: term.derived ? 'bold' : 'normal',
                            fontSize: term.indent ? '12px' : undefined,
                            backgroundColor: term.derived ? '#f8f9fa' : 'transparent',
                            borderTop: term.derived ? '2px solid #dee2e6' : undefined
                          }}>
                            <td style={{ width: "55%", paddingLeft: term.indent ? "24px" : undefined }}>
                              {term.derived && <span style={{ color: "#0d6efd" }}>= </span>}
                              {term.indent && <span style={{ color: "#6c757d" }}>└ </span>}
                              {term.label}
                            </td>
                            <td className="text-end fw-bold" style={{
                              color: term.derived ? '#0d6efd' : '#212529'
                            }}>
                              {formatTermValue(val !== undefined ? val : '--')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mb-3">
              <div className="text-muted" style={{ fontSize: "11px", fontWeight: 600 }}>DESCRIPTION</div>
              <p className="mb-0" style={{ fontSize: "13px" }}>{detail.description}</p>
            </div>

            {/* GL Accounts */}
            <div>
              <div className="text-muted mb-2" style={{ fontSize: "11px", fontWeight: 600 }}>GL ACCOUNTS CONSIDERED</div>
              {detail.glAccounts.map((group, gi) => (
                <div key={gi} className="mb-2">
                  <div className="fw-bold" style={{ fontSize: "13px", color: "#6f42c1" }}>
                    {group.group}
                  </div>
                  <table className="table table-sm table-bordered mb-0" style={{ fontSize: "12px" }}>
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "180px" }}>GL Code</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.gls.map((gl, i) => (
                        <tr key={i}>
                          <td className="font-monospace">{gl.code}</td>
                          <td>{gl.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { KPI_DETAILS };
export default KPIDetailModal;
