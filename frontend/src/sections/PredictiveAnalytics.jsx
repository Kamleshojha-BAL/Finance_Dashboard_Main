const PredictiveAnalytics = () => {

  const NoDataCard = ({ title, badge }) => {
    return (
      <div className="card shadow-sm h-100">

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

  return (
    <div>

      <h4 className="mb-4">🤖 AI-Powered Predictions & Forecasting</h4>

      <div className="row g-4">

        <div className="col-md-6">
          <NoDataCard
            title="Revenue Forecast - Next 6 Months"
            badge="ML MODEL"
          />
        </div>

        <div className="col-md-6">
          <NoDataCard
            title="Cash Flow Prediction"
            badge="AI FORECAST"
          />
        </div>

        <div className="col-md-6">
          <NoDataCard
            title="Cost Per Ton Prediction (FeSi 75%)"
            badge="PREDICTIVE"
          />
        </div>

        <div className="col-md-6">
          <NoDataCard
            title="Working Capital Days - Forecast"
            badge="ML TREND"
          />
        </div>

      </div>

      <div className="mt-4">

        <div className="card shadow-sm">

          <div className="card-body">

            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold">AI Risk Probability Matrix</h6>
              <span className="badge bg-danger">RISK AI</span>
            </div>

            <div className="text-center p-4 text-muted">
              No Data Available
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default PredictiveAnalytics;