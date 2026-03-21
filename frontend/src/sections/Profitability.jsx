import { useEffect, useState } from "react";
import axios from "axios";

const API = `http://${window.location.hostname}:8800/api/finance`;
const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fmtCr = (v) => v !== null && v !== undefined ? `${v.toFixed(2)} Cr` : "--";
const fmt = (v) => v !== null && v !== undefined ? v.toFixed(2) : "--";

const Profitability = ({ month, year, fyear }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandFactory, setExpandFactory] = useState(false);
  const [expandMfgGroups, setExpandMfgGroups] = useState({});

  useEffect(() => {
    if (!month && !fyear) return;
    setLoading(true);
    const params = month && year ? `?month=${month}&year=${year}` : `?fyear=${fyear}`;
    axios.get(`${API}/profitability-breakdown${params}`)
      .then(res => { setData(res.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [month, year, fyear]);

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2 text-muted">Loading profitability data...</p>
      </div>
    );
  }

  if (!data) return <div className="alert alert-warning">No profitability data available.</div>;

  const monthLabel = fyear && !month
    ? `FY ${fyear}-${String(Number(fyear) + 1).slice(-2)}`
    : `${MONTH_NAMES[Number(month)]} ${year}`;

  const { gpMargin, npMargin, ebit, ebitda } = data;

  const toggleMfgGroup = (label) => {
    setExpandMfgGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  // Shared styles
  const headerStyle = (color) => ({
    background: color,
    color: "#fff",
    padding: "16px 20px",
    borderRadius: "8px 8px 0 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  });

  const Row = ({ label, value, bold, highlight, indent = 0, onClick, expandable, expanded }) => (
    <tr
      style={{
        fontWeight: bold ? "bold" : "normal",
        backgroundColor: highlight ? "#e8f4fd" : "transparent",
        borderTop: highlight ? "2px solid #0d6efd" : undefined,
        cursor: onClick ? "pointer" : "default"
      }}
      onClick={onClick}
    >
      <td style={{ paddingLeft: `${16 + indent * 24}px`, fontSize: indent >= 2 ? "12px" : "13px" }}>
        {expandable && (
          <span style={{ marginRight: "6px", fontSize: "10px", color: "#6c757d" }}>
            {expanded ? "▼" : "▶"}
          </span>
        )}
        {indent > 0 && !expandable && <span style={{ color: "#adb5bd", marginRight: "4px" }}>└</span>}
        {label}
      </td>
      <td className="text-end" style={{
        fontWeight: bold ? "bold" : "600",
        color: highlight ? "#0d6efd" : "#212529",
        fontFamily: "monospace",
        fontSize: bold ? "14px" : "13px"
      }}>
        {value}
      </td>
    </tr>
  );

  return (
    <div>
      <h5 className="fw-bold mb-1">Profitability Analysis - {monthLabel}</h5>
      <p className="text-muted mb-4" style={{ fontSize: "12px" }}>
        Detailed breakdown matching Excel GP Margin, NP Margin, EBIT & EBITDA sheets
      </p>

      <div className="row g-4">
        {/* ── GP MARGIN ── */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 mb-4">
            <div style={headerStyle("linear-gradient(135deg, #6f42c1, #9b59b6)")}>
              <div>
                <div style={{ fontSize: "13px", opacity: 0.9 }}>Gross Profit Margin</div>
                <div style={{ fontSize: "28px", fontWeight: "bold" }}>{fmt(gpMargin.margin)}%</div>
              </div>
              <div style={{ textAlign: "right", fontSize: "12px", opacity: 0.8 }}>
                <div>GP: {fmtCr(gpMargin.grossProfit)}</div>
                <div>Revenue: {fmtCr(gpMargin.revOps)}</div>
              </div>
            </div>
            <div className="card-body p-0">
              <table className="table table-hover mb-0" style={{ fontSize: "13px" }}>
                <thead className="table-light">
                  <tr>
                    <th style={{ paddingLeft: "16px" }}>Particulars</th>
                    <th className="text-end" style={{ width: "140px" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <Row label="Revenue from Operations" value={fmtCr(gpMargin.revOps)} bold />
                  <Row label="COGS (Cost of Goods Sold)" value={fmtCr(gpMargin.cogs.total)} bold indent={0} />
                  <Row label="Cost of Raw Materials Consumed" value={fmtCr(gpMargin.cogs.comc)} indent={1} />
                  <Row label="(Increase)/Decrease in Inventories" value={fmtCr(gpMargin.cogs.changesInInv)} indent={1} />

                  {/* Factory Employee - expandable */}
                  <Row
                    label={`Employee Cost - Factory Portion`}
                    value={fmtCr(gpMargin.cogs.factoryEmployee.total)}
                    indent={1}
                    expandable
                    expanded={expandFactory}
                    onClick={() => setExpandFactory(!expandFactory)}
                  />
                  {expandFactory && gpMargin.cogs.factoryEmployee.glRows.map((gl, i) => (
                    <tr key={i} style={{ fontSize: "12px", backgroundColor: "#f8f9fa" }}>
                      <td style={{ paddingLeft: "72px" }}>
                        <span className="font-monospace text-muted" style={{ fontSize: "11px" }}>{gl.glno}</span>
                        {" "}{gl.desc}
                      </td>
                      <td className="text-end" style={{ fontFamily: "monospace", fontSize: "12px" }}>{fmtCr(gl.crores)}</td>
                    </tr>
                  ))}
                  {expandFactory && gpMargin.cogs.factoryEmployee.contributions.map((c, i) => (
                    <tr key={`pf-${i}`} style={{ fontSize: "12px", backgroundColor: "#f0f7ff" }}>
                      <td style={{ paddingLeft: "72px" }}>
                        <span className="badge bg-info text-dark" style={{ fontSize: "10px", marginRight: "6px" }}>{c.glno}</span>
                        {c.desc}
                      </td>
                      <td className="text-end" style={{ fontFamily: "monospace", fontSize: "12px" }}>{fmtCr(c.crores)}</td>
                    </tr>
                  ))}

                  <Row label="Power" value={fmtCr(gpMargin.cogs.power)} indent={1} />

                  {/* Manufacturing Other Exp sub-groups */}
                  {gpMargin.cogs.mfgOtherExp.groups.map((group, i) => (
                    <tr key={`mfg-${i}`}>
                      <td
                        style={{ paddingLeft: "40px", cursor: "pointer", fontSize: "13px" }}
                        onClick={() => toggleMfgGroup(group.label)}
                      >
                        <span style={{ marginRight: "6px", fontSize: "10px", color: "#6c757d" }}>
                          {expandMfgGroups[group.label] ? "▼" : "▶"}
                        </span>
                        {group.label.replace('Other Exp-', '')}
                      </td>
                      <td className="text-end" style={{ fontFamily: "monospace", fontWeight: "600" }}>
                        {fmtCr(group.crores)}
                      </td>
                    </tr>
                  ))}

                  {/* Expanded GL rows for each mfg group */}
                  {gpMargin.cogs.mfgOtherExp.groups.map((group) =>
                    expandMfgGroups[group.label] && group.gls.map((gl, j) => (
                      <tr key={`${group.label}-${j}`} style={{ fontSize: "11px", backgroundColor: "#f8f9fa" }}>
                        <td style={{ paddingLeft: "72px" }}>
                          <span className="font-monospace text-muted" style={{ fontSize: "10px" }}>{gl.glno}</span>
                          {" "}{gl.desc}
                        </td>
                        <td className="text-end" style={{ fontFamily: "monospace", fontSize: "11px" }}>{fmtCr(gl.crores)}</td>
                      </tr>
                    ))
                  )}

                  <Row label="Gross Profit" value={fmtCr(gpMargin.grossProfit)} bold highlight />
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── NP MARGIN ── */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 mb-4">
            <div style={headerStyle("linear-gradient(135deg, #0d6efd, #6610f2)")}>
              <div>
                <div style={{ fontSize: "13px", opacity: 0.9 }}>Net Profit Margin</div>
                <div style={{ fontSize: "28px", fontWeight: "bold" }}>{fmt(npMargin.margin)}%</div>
              </div>
              <div style={{ textAlign: "right", fontSize: "12px", opacity: 0.8 }}>
                <div>NP: {fmtCr(npMargin.netProfit)}</div>
                <div>Revenue: {fmtCr(npMargin.totalRevenue)}</div>
              </div>
            </div>
            <div className="card-body p-0">
              <table className="table table-hover mb-0" style={{ fontSize: "13px" }}>
                <thead className="table-light">
                  <tr>
                    <th style={{ paddingLeft: "16px" }}>Particulars</th>
                    <th className="text-end" style={{ width: "140px" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <Row label="Total Revenue" value={fmtCr(npMargin.totalRevenue)} bold />
                  {npMargin.expenses.map((exp, i) => (
                    <Row key={i} label={exp.label} value={fmtCr(exp.crores)} indent={1} />
                  ))}
                  <Row label="Total Expenses" value={fmtCr(npMargin.totalExpenses)} bold indent={0} />
                  <Row label="Net Profit" value={fmtCr(npMargin.netProfit)} bold highlight />
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── EBIT ── */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 mb-4">
            <div style={headerStyle("linear-gradient(135deg, #198754, #20c997)")}>
              <div>
                <div style={{ fontSize: "13px", opacity: 0.9 }}>Operating Profit (EBIT)</div>
                <div style={{ fontSize: "28px", fontWeight: "bold" }}>{fmt(ebit.margin)}%</div>
              </div>
              <div style={{ textAlign: "right", fontSize: "12px", opacity: 0.8 }}>
                <div>EBIT: {fmtCr(ebit.ebit)}</div>
              </div>
            </div>
            <div className="card-body p-0">
              <table className="table table-hover mb-0" style={{ fontSize: "13px" }}>
                <thead className="table-light">
                  <tr>
                    <th style={{ paddingLeft: "16px" }}>Particulars</th>
                    <th className="text-end" style={{ width: "140px" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <Row label="Revenue from Operations" value={fmtCr(ebit.revOps)} bold />
                  <Row label="Operating Expenses (excl. Interest)" value={fmtCr(ebit.opExExclInterest)} indent={1} />
                  <Row label="Operating Income / EBIT" value={fmtCr(ebit.ebit)} bold highlight />
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── EBITDA ── */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 mb-4">
            <div style={headerStyle("linear-gradient(135deg, #0dcaf0, #6f42c1)")}>
              <div>
                <div style={{ fontSize: "13px", opacity: 0.9 }}>EBITDA Margin</div>
                <div style={{ fontSize: "28px", fontWeight: "bold" }}>{fmt(ebitda.margin)}%</div>
              </div>
              <div style={{ textAlign: "right", fontSize: "12px", opacity: 0.8 }}>
                <div>EBITDA: {fmtCr(ebitda.ebitda)}</div>
              </div>
            </div>
            <div className="card-body p-0">
              <table className="table table-hover mb-0" style={{ fontSize: "13px" }}>
                <thead className="table-light">
                  <tr>
                    <th style={{ paddingLeft: "16px" }}>Particulars</th>
                    <th className="text-end" style={{ width: "140px" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <Row label="Revenue from Operations" value={fmtCr(ebitda.revOps)} bold />
                  <Row label="Operating Expenses (excl. Interest & Dep.)" value={fmtCr(ebitda.opExExclIntDep)} indent={1} />
                  <Row label="EBITDA" value={fmtCr(ebitda.ebitda)} bold highlight />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profitability;
