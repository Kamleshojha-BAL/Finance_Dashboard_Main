
import Skeleton from "../common/Skeleton";

const KPIOverview = ({ data, loading }) => {
  const labels = [
    "TOTAL REVENUE (NOV)",
    "EBITDA",
    "NET PROFIT",
    "COST PER TON (FeSi)"
  ];

  return (
    <div className="row g-4">
      {[0, 1, 2, 3].map((i) => {
        const item = data?.[i];
        const showSkeleton = loading || !item;

        return (
          <div className="col-md-3" key={i}>
            <div className="kpi-card gradient-purple">
              
              {/* ✅ TITLE ALWAYS VISIBLE */}
              <small style={{ opacity: 0.9 }}>
                {labels[i]}
              </small>

              {showSkeleton ? (
                <div className="kpi-skeleton mt-2">
                  <Skeleton height={34} width="70%" />
                  <Skeleton height={14} width="60%" />
                </div>
              ) : (
                <>
                  <h3 className="mt-2">{item.value}</h3>
                  <span>{item.meta}</span>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KPIOverview;
