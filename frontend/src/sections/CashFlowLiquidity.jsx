import { useEffect, useState } from "react";
import axios from "axios";
import KPIDetailModal from "../components/overview/KPIDetailModal";

const API = `http://${window.location.hostname}:8800/api/finance`;
const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const KPI_IDS = [13, 14, 15, 16];

const KPI_INFO = {
  13: { label: "Operating Cash Flow", icon: "💵", color: "#198754", desc: "Net Income + Depreciation" },
  14: { label: "Free Cash Flow", icon: "🏦", color: "#0d6efd", desc: "OCF - CapEx" },
  15: { label: "Cash Position", icon: "💰", color: "#0dcaf0", desc: "Cash & Bank Balance" },
  16: { label: "Current Ratio", icon: "⚖️", color: "#6f42c1", desc: "Current Assets / Current Liabilities" }
};

const formatKPIValue = (kpi) => {
  if (kpi.value === null) return "--";
  const v = kpi.value;
  if (kpi.unit === 'Times') return `${v.toFixed(2)}x`;
  if (kpi.unit === 'Rs Cr') return `Rs ${v.toFixed(2)} Cr`;
  return `${v.toFixed(2)} ${kpi.unit}`;
};

const CashFlowLiquidity = ({ month, year, fyear }) => {
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
        const all = dashRes.data.data.kpis || [];
        setKpis(all.filter(k => KPI_IDS.includes(k.id)));
        setFormulaValues(formulaRes.data.data || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [month, year, fyear]);

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2 text-muted">Loading cash flow data...</p>
      </div>
    );
  }

  const monthLabel = `${MONTH_NAMES[Number(month)]} ${year}`;

  const handleClick = (kpi) => {
    setSelectedKPI({ ...kpi, formulaValues: formulaValues[kpi.id] });
  };

  return (
    <div>
      <h5 className="fw-bold mb-1">Cash Flow & Liquidity - {monthLabel}</h5>
      <p className="text-muted mb-4" style={{ fontSize: "12px" }}>Click on any card to view formula, calculated values & GL details</p>

      <div className="row g-3 mb-4">
        {KPI_IDS.map(id => {
          const kpi = kpis.find(k => k.id === id);
          const info = KPI_INFO[id];
          if (!kpi) return null;

          const isPositive = kpi.value !== null && kpi.value > 0;
          const isNegative = kpi.value !== null && kpi.value < 0;

          return (
            <div key={id} className="col-md-3">
              <div
                className="card shadow-sm h-100 border-0"
                style={{ cursor: "pointer", transition: "transform 0.15s" }}
                onClick={() => handleClick(kpi)}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
              >
                <div className="card-body text-center p-4">
                  <div style={{ fontSize: "32px" }}>{info.icon}</div>
                  <div className="text-muted mt-1" style={{ fontSize: "12px", fontWeight: 600 }}>
                    {info.label}
                  </div>
                  <div className="mt-2" style={{
                    fontSize: "30px",
                    fontWeight: "bold",
                    color: kpi.value === null ? '#6c757d' : isPositive ? '#198754' : isNegative ? '#dc3545' : info.color
                  }}>
                    {formatKPIValue(kpi)}
                  </div>
                  <div className="mt-1">
                    <span className="badge" style={{ background: info.color, fontSize: "11px" }}>
                      Target: {kpi.target}
                    </span>
                  </div>
                  <div className="text-muted mt-2" style={{ fontSize: "11px" }}>{info.desc}</div>
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

export default CashFlowLiquidity;
