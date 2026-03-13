import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#667eea", "#f5576c", "#4facfe", "#43e97b", "#f39c12", "#e74c3c"];

const RevenueMixChart = ({ data }) => {

  if (!data || data.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center h-100 text-muted">
        No Revenue Data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          outerRadius={75}
          innerRadius={35}
          paddingAngle={2}
          label={({ name, value }) => `${value} Cr`}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [`${value} Cr`, name]}
        />
        <Legend
          iconSize={10}
          wrapperStyle={{ fontSize: "11px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default RevenueMixChart;
