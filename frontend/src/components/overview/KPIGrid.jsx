const KPIGrid = ({ data }) => {

  const defaultKpis = [
    {
      title: "REVENUE FROM OPERATIONS",
      value: "Loading...",
      subtitle: "",
      gradient: "linear-gradient(135deg,#667eea,#764ba2)"
    },
    {
      title: "OTHER INCOME",
      value: "Loading...",
      subtitle: "",
      gradient: "linear-gradient(135deg,#f093fb,#f5576c)"
    },
    {
      title: "TOTAL REVENUE",
      value: "Loading...",
      subtitle: "",
      gradient: "linear-gradient(135deg,#4facfe,#00f2fe)"
    },
    {
      title: "EXPORT REVENUE",
      value: "Loading...",
      subtitle: "",
      gradient: "linear-gradient(135deg,#43e97b,#38f9d7)"
    }
  ];

  const kpis = data && data.length ? data : defaultKpis;

  return (
    <div className="row g-3">
      {kpis.map((kpi, index) => (
        <div key={index} className="col-md-3">
          <div
            className="p-4 rounded text-white shadow-sm"
            style={{
              background: kpi.gradient,
              minHeight: "110px"
            }}
          >
            <div
              style={{
                fontSize: "11px",
                opacity: "0.9",
                fontWeight: "600",
                letterSpacing: "0.5px"
              }}
            >
              {kpi.title}
            </div>
            <div
              style={{
                fontSize: "26px",
                fontWeight: "bold",
                marginTop: "5px"
              }}
            >
              {kpi.value}
            </div>
            {kpi.subtitle && (
              <div
                style={{
                  fontSize: "12px",
                  marginTop: "3px",
                  opacity: 0.85
                }}
              >
                {kpi.subtitle}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPIGrid;
