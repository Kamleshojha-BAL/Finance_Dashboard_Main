import { useEffect, useState } from "react";
import axios from "axios";
import KPIDetailModal from "../components/overview/KPIDetailModal";

const API = `http://${window.location.hostname}:8800/api/finance`;
const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const SHARES = "9,33,25,411";

const Valuation = ({ month, year }) => {
  const [eps, setEps] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [formulaValues, setFormulaValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!month || !year) return;
    setLoading(true);
    const params = `?month=${month}&year=${year}`;
    Promise.all([
      axios.get(`${API}/dashboard${params}`),
      axios.get(`${API}/kpi-formula-values${params}`)
    ])
      .then(([dashRes, formulaRes]) => {
        const data = dashRes.data.data;
        const epsKpi = (data.kpis || []).find(k => k.id === 12);
        setEps(epsKpi || null);
        setRevenue(data.revenueSummary || null);
        setFormulaValues(formulaRes.data.data || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [month, year]);

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2 text-muted">Loading valuation data...</p>
      </div>
    );
  }

  const monthLabel = `${MONTH_NAMES[Number(month)]} ${year}`;

  return (
    <div>
      <h5 className="fw-bold mb-1">Valuation - {monthLabel}</h5>
      <p className="text-muted mb-4" style={{ fontSize: "12px" }}>Click on the EPS card to view formula, calculated values & GL details</p>

      <div className="row g-4 mb-4">
        {/* EPS Card */}
        <div className="col-md-4">
          <div
            className="card shadow-sm h-100 border-0"
            style={{ cursor: "pointer", transition: "transform 0.15s" }}
            onClick={() => setShowModal(true)}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            <div className="card-body text-center p-4">
              <div style={{ fontSize: "36px" }}>💎</div>
              <div className="fw-bold mt-2" style={{ fontSize: "14px" }}>
                Earnings Per Share (EPS)
              </div>
              <div className="mt-3" style={{
                fontSize: "48px", fontWeight: "bold",
                color: eps && eps.value !== null ? (eps.value >= 0 ? '#198754' : '#dc3545') : '#6c757d'
              }}>
                {eps && eps.value !== null ? `Rs ${eps.value.toFixed(2)}` : "--"}
              </div>
              <div className="mt-2">
                <span className="badge bg-primary" style={{ fontSize: "11px" }}>
                  Target: Growth YoY
                </span>
              </div>
              <div className="text-muted mt-2" style={{ fontSize: "12px" }}>
                Net Income / Outstanding Shares
              </div>
              <div className="mt-2">
                {eps && eps.status === 'active'
                  ? <span className="badge bg-success">Active</span>
                  : <span className="badge bg-warning text-dark">Awaiting Data</span>
                }
              </div>
            </div>
          </div>
        </div>

        {/* Shares Info */}
        <div className="col-md-4">
          <div className="card shadow-sm h-100 border-0">
            <div className="card-body text-center p-4">
              <div style={{ fontSize: "36px" }}>📊</div>
              <div className="fw-bold mt-2" style={{ fontSize: "14px" }}>
                Outstanding Shares
              </div>
              <div className="mt-3" style={{ fontSize: "36px", fontWeight: "bold", color: "#0d6efd" }}>
                {SHARES}
              </div>
              <div className="text-muted mt-2" style={{ fontSize: "12px" }}>
                Fixed count used for EPS calculation
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Context */}
        <div className="col-md-4">
          <div className="card shadow-sm h-100 border-0">
            <div className="card-body text-center p-4">
              <div style={{ fontSize: "36px" }}>💹</div>
              <div className="fw-bold mt-2" style={{ fontSize: "14px" }}>
                Total Revenue
              </div>
              <div className="mt-3" style={{ fontSize: "36px", fontWeight: "bold", color: "#198754" }}>
                {revenue ? `${revenue.totalRevenue.crores} Cr` : "--"}
              </div>
              <div className="text-muted mt-2" style={{ fontSize: "12px" }}>
                Revenue from Ops + Other Income
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && eps && (
        <KPIDetailModal
          kpiId={12}
          kpiValue={eps.value}
          formulaValues={formulaValues[12]}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default Valuation;
