import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const CostStructureChart = ({ data }) => {

  return (

    <ResponsiveContainer width="100%" height={220}>

      <BarChart data={data}>

        <XAxis dataKey="KPI_NAME" />

        <YAxis />

        <Tooltip />

        <Bar dataKey="KPI_VALUE" fill="#5b6cff" />

      </BarChart>

    </ResponsiveContainer>

  );

};

export default CostStructureChart;