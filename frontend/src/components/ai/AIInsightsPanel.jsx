import { useEffect, useState } from "react";
import axios from "axios";

const AIInsightsPanel = () => {

  const [insights, setInsights] = useState("");

  useEffect(() => {

    axios.get("http://localhost:5000/api/finance/ai-insights")
      .then(res => setInsights(res.data))
      .catch(err => console.log(err));

  }, []);

  return (

    <div className="card shadow-sm mt-4">

      <div className="card-body">

        <h6 className="fw-bold">AI Strategic Insights</h6>

        <hr />

        <div style={{ whiteSpace: "pre-line" }}>

          {insights || "Generating AI insights..."}

        </div>

      </div>

    </div>

  );

};

export default AIInsightsPanel;