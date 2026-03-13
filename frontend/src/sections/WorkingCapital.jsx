const WorkingCapital = () => {

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

const KPIBox = ({ title }) => {
return (
<div
className="p-4 text-white rounded"
style={{
background: "linear-gradient(135deg,#5b6cff,#7a54ff)"
}}
> <small>{title}</small> <h3 className="mt-2">No Data</h3> </div>
);
};

return ( <div>


  <h4 className="mb-4">💼 Working Capital Management</h4>

  {/* KPI CARDS */}
  <div className="row g-4 mb-4">

    <div className="col-md-3">
      <KPIBox title="WORKING CAPITAL DAYS" />
    </div>

    <div className="col-md-3">
      <KPIBox title="INVENTORY DAYS" />
    </div>

    <div className="col-md-3">
      <KPIBox title="DEBTORS DAYS" />
    </div>

    <div className="col-md-3">
      <KPIBox title="CREDITORS DAYS" />
    </div>

  </div>

  {/* CHARTS */}
  <div className="row g-4">

    <div className="col-md-6">
      <NoDataCard
        title="Working Capital Trend"
        badge="AI TRACKED"
      />
    </div>

    <div className="col-md-6">
      <NoDataCard
        title="Cash Conversion Cycle"
        badge="OPTIMIZED"
      />
    </div>

    <div className="col-md-6">
      <NoDataCard
        title="Inventory Turnover Analysis"
        badge="ML ANALYZED"
      />
    </div>

    <div className="col-md-6">
      <NoDataCard
        title="Debtors Aging Analysis"
        badge="RISK AI"
      />
    </div>

  </div>

  {/* TABLE */}
  <div className="mt-4">

    <div className="card shadow-sm">

      <div className="card-body">

        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="fw-bold">
            Top 20 Debtors - AI Credit Risk Assessment
          </h6>
          <span className="badge bg-primary">CREDIT AI</span>
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

export default WorkingCapital;
