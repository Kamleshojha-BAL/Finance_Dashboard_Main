const KPICard = ({ title, value, subtext }) => {
  return (
    <div className="col-md-3 mb-3">
      <div className="card shadow-sm border-0 h-100">
        <div className="card-body">
          <small className="text-muted">{title}</small>

          <h4 className="fw-bold mt-2">
            {value ?? ""}
          </h4>

          <small className="text-success">
            {subtext ?? ""}
          </small>
        </div>
      </div>
    </div>
  );
};

export default KPICard;
