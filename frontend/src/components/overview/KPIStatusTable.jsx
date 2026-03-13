const KPIStatusTable = ({ kpis, onKPIClick }) => {
  if (!kpis || kpis.length === 0) return null;

  const activeCount = kpis.filter(k => k.status === 'active').length;
  const pendingCount = kpis.filter(k => k.status === 'pending').length;

  const categories = [...new Set(kpis.map(k => k.category))];

  const formatValue = (kpi) => {
    if (kpi.value === null) return <span className="text-muted">--</span>;
    const v = Number(kpi.value);
    if (kpi.unit === '%') return `${v.toFixed(2)}%`;
    if (kpi.unit === 'Times') return `${v.toFixed(2)}x`;
    if (kpi.unit === 'Rs') return `Rs ${v.toFixed(2)}`;
    if (kpi.unit === 'Rs Cr') return `Rs ${v.toFixed(2)} Cr`;
    return `${v.toFixed(2)} ${kpi.unit}`;
  };

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="fw-bold mb-0">16 KPI Dashboard</h6>
          <div>
            <span className="badge bg-success me-1">{activeCount} Active</span>
            <span className="badge bg-warning text-dark">{pendingCount} Awaiting Data</span>
          </div>
        </div>

        {onKPIClick && (
          <div className="text-muted mb-2" style={{ fontSize: "11px" }}>
            Click on any KPI row to view details, formula & GL accounts
          </div>
        )}

        <table className="table table-sm table-hover mb-0" style={{ fontSize: "13px" }}>
          <thead className="table-light">
            <tr>
              <th style={{ width: "30px" }}>#</th>
              <th>KPI Name</th>
              <th>Category</th>
              <th className="text-center">Value</th>
              <th>Target</th>
              <th className="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              kpis
                .filter(k => k.category === cat)
                .map(kpi => (
                  <tr
                    key={kpi.id}
                    style={{
                      opacity: kpi.status === 'pending' ? 0.6 : 1,
                      cursor: onKPIClick ? 'pointer' : 'default'
                    }}
                    onClick={() => onKPIClick && onKPIClick(kpi)}
                  >
                    <td className="text-muted">{kpi.id}</td>
                    <td className="fw-bold">
                      {kpi.name}
                      {onKPIClick && <span className="ms-1" style={{ fontSize: "10px", color: "#0d6efd" }}>&#x1F50D;</span>}
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          fontSize: "10px",
                          background: getCategoryColor(kpi.category)
                        }}
                      >
                        {kpi.category}
                      </span>
                    </td>
                    <td className="text-center fw-bold">
                      {formatValue(kpi)}
                    </td>
                    <td style={{ fontSize: "12px" }}>{kpi.target}</td>
                    <td className="text-center">
                      {kpi.status === 'active'
                        ? <span className="badge bg-success">Active</span>
                        : <span className="badge bg-warning text-dark">Awaiting Data</span>
                      }
                    </td>
                  </tr>
                ))
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function getCategoryColor(cat) {
  const colors = {
    'Profitability': '#6f42c1',
    'Cost Efficiency': '#e85d04',
    'Returns': '#0d6efd',
    'Working Capital': '#198754',
    'Asset Management': '#6c757d',
    'Investment': '#20c997',
    'Valuation': '#d63384',
    'Cash Flow': '#0dcaf0',
    'Liquidity': '#ffc107'
  };
  return colors[cat] || '#6c757d';
}

export default KPIStatusTable;
