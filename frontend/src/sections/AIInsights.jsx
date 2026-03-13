const AIInsights = () => {

const NoDataCard = ({ title, badge }) => {
return ( <div className="card shadow-sm h-100">


    <div className="card-body">

      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="fw-bold">{title}</h6>
        {badge && <span className="badge bg-primary">{badge}</span>}
      </div>

      <hr />

      <div
        style={{
          height: "220px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#777"
        }}
      >
        No Data Available
      </div>

    </div>

  </div>
);


};

return ( <div>


  <h4 className="mb-4">💡 AI-Powered Strategic Insights</h4>

  {/* TOP RECOMMENDATION */}
  <div
    className="p-4 rounded mb-4 text-white"
    style={{
      background: "linear-gradient(135deg,#d946ef,#ef4444)"
    }}
  >
    <h6 className="fw-bold">Top Priority Recommendation</h6>
    <p className="mb-0">
      No AI recommendation available.
    </p>
  </div>

  {/* OPPORTUNITY + ALERTS */}
  <div className="row g-4 mb-4">

    <div className="col-md-6">
      <NoDataCard
        title="AI Opportunity Scoring Matrix"
        badge="ML SCORED"
      />
    </div>

    <div className="col-md-6">
      <NoDataCard
        title="AI Detected Anomalies & Alerts"
        badge="ANOMALY AI"
      />
    </div>

  </div>

  {/* WHAT IF SCENARIOS */}
  <div className="card shadow-sm mb-4">

    <div className="card-body">

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold">Predictive What-If Scenarios</h6>
        <span className="badge bg-primary">SCENARIO AI</span>
      </div>

      <div className="text-center p-4 text-muted">
        No Data Available
      </div>

    </div>

  </div>

  {/* SCORE + HEALTH */}
  <div className="row g-4 mb-4">

    <div className="col-md-6">
      <NoDataCard
        title="AI Performance Score Trend"
        badge="ML TRACKED"
      />
    </div>

    <div className="col-md-6">
      <NoDataCard
        title="Financial Health Dashboard"
        badge="AI SCORED"
      />
    </div>

  </div>

  {/* ACTION PLAN */}
  <div className="card shadow-sm">

    <div className="card-body">

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold">Next 30 Days - AI Action Plan</h6>
        <span className="badge bg-primary">ACTION AI</span>
      </div>

      <div className="text-center p-4 text-muted">
        No Data Available
      </div>

    </div>

  </div>

</div>


);
};

export default AIInsights;
