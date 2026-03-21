import { useEffect, useState } from "react";
import axios from "axios";
import KPIDetailModal from "../components/overview/KPIDetailModal";

const API = `http://${window.location.hostname}:8800/api/finance`;
const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// KPI definitions matching Excel "All" sheet (rows 5-20)
const KPI_ROWS = [
  { id: 1,  name: "Gross Profit Margin",              numLabel: "Gross Profit (GP)",                     denLabel: "Rev. from Operation",              unit: "%" },
  { id: 2,  name: "Net Profit Margin",                numLabel: "Net Profit",                            denLabel: "Total Revenue",                    unit: "%" },
  { id: 3,  name: "Operating Profit Margin (EBIT)",   numLabel: "Operating Income/EBIT",                 denLabel: "Revenue from Operation",           unit: "%" },
  { id: 4,  name: "Operating Ratio",                  numLabel: "Operating Expenses",                    denLabel: "Total Revenue",                    unit: "%" },
  { id: 5,  name: "EBITDA Margin",                    numLabel: "EBITDA",                                denLabel: "Revenue from Operation",           unit: "%" },
  { id: 6,  name: "Return on Assets",                 numLabel: "Net Income",                            denLabel: "Total Assets",                     unit: "%" },
  { id: 7,  name: "Return on Equity",                 numLabel: "Net Income",                            denLabel: "Shareholders' Equity",             unit: "%" },
  { id: 8,  name: "Return on Investment",             numLabel: "Interest on Investment",                denLabel: "Int. bearing Investment",           unit: "%" },
  { id: 9,  name: "Depreciation Ratio",               numLabel: "Accumulated Depreciation",              denLabel: "Total Assets",                     unit: "%" },
  { id: 10, name: "CapEx Ratio",                      numLabel: "Capital Expenditures",                  denLabel: "Total Revenue",                    unit: "%" },
  { id: 11, name: "Inventory Turnover Ratio (Times)", numLabel: "Cost of Goods Sold",                    denLabel: "Average Inventory",                unit: "x" },
  { id: 12, name: "EPS (Rs.)",                        numLabel: "Net Income",                            denLabel: "Number of Outstanding Shares",     unit: "Rs" },
  { id: 13, name: "Operating Cash Flow (Rs. in Crs)", numLabel: "Net Income+Dep+Changes in WC",         denLabel: "",                                 unit: "Cr" },
  { id: 14, name: "Free Cash Flow (Rs. in Crs)",      numLabel: "Operating Cash Flow - Capital Expenditures", denLabel: "",                            unit: "Cr" },
  { id: 15, name: "Cash Position Monitoring (Rs. in Crs)", numLabel: "Cash in Hand+Cash at Bank",        denLabel: "",                                 unit: "Cr" },
  { id: 16, name: "Current Ratio (Times)",            numLabel: "Current Assets",                        denLabel: "Current Liabilities",              unit: "x" },
];

// Category groupings for row coloring
const CATEGORY_COLORS = {
  1: "#f3e8ff", 2: "#f3e8ff", 3: "#f3e8ff", 4: "#f3e8ff", 5: "#f3e8ff",  // Profitability - purple tint
  6: "#fff3cd", 7: "#fff3cd", 8: "#fff3cd",                                // Returns - yellow tint
  9: "#d1ecf1", 10: "#d1ecf1",                                             // Asset Mgmt - cyan tint
  11: "#d4edda",                                                            // Working Capital - green tint
  12: "#fce4ec",                                                            // Valuation - pink tint
  13: "#e8f5e9", 14: "#e8f5e9",                                             // Cash Flow - green tint
  15: "#e3f2fd", 16: "#e3f2fd",                                             // Liquidity - blue tint
};

const formatIndian = (num) => {
  if (num === null || num === undefined || isNaN(num)) return "--";
  const absNum = Math.abs(num);
  const sign = num < 0 ? "-" : "";

  // Format in Indian numbering (xx,xx,xx,xxx)
  const str = Math.round(absNum).toString();
  if (str.length <= 3) return sign + str;

  let lastThree = str.substring(str.length - 3);
  let remaining = str.substring(0, str.length - 3);
  if (remaining.length > 0) {
    lastThree = "," + lastThree;
  }
  const formatted = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
  return sign + formatted;
};

const formatValue = (kpi, kpiDef) => {
  if (!kpi || kpi.value === null || kpi.value === undefined) return "--";
  if (kpiDef.unit === "%") return `${kpi.value.toFixed(2)}%`;
  if (kpiDef.unit === "x") return kpi.value.toFixed(2);
  if (kpiDef.unit === "Rs") return kpi.value.toFixed(2);
  if (kpiDef.unit === "Cr") return kpi.value.toFixed(2);
  return kpi.value.toFixed(2);
};

