const CostIntelligence = () => {

const NoDataCard = ({ title, badge }) => {
return ( <div className="card shadow-sm h-100"> <div className="card-body">

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

const KPIBox = ({ title }) => {
return (
<div
className="p-4 text-white rounded"
style={{
background:
"linear-gradient(135deg,#5b6cff,#7a54ff)"
}}
> <small>{title}</small> <h3 className="mt-2">No Data</h3> </div>
);
};

return ( <div>

  <h4 className="mb-4">💰 AI-Driven Cost Intelligence</h4>

  {/* KPI CARDS */}
  <div className="row g-4 mb-4">

    <div className="col-md-3">
      <KPIBox title="RAW MATERIAL COST" />
    </div>

    <div className="col-md-3">
      <KPIBox title="POWER & FUEL COST" />
    </div>

    <div className="col-md-3">
      <KPIBox title="MANUFACTURING OVERHEAD" />
    </div>

    <div className="col-md-3">
      <KPIBox title="EMPLOYEE COST" />
    </div>

  </div>

  {/* CHARTS */}
  <div className="row g-4">

    <div className="col-md-6">
      <NoDataCard
        title="Cost Breakdown by Category"
        badge="AI ANALYZED"
      />
    </div>

    <div className="col-md-6">
      <NoDataCard
        title="Cost Per Ton - Product Wise"
        badge="LIVE"
      />
    </div>

    <div className="col-md-6">
      <NoDataCard
        title="Power Cost Trend & Optimization"
        badge="ML OPTIMIZED"
      />
    </div>

    <div className="col-md-6">
      <NoDataCard
        title="Raw Material Cost Intelligence"
        badge="PREDICTIVE"
      />
    </div>

  </div>

  {/* TABLE */}
  <div className="mt-4">

    <div className="card shadow-sm">

      <div className="card-body">

        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="fw-bold">
            AI-Identified Cost Optimization Opportunities
          </h6>
          <span className="badge bg-primary">ML INSIGHTS</span>
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

export default CostIntelligence;
