import { useEffect, useState } from "react";
import axios from "axios";
import KPIDetailModal from "../components/overview/KPIDetailModal";

const API = "http://localhost:5000/api/finance";
const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const KPI_IDS = [6, 7, 8];

const KPI_INFO = {
  6: { label: "Return on Assets (ROA)", icon: "🏢", color: "#0d6efd", desc: "Net Income / Total Assets" },
  7: { label: "Return on Equity (ROE)", icon: "👥", color: "#6f42c1", desc: "Net Income / Shareholders Equity" },
  8: { label: "Return on Investment (ROI)", icon: "💰", color: "#198754", desc: "Investment Income / Total Investments" }
};

const Returns = ({ month, year }) => {
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
        <p className="mt-2 text-muted">Loading returns data...</p>
      </div>
    );
  }

  const monthLabel = `${MONTH_NAMES[Number(month)]} ${year}`;

  const handleClick = (kpi) => {
    setSelectedKPI({ ...kpi, formulaValues: formulaValues[kpi.id] });
  };

  return (
    <div>
      <h5 className="fw-bold mb-1">Returns Analysis - {monthLabel}</h5>
      <p className="text-muted mb-4" style={{ fontSize: "12px" }}>Click on any card to view formula, calculated values & GL details</p>

      <div className="row g-4 mb-4">
        {KPI_IDS.map(id => {
          const kpi = kpis.find(k => k.id === id);
          const info = KPI_INFO[id];
          if (!kpi) return null;
          return (
            <div key={id} className="col-md-4">
              <div
                className="card shadow-sm h-100 border-0"
                style={{ cursor: "pointer", transition: "transform 0.15s" }}
                onClick={() => handleClick(kpi)}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
              >
                <div className="card-body text-center p-4">
                  <div style={{ fontSize: "36px" }}>{info.icon}</div>
                  <div className="fw-bold mt-2" style={{ fontSize: "14px" }}>{info.label}</div>
                  <div className="mt-3" style={{ fontSize: "40px", fontWeight: "bold", color: info.color }}>
                    {kpi.value !== null ? `${kpi.value.toFixed(2)}%` : "--"}
                  </div>
                  <div className="mt-2">
                    <span className="badge" style={{ background: info.color, fontSize: "11px" }}>
                      Target: {kpi.target}
                    </span>
                  </div>
                  <div className="text-muted mt-2" style={{ fontSize: "12px" }}>{info.desc}</div>
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

export default Returns;
