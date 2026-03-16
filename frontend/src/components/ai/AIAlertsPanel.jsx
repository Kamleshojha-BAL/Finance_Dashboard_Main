import { useEffect, useState } from "react";
import axios from "axios";

const AIAlertsPanel = () => {

  const [alerts, setAlerts] = useState([]);

  useEffect(() => {

    axios.get(`http://${window.location.hostname}:8800/api/finance/ai-alerts`)
      .then(res => setAlerts(res.data))
      .catch(err => console.log(err));

  }, []);

  return (

    <div className="card shadow-sm mt-4">

      <div className="card-body">

        <h6 className="fw-bold text-danger">AI Financial Alerts</h6>

        <hr />

        {alerts.length === 0 ? (

          <div className="text-muted">No anomalies detected</div>

        ) : (

          alerts.map((alert, index) => (

            <div key={index} style={{ marginBottom: "6px" }}>
              {alert}
            </div>

          ))

        )}

      </div>

    </div>

  );

};

export default AIAlertsPanel;