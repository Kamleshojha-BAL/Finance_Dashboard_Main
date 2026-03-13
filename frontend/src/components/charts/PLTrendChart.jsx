import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const PLTrendChart = ({ data }) => {

  if (!data || data.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center h-100 text-muted">
        Only 1 month of data available (Feb 2026)
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <XAxis dataKey="label" style={{ fontSize: "11px" }} />
        <YAxis style={{ fontSize: "11px" }} />
        <Tooltip formatter={(value) => `${value} Cr`} />
        <Legend iconSize={10} wrapperStyle={{ fontSize: "11px" }} />
        <Bar dataKey="revenueFromOps" name="Revenue from Ops" fill="#667eea" radius={[4, 4, 0, 0]} />
        <Bar dataKey="otherIncome" name="Other Income" fill="#f5576c" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default PLTrendChart;
