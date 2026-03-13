const GlobalBenchmarks = () => {

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


  <h4 className="mb-4">🌐 Global Benchmark Comparison</h4>

  {/* INDUSTRY POSITION TABLE */}
  <div className="card shadow-sm mb-4">

    <div className="card-body">

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold">
          Industry Position - Key Metrics vs Global Leaders
        </h6>
        <span className="badge bg-primary">BENCHMARK</span>
      </div>

      <div className="text-center p-4 text-muted">
        No Data Available
      </div>

    </div>

  </div>

  {/* CHARTS */}
  <div className="row g-4 mb-4">

    <div className="col-md-3">
      <NoDataCard
        title="Profitability Benchmarking"
        badge="GLOBAL"
      />
    </div>

    <div className="col-md-3">
      <NoDataCard
        title="Efficiency Ratios Comparison"
        badge="COMPARISON"
      />
    </div>

    <div className="col-md-3">
      <NoDataCard
        title="Cost Competitiveness Index"
        badge="INDEXED"
      />
    </div>

    <div className="col-md-3">
      <NoDataCard
        title="Financial Health Score"
        badge="AI SCORED"
      />
    </div>

  </div>

  {/* INSIGHT BOX */}
  <div
    className="p-3 rounded mb-4"
    style={{
      background: "#dff5e6",
      borderLeft: "5px solid #22c55e"
    }}
  >
    <strong>Competitive Position:</strong> No benchmark insights available.
  </div>

  {/* PEER COMPARISON TABLE */}
  <div className="card shadow-sm">

    <div className="card-body">

      <h6 className="fw-bold mb-3">
        Peer Group Financial Comparison
      </h6>

      <div className="text-center p-4 text-muted">
        No Data Available
      </div>

    </div>

  </div>

</div>


);
};

export default GlobalBenchmarks;