const Valuation = ({ month, year, fyear }) => {
  const [kpis, setKpis] = useState([]);
  const [formulaValues, setFormulaValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedKPI, setSelectedKPI] = useState(null);

  useEffect(() => {
    if (!month && !fyear) return;
    setLoading(true);
    const params = month && year ? `?month=${month}&year=${year}` : `?fyear=${fyear}`;
    Promise.all([
      axios.get(`${API}/dashboard${params}`),
      axios.get(`${API}/kpi-formula-values${params}`)
    ])
      .then(([dashRes, formulaRes]) => {
        setKpis(dashRes.data.data.kpis || []);
        setFormulaValues(formulaRes.data.data || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [month, year, fyear]);

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2 text-muted">Loading financial ratio data...</p>
      </div>
    );
  }

  const monthLabel = fyear && !month
    ? `FY ${fyear}-${String(Number(fyear) + 1).slice(-2)}`
    : `${MONTH_NAMES[Number(month)]} ${year}`;

  const handleClick = (kpi) => {
    if (kpi) {
      setSelectedKPI({ ...kpi, formulaValues: formulaValues[kpi.id] });
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="fw-bold mb-0">Financial Ratio Analysis</h5>
          <small className="text-muted">All 16 KPIs with Numerator, Denominator & Calculated Values</small>
        </div>
        <span className="badge bg-secondary" style={{ fontSize: "12px" }}>{monthLabel}</span>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-bordered mb-0" style={{ fontSize: "13px" }}>
              <thead>
                <tr style={{ backgroundColor: "#2c3e50", color: "#fff" }}>
                  <th style={{ width: "30px", textAlign: "center", padding: "10px 8px" }}>#</th>
                  <th style={{ padding: "10px 12px" }}>Parameter</th>
                  <th style={{ padding: "10px 12px" }}>Numerator</th>
                  <th style={{ padding: "10px 12px" }}>Denominator</th>
                  <th className="text-end" style={{ padding: "10px 12px", width: "150px" }}>Numerator Value</th>
                  <th className="text-end" style={{ padding: "10px 12px", width: "150px" }}>Denominator Value</th>
                  <th className="text-end" style={{ padding: "10px 12px", width: "100px", fontWeight: "bold" }}>{monthLabel}</th>
                </tr>
              </thead>
              <tbody>
                {KPI_ROWS.map((def, idx) => {
                  const kpi = kpis.find(k => k.id === def.id);
                  const bgColor = CATEGORY_COLORS[def.id] || "#fff";
                  const hasData = kpi && kpi.value !== null;

                  return (
                    <tr
                      key={def.id}
                      style={{
                        backgroundColor: bgColor,
                        cursor: "pointer",
                        transition: "background-color 0.15s"
                      }}
                      onClick={() => handleClick(kpi)}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = "#e2e6ea"}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = bgColor}
                    >
                      <td className="text-center" style={{ fontWeight: "bold", color: "#6c757d" }}>
                        {idx + 1}
                      </td>
                      <td style={{ fontWeight: "600" }}>{def.name}</td>
                      <td className="text-muted">{def.numLabel}</td>
                      <td className="text-muted">{def.denLabel || "--"}</td>
                      <td className="text-end" style={{ fontFamily: "monospace", fontWeight: "600" }}>
                        {kpi && kpi.numerator !== null ? formatIndian(kpi.numerator) : "--"}
                      </td>
                      <td className="text-end" style={{ fontFamily: "monospace", fontWeight: "600" }}>
                        {kpi && kpi.denominator !== null ? formatIndian(kpi.denominator) : "--"}
                      </td>
                      <td className="text-end" style={{
                        fontWeight: "bold",
                        fontSize: "14px",
                        color: hasData ? "#0d6efd" : "#6c757d"
                      }}>
                        {hasData ? formatValue(kpi, def) : "--"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-2 text-muted" style={{ fontSize: "11px" }}>
        Click any row to view detailed formula breakdown & GL accounts
      </div>

      {selectedKPI && (
        <KPIDetailModal
          kpiId={selectedKPI.id}
          kpiValue={selectedKPI.value}
          formulaValues={selectedKPI.formulaValues}
          onClose={() => setSelectedKPI(null)}
        />
      )}
    </div>
  );
};

export default Valuation;
