import { Line } from "react-chartjs-2";

const RevenueTrendChart = ({ trend }) => {
  if (!trend?.labels || !trend?.values) {
    return <div style={{ height: "300px" }}></div>; // blank chart area
  }

  const data = {
    labels: trend.labels,
    datasets: [
      {
        label: "Revenue",
        data: trend.values,
        borderColor: "#0d6efd"
      }
    ]
  };

  return <Line data={data} />;
};

export default RevenueTrendChart;

