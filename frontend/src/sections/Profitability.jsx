import { useEffect, useState } from "react";
import axios from "axios";
import KPIDetailModal from "../components/overview/KPIDetailModal";

const API = "http://localhost:5000/api/finance";
const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const KPI_IDS = [1, 2, 3, 5, 4]; // GP, NP, EBIT, EBITDA, Operating Ratio

const KPI_INFO = {
  1: { label: "Gross Profit Margin", icon: "📊", color: "#6f42c1", desc: "(Revenue - COGS) / Revenue" },
  2: { label: "Net Profit Margin", icon: "📈", color: "#0d6efd", desc: "(Total Revenue - Total Expenses) / Revenue" },
  3: { label: "EBIT Margin", icon: "💹", color: "#198754", desc: "Earnings Before Interest & Tax / Revenue" },
  5: { label: "EBITDA Margin", icon: "🏭", color: "#0dcaf0", desc: "EBIT + Depreciation / Revenue" },
  4: { label: "Operating Ratio", icon: "⚙️", color: "#e85d04", desc: "Operating Expenses / Revenue" }
};

const Profitability = ({ month, year }) => {
  const [kpis, setKpis] = useState([]);
  const [formulaValues, setFormulaValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedKPI, setSelectedKPI] = useState(null);

  useEffect(() => {
    if (!month || !year) return;
    setLoading(true);
    const params = `?month=${month}&year=${year}`;
    Promise.all([
      axios.get(`${API}/dashboard${params}`),
      axios.get(`${API}/kpi-formula-values${params}`)
    ])
      .then(([dashRes, formulaRes]) => {
        const all = dashRes.data.data.kpis || [];
        setKpis(all.filter(k => KPI_IDS.includes(k.id)));
        setFormulaValues(formulaRes.data.data || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [month, year]);

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2 text-muted">Loading profitability data...</p>
      </div>
    );
  }

  const monthLabel = `${MONTH_NAMES[Number(month)]} ${year}`;

  const handleClick = (kpi) => {
    setSelectedKPI({ ...kpi, formulaValues: formulaValues[kpi.id] });
  };

  return (
    <div>
      <h5 className="fw-bold mb-1">Profitability Analysis - {monthLabel}</h5>
      <p className="text-muted mb-4" style={{ fontSize: "12px" }}>Click on any card to view formula, calculated values & GL details</p>

      <div className="row g-3 mb-4">
        {KPI_IDS.map(id => {
          const kpi = kpis.find(k => k.id === id);
          const info = KPI_INFO[id];
          if (!kpi) return null;
          return (
            <div key={id} className="col-md-4 col-lg">
              <div
                className="card shadow-sm h-100 border-0"
                style={{ cursor: "pointer", transition: "transform 0.15s" }}
                onClick={() => handleClick(kpi)}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
              >
                <div className="card-body text-center">
                  <div style={{ fontSize: "28px" }}>{info.icon}</div>
                  <div className="text-muted mt-1" style={{ fontSize: "12px", fontWeight: 600 }}>
                    {info.label}
                  </div>
                  <div className="mt-2" style={{ fontSize: "32px", fontWeight: "bold", color: info.color }}>
                    {kpi.value !== null ? `${kpi.value.toFixed(2)}%` : "--"}
                  </div>
                  <div className="mt-1">
                    <span className="badge" style={{ background: info.color, fontSize: "11px" }}>
                      Target: {kpi.target}
                    </span>
                  </div>
                  <div className="text-muted mt-2" style={{ fontSize: "11px" }}>
                    {info.desc}
                  </div>
                  <div className="mt-2">
                    {kpi.status === 'active'
                      ? <span className="badge bg-success">Active</span>
                      : <span className="badge bg-warning text-dark">Awaiting Data</span>
                    }
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Table */}
      <div className="card shadow-sm border-0">
        <div className="card-body">
          <h6 className="fw-bold mb-3">Profitability Summary</h6>
          <table className="table table-sm table-hover mb-0" style={{ fontSize: "13px" }}>
            <thead className="table-light">
              <tr>
                <th>KPI</th>
                <th className="text-center">Value</th>
                <th className="text-center">Target</th>
                <th className="text-center">Status</th>
                <th>Formula</th>
              </tr>
            </thead>
            <tbody>
              {KPI_IDS.map(id => {
                const kpi = kpis.find(k => k.id === id);
                const info = KPI_INFO[id];
                if (!kpi) return null;
                return (
                  <tr key={id} style={{ cursor: "pointer" }} onClick={() => handleClick(kpi)}>
                    <td className="fw-bold">{info.label}</td>
                    <td className="text-center fw-bold" style={{ color: info.color }}>
                      {kpi.value !== null ? `${kpi.value.toFixed(2)}%` : "--"}
                    </td>
                    <td className="text-center">{kpi.target}</td>
                    <td className="text-center">
                      {kpi.status === 'active'
                        ? <span className="badge bg-success">Active</span>
                        : <span className="badge bg-warning text-dark">Awaiting</span>
                      }
                    </td>
                    <td className="text-muted" style={{ fontSize: "11px" }}>{info.desc}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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

export default Profitability;
