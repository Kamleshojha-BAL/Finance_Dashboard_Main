import { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/layout/Header";
import SectionTiles from "../components/layout/SectionTiles";
import Footer from "../components/layout/Footer";

import ExecutiveOverview from "../sections/ExecutiveOverview";
import Profitability from "../sections/Profitability";
import Returns from "../sections/Returns";
import CashFlowLiquidity from "../sections/CashFlowLiquidity";
import AssetInvestment from "../sections/AssetInvestment";
import Valuation from "../sections/Valuation";

const API = `http://${window.location.hostname}:8800/api/finance`;

const getCurrentFY = () => {
  const now = new Date();
  return now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1;
};

/* Months within a fiscal year (Apr–Mar) */
const FY_MONTHS = [
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" }
];

const Dashboard = () => {

  const [activeSection, setActiveSection] = useState("overview");
  const [fiscalYears, setFiscalYears] = useState([]);
  const [selectedFY, setSelectedFY] = useState(getCurrentFY());
  const [selectedPeriod, setSelectedPeriod] = useState("full"); // "full" or "04","05",...,"03"

  // Derive month/year/fyear for API calls
  const isYearly = selectedPeriod === "full";

  let month = null, year = null, fyear = null;
  if (isYearly) {
    fyear = selectedFY;
  } else {
    const m = Number(selectedPeriod);
    // Apr-Dec belong to FY start year, Jan-Mar belong to FY+1
    year = m >= 4 ? String(selectedFY) : String(selectedFY + 1);
    month = selectedPeriod;
  }

  // Fetch available fiscal years on mount
  useEffect(() => {
    axios.get(`${API}/fiscal-years`)
      .then(res => {
        const data = res.data.data || [];
        setFiscalYears(data);
        if (data.length > 0 && !data.some(d => d.fyear === selectedFY)) {
          setSelectedFY(data[0].fyear);
        }
      })
      .catch(err => console.error("Failed to load fiscal years:", err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFYChange = (fy) => {
    setSelectedFY(Number(fy));
    setSelectedPeriod("full"); // Reset to Full Year when FY changes
  };

  const tiles = [
    { key: "overview", label: "Executive Overview", icon: "📊" },
    { key: "profitability", label: "Profitability", icon: "📈" },
    { key: "returns", label: "Returns", icon: "💹" },
    { key: "cashflow", label: "Cash Flow & Liquidity", icon: "💰" },
    { key: "asset", label: "Asset & Investment", icon: "🏗️" },
    { key: "valuation", label: "Valuation", icon: "💎" }
  ];

  return (
    <div className="container mt-4">

      <Header />

      <div className="d-flex justify-content-end align-items-center gap-2 mt-3">
        <select
          value={selectedFY}
          onChange={(e) => handleFYChange(e.target.value)}
          className="form-select"
          style={{ width: "160px" }}
        >
          {fiscalYears.map(fy => (
            <option key={fy.fyear} value={fy.fyear}>{fy.label}</option>
          ))}
        </select>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="form-select"
          style={{ width: "180px" }}
        >
          <option value="full">Full Year</option>
          {FY_MONTHS.map(m => (
            <option key={m.value} value={m.value}>
              {m.label} {Number(m.value) >= 4 ? selectedFY : selectedFY + 1}
            </option>
          ))}
        </select>
      </div>

      <SectionTiles
        tiles={tiles}
        active={activeSection}
        setActive={setActiveSection}
      />

      <div className="mt-4">

        {activeSection === "overview" && (
          <ExecutiveOverview month={month} year={year} fyear={fyear} selectedPeriod={selectedPeriod} />
        )}

        {activeSection === "profitability" && (
          <Profitability month={month} year={year} fyear={fyear} />
        )}

        {activeSection === "returns" && (
          <Returns month={month} year={year} fyear={fyear} />
        )}

        {activeSection === "cashflow" && (
          <CashFlowLiquidity month={month} year={year} fyear={fyear} />
        )}

        {activeSection === "asset" && (
          <AssetInvestment month={month} year={year} fyear={fyear} />
        )}

        {activeSection === "valuation" && (
          <Valuation month={month} year={year} fyear={fyear} />
        )}

      </div>
      <Footer page={activeSection} />
    </div>
  );
};

export default Dashboard;
