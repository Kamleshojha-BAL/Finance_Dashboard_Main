import { useEffect, useState } from "react";
import axios from "axios";
import KPIGrid from "../components/overview/KPIGrid";
import PLTrendChart from "../components/charts/PLTrendChart";
import RevenueMixChart from "../components/charts/RevenueMixChart";
import KPIStatusTable from "../components/overview/KPIStatusTable";
import KPIDetailModal from "../components/overview/KPIDetailModal";

const API = "http://localhost:5000/api/finance";
const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const ExecutiveOverview = ({ month, year }) => {
  const [dashboard, setDashboard] = useState(null);
  const [revenueMix, setRevenueMix] = useState([]);
  const [plTrend, setPLTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [formulaValues, setFormulaValues] = useState({});

  const fetchData = () => {
    setLoading(true);
    const params = month && year ? `?month=${month}&year=${year}` : '';
    Promise.all([
      axios.get(`${API}/dashboard${params}`),
      axios.get(`${API}/revenue-mix${params}`),
      axios.get(`${API}/pl-trend`),
      axios.get(`${API}/kpi-formula-values${params}`)
    ])
      .then(([dashRes, mixRes, trendRes, formulaRes]) => {
        setDashboard(dashRes.data.data);
        setRevenueMix(mixRes.data || []);
        setPLTrend(trendRes.data || []);
        setFormulaValues(formulaRes.data.data || {});
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const handleRefresh = async () => {
    if (!month || !year) return;
    setRefreshing(true);
    try {
      await axios.post(`${API}/refresh-dashboard`, {
        month: Number(month),
        year: Number(year),
        empId: 'SYSTEM'
      });
      fetchData();
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2 text-muted">Loading dashboard...</p>
      </div>
    );
  }

  if (!dashboard) {
    return <div className="alert alert-warning">Failed to load dashboard data.</div>;
  }

  const { revenueSummary, revenueBreakdown, otherIncomeBreakdown, kpis } = dashboard;
  const monthLabel = `${MONTH_NAMES[Number(month)]} ${year}`;

  const topKpis = [
    {
      title: "REVENUE FROM OPERATIONS",
      value: `${revenueSummary.revenueFromOps.crores} Cr`,
      subtitle: `${revenueBreakdown.length} GL accounts`,
      gradient: "linear-gradient(135deg, #667eea, #764ba2)",
      kpiId: 101,
      kpiValue: revenueSummary.revenueFromOps.crores
    },
    {
      title: "OTHER INCOME",
      value: `${revenueSummary.otherIncome.crores} Cr`,
      subtitle: `${otherIncomeBreakdown.length} GL accounts`,
      gradient: "linear-gradient(135deg, #f093fb, #f5576c)",
      kpiId: 102,
      kpiValue: revenueSummary.otherIncome.crores
    },
    {
      title: "TOTAL REVENUE",
      value: `${revenueSummary.totalRevenue.crores} Cr`,
      subtitle: monthLabel,
      gradient: "linear-gradient(135deg, #4facfe, #00f2fe)",
      kpiId: 103,
      kpiValue: revenueSummary.totalRevenue.crores
    },
    {
      title: "EXPORT REVENUE",
      value: `${revenueSummary.exportPct}%`,
      subtitle: `${revenueSummary.exportRevenue.crores} Cr`,
      gradient: "linear-gradient(135deg, #43e97b, #38f9d7)",
      kpiId: 104,
      kpiValue: revenueSummary.exportPct
    }
  ];

  const handleRevenueCardClick = (card) => {
    setSelectedKPI({
      id: card.kpiId,
      value: card.kpiValue,
      formulaValues: formulaValues[card.kpiId]
    });
  };

  const handleKPIClick = (kpi) => {
    setSelectedKPI({
      id: kpi.id,
      value: kpi.value,
      formulaValues: formulaValues[kpi.id]
    });
  };

  const Card = ({ title, badge, children }) => (
    <div className="card shadow-sm h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="fw-bold mb-0">{title}</h6>
          {badge && <span className="badge bg-primary">{badge}</span>}
        </div>
        <hr className="mt-1" />
        <div style={{ minHeight: "220px" }}>{children}</div>
      </div>
    </div>
  );

  return (
    <div>
      {/* REFRESH BUTTON */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">Executive Overview - {monthLabel}</h5>
        <button
          className="btn btn-sm btn-outline-primary"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <>
              <span className="spinner-border spinner-border-sm me-1" />
              Refreshing KPIs...
            </>
          ) : (
            "Refresh KPIs"
          )}
        </button>
      </div>

      {/* REVENUE KPI CARDS — clickable */}
      <div className="row g-3 mb-4">
        {topKpis.map((card, i) => (
          <div key={i} className="col-md-3">
            <div
              className="card text-white border-0 shadow-sm h-100"
              style={{
                background: card.gradient,
                cursor: "pointer",
                transition: "transform 0.15s"
              }}
              onClick={() => handleRevenueCardClick(card)}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div className="card-body">
                <div style={{ fontSize: "11px", fontWeight: 600, opacity: 0.9, textTransform: "uppercase" }}>
                  {card.title}
                </div>
                <div className="mt-2" style={{ fontSize: "28px", fontWeight: "bold" }}>
                  {card.value}
                </div>
                <div style={{ fontSize: "12px", opacity: 0.8 }}>{card.subtitle}</div>
                <div className="mt-1" style={{ fontSize: "10px", opacity: 0.7 }}>
                  Click for details
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 16 KPI STATUS TABLE */}
      <div className="mb-4">
        <KPIStatusTable kpis={kpis} onKPIClick={handleKPIClick} />
      </div>

      {/* REVENUE BREAKDOWN + PIE CHART */}
      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <Card title="Revenue from Operations - Breakdown" badge="LIVE">
            <table className="table table-sm table-hover mb-0" style={{ fontSize: "13px" }}>
              <thead>
                <tr>
                  <th>Account</th>
                  <th className="text-end">Amount (Cr)</th>
                  <th className="text-end">%</th>
                </tr>
              </thead>
              <tbody>
                {revenueBreakdown.map((r, i) => (
                  <tr key={i}>
                    <td>{r.label}</td>
                    <td className="text-end fw-bold">{r.crores.toFixed(2)}</td>
                    <td className="text-end">
                      {revenueSummary.revenueFromOps.value > 0
                        ? ((r.amount / revenueSummary.revenueFromOps.value) * 100).toFixed(1)
                        : 0}%
                    </td>
                  </tr>
                ))}
                <tr className="table-primary fw-bold">
                  <td>Total</td>
                  <td className="text-end">{revenueSummary.revenueFromOps.crores.toFixed(2)}</td>
                  <td className="text-end">100%</td>
                </tr>
              </tbody>
            </table>
          </Card>
        </div>

        <div className="col-md-6">
          <Card title="Revenue Mix by Product" badge="CHART">
            <RevenueMixChart data={revenueMix} />
          </Card>
        </div>
      </div>

      {/* OTHER INCOME + TREND */}
      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <Card title="Other Income - Breakdown" badge="LIVE">
            <table className="table table-sm table-hover mb-0" style={{ fontSize: "13px" }}>
              <thead>
                <tr>
                  <th>Account</th>
                  <th className="text-end">Amount (Cr)</th>
                </tr>
              </thead>
              <tbody>
                {otherIncomeBreakdown.map((r, i) => (
                  <tr key={i}>
                    <td>{r.label}</td>
                    <td className="text-end fw-bold">{r.crores.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="table-primary fw-bold">
                  <td>Total Other Income</td>
                  <td className="text-end">{revenueSummary.otherIncome.crores.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </Card>
        </div>

        <div className="col-md-6">
          <Card title="Revenue Trend (Monthly)" badge="TREND">
            <PLTrendChart data={plTrend} />
          </Card>
        </div>
      </div>

      {/* KPI DETAIL MODAL */}
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

export default ExecutiveOverview;
