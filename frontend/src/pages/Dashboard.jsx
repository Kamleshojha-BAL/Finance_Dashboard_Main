import { useState } from "react";
import Header from "../components/layout/Header";
import SectionTiles from "../components/layout/SectionTiles";
import Footer from "../components/layout/Footer";

import ExecutiveOverview from "../sections/ExecutiveOverview";
import Profitability from "../sections/Profitability";
import Returns from "../sections/Returns";
import CashFlowLiquidity from "../sections/CashFlowLiquidity";
import AssetInvestment from "../sections/AssetInvestment";
import Valuation from "../sections/Valuation";

const Dashboard = () => {

  const [activeSection, setActiveSection] = useState("overview");

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const [year, month] = selectedMonth.split("-");

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

      <div className="d-flex justify-content-end mt-3">
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="form-control"
          style={{ width: "200px" }}
        />
      </div>

      <SectionTiles
        tiles={tiles}
        active={activeSection}
        setActive={setActiveSection}
      />

      <div className="mt-4">

        {activeSection === "overview" && (
          <ExecutiveOverview month={month} year={year} />
        )}

        {activeSection === "profitability" && (
          <Profitability month={month} year={year} />
        )}

        {activeSection === "returns" && (
          <Returns month={month} year={year} />
        )}

        {activeSection === "cashflow" && (
          <CashFlowLiquidity month={month} year={year} />
        )}

        {activeSection === "asset" && (
          <AssetInvestment month={month} year={year} />
        )}

        {activeSection === "valuation" && (
          <Valuation month={month} year={year} />
        )}

      </div>
      <Footer page={activeSection} />
    </div>
  );
};

export default Dashboard;
