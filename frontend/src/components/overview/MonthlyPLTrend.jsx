import Skeleton from "../common/Skeleton";

const MonthlyPLTrend = ({ loading }) => {
  return (
    <div className="chart-card">
      <h6>Monthly P&L Trend (₹ Crores)</h6>

      {loading ? (
        <Skeleton height={220} />
      ) : (
        <div>{/* chart later */}</div>
      )}
    </div>
  );
};

export default MonthlyPLTrend;
