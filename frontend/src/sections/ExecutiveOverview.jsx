import { useEffect, useState } from "react";
import axios from "axios";
import KPIGrid from "../components/overview/KPIGrid";
import PLTrendChart from "../components/charts/PLTrendChart";
import RevenueMixChart from "../components/charts/RevenueMixChart";
import KPIStatusTable from "../components/overview/KPIStatusTable";
import KPIDetailModal from "../components/overview/KPIDetailModal";
import TrialBalanceSummary from "../components/overview/TrialBalanceSummary";

const API = `http://${window.location.hostname}:8800/api/finance`;
const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const ExecutiveOverview = ({ month, year, fyear, selectedPeriod }) => {
  const [dashboard, setDashboard] = useState(null);
  const [revenueMix, setRevenueMix] = useState([]);
  const [plTrend, setPLTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [formulaValues, setFormulaValues] = useState({});

  const fetchData = () => {
    setLoading(true);
    let params = '';
    if (month && year) params = `?month=${month}&year=${year}`;
    else if (fyear) params = `?fyear=${fyear}`;
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
  }, [month, year, fyear]);

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

  const { revenueSummary, expenseSummary, revenueBreakdown, otherIncomeBreakdown, kpis } = dashboard;
  const monthLabel = fyear ? `FY ${fyear}-${String(Number(fyear) + 1).slice(-2)}` : `${MONTH_NAMES[Number(month)]} ${year}`;

  const topKpis = [
    {
      title: "REVENUE FROM OPERATIONS",
      value: revenueSummary.revenueFromOps.display,
      subtitle: `${revenueBreakdown.length} GL accounts`,
      gradient: "linear-gradient(135deg, #667eea, #764ba2)",
      kpiId: 101,
      kpiValue: revenueSummary.revenueFromOps.crores
    },
    {
      title: "OTHER INCOME",
      value: revenueSummary.otherIncome.display,
      subtitle: `${otherIncomeBreakdown.length} GL accounts`,
      gradient: "linear-gradient(135deg, #f093fb, #f5576c)",
      kpiId: 102,
      kpiValue: revenueSummary.otherIncome.crores
    },
    {
      title: "TOTAL REVENUE",
      value: revenueSummary.totalRevenue.display,
      subtitle: monthLabel,
      gradient: "linear-gradient(135deg, #4facfe, #00f2fe)",
      kpiId: 103,
      kpiValue: revenueSummary.totalRevenue.crores
    },
    {
      title: "EXPORT REVENUE",
      value: `${revenueSummary.exportPct}%`,
      subtitle: revenueSummary.exportRevenue.display,
      gradient: "linear-gradient(135deg, #43e97b, #38f9d7)",
      kpiId: 104,
      kpiValue: revenueSummary.exportPct
    }
  ];

  const expenseCards = expenseSummary ? [
    {
      title: "TOTAL EXPENSES",
      value: expenseSummary.totalExpenses.display,
      subtitle: monthLabel,
      gradient: "linear-gradient(135deg, #ff5858, #f09819)",
      kpiId: 201,
      kpiValue: expenseSummary.totalExpenses.crores
    },
    {
      title: "COST OF MATERIALS",
      value: (expenseSummary.comc || expenseSummary.cogs).display,
      subtitle: `of ${revenueSummary.revenueFromOps.display} revenue`,
      gradient: "linear-gradient(135deg, #e44d26, #f16529)",
      kpiId: 202,
      kpiValue: (expenseSummary.comc || expenseSummary.cogs).crores
    },
    {
      title: "GROSS PROFIT",
      value: expenseSummary.grossProfit.display,
      subtitle: `Margin: ${expenseSummary.grossProfitPct}%`,
      gradient: "linear-gradient(135deg, #11998e, #38ef7d)",
      kpiId: 203,
      kpiValue: expenseSummary.grossProfit.crores
    },
    {
      title: "NET INCOME",
      value: expenseSummary.netIncome.display,
      subtitle: `Margin: ${expenseSummary.netIncomePct}%`,
      gradient: "linear-gradient(135deg, #0575e6, #021b79)",
      kpiId: 204,
      kpiValue: expenseSummary.netIncome.crores
    }
  ] : [];

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

      {/* EXPENSE KPI CARDS — clickable */}
      {expenseCards.length > 0 && (
        <div className="row g-3 mb-4">
          {expenseCards.map((card, i) => (
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
      )}

      {/* TRIAL BALANCE SUMMARY — matches Excel <GL> sheet */}
      <div className="mb-4">
        <TrialBalanceSummary
          month={month}
          year={year}
          fyear={fyear}
          selectedPeriod={selectedPeriod}
        />
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
