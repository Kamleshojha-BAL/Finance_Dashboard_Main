const Tabs = ({ activeTab, setActiveTab }) => {
  const tabs = ["Overview", "Cost", "Working Capital", "Profitability"];

  return (
    <ul className="nav nav-pills mb-4">
      {tabs.map(tab => (
        <li className="nav-item me-2" key={tab}>
          <button
            className={`nav-link ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        </li>
      ))}
    </ul>
  );
};

export default Tabs;
