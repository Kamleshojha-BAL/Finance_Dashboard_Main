import React, { useEffect, useState } from "react";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:8800/api/finance";

// Row styling config
const ROW_CONFIG = {
  // Balance Sheet items
  "Equity":                  { icon: "🏦", section: "bs", indent: 0 },
  "Other Equity":            { icon: "🏦", section: "bs", indent: 0 },
  "Profit":                  { icon: "📊", section: "calc", indent: 0, bold: true, highlight: true },
  "Non Current Liability":   { icon: "📋", section: "bs", indent: 0 },
  "Current Liab":            { icon: "📋", section: "bs", indent: 0 },
  "Non Current Assets":      { icon: "🏭", section: "bs", indent: 0 },
  "Current Assets":          { icon: "💼", section: "bs", indent: 0 },
  // P&L items
  "Rev. from Operation":     { icon: "💰", section: "revenue", indent: 0 },
  "Other Income":            { icon: "💰", section: "revenue", indent: 0 },
  "Cost of Material Consumed": { icon: "📦", section: "expense", indent: 0 },
  "Changes in Inv":          { icon: "📦", section: "expense", indent: 0 },
  "Power":                   { icon: "⚡", section: "expense", indent: 0 },
  "Employee Cost":           { icon: "👥", section: "expense", indent: 0 },
  "Finance Cost":            { icon: "🏦", section: "expense", indent: 0 },
  "Depreciation":            { icon: "📉", section: "expense", indent: 0 },
  "Other Exp":               { icon: "📝", section: "expense", indent: 0 },
  "Exceptional Items":       { icon: "⚠️", section: "expense", indent: 0 },
  "Current Tax":             { icon: "🏛️", section: "expense", indent: 0 },
  "Deferred Tax":            { icon: "🏛️", section: "expense", indent: 0 },
  "OCI-Net-manual":          { icon: "📄", section: "other", indent: 0 },
  "Total":                   { icon: "✅", section: "calc", indent: 0, bold: true, highlight: true },
};

const SECTION_HEADERS = {
  bs: { label: "Balance Sheet", color: "#6f42c1" },
  revenue: { label: "Revenue", color: "#198754" },
  expense: { label: "Expenses", color: "#dc3545" },
  other: { label: "Other", color: "#6c757d" },
};

const formatAmount = (amount) => {
  const crores = amount / 10000000;
  const absVal = Math.abs(crores);
  if (absVal === 0) return "--";
  const sign = crores < 0 ? "-" : "";
  return `${sign}${absVal.toFixed(2)} Cr`;
};

const getAmountColor = (particular, amount) => {
  const config = ROW_CONFIG[particular];
  if (!config) return "#212529";
  if (config.section === "revenue") return amount >= 0 ? "#198754" : "#dc3545";
  if (config.section === "expense") return amount > 0 ? "#dc3545" : "#198754";
  if (particular === "Profit") return amount >= 0 ? "#198754" : "#dc3545";
  return "#212529";
};

const TrialBalanceSummary = ({ month, year, fyear, selectedPeriod }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedPeriod && selectedPeriod !== "full") {
      params.set("month", selectedPeriod);
      params.set("year", year || "");
    } else if (fyear) {
      params.set("fyear", fyear);
    }

    setLoading(true);
    axios
      .get(`${API}/trial-balance?${params}`)
      .then((res) => {
        setData(res.data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load trial balance:", err);
        setLoading(false);
      });
  }, [month, year, fyear, selectedPeriod]);

  if (loading) {
    return (
      <div className="card shadow-sm">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2 text-muted">Loading Trial Balance...</p>
        </div>
      </div>
    );
  }

  // Group items by section for visual separation
  let lastSection = null;

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
        <div>
          <h6 className="mb-0 fw-bold">Trial Balance Summary</h6>
          <small className="text-muted">As per GL accounts from SAP</small>
        </div>
        <span className="badge bg-primary">{data.filter(d => d.hasData).length} Active Items</span>
      </div>
      <div className="card-body p-0">
        <table className="table table-hover mb-0" style={{ fontSize: "14px" }}>
          <thead className="table-light">
            <tr>
              <th style={{ width: "45%", paddingLeft: "16px" }}>Particulars</th>
              <th className="text-end" style={{ width: "25%" }}>Amount (Rs. Cr)</th>
              <th className="text-center" style={{ width: "15%" }}>Type</th>
              <th className="text-center" style={{ width: "15%" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => {
              const config = ROW_CONFIG[item.particular] || {};
              const currentSection = config.section;
              let showSectionHeader = false;

              // Show section divider when section changes (but not for calc items)
              if (currentSection && currentSection !== "calc" && currentSection !== lastSection) {
                showSectionHeader = true;
                lastSection = currentSection;
              }

              return (
                <React.Fragment key={i}>
                  {showSectionHeader && SECTION_HEADERS[currentSection] && (
                    <tr style={{ backgroundColor: "#f8f9fa" }}>
                      <td colSpan={4} style={{
                        fontSize: "11px",
                        fontWeight: "bold",
                        color: SECTION_HEADERS[currentSection].color,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        padding: "6px 16px",
                        borderBottom: `2px solid ${SECTION_HEADERS[currentSection].color}20`
                      }}>
                        {SECTION_HEADERS[currentSection].label}
                      </td>
                    </tr>
                  )}
                  <tr style={{
                    fontWeight: config.bold ? "bold" : "normal",
                    backgroundColor: config.highlight ? "#e8f4fd" : "transparent",
                    borderTop: config.highlight ? "2px solid #0d6efd" : undefined,
                    borderBottom: config.highlight ? "2px solid #0d6efd" : undefined,
                  }}>
                    <td style={{ paddingLeft: `${16 + (config.indent || 0) * 20}px` }}>
                      <span style={{ marginRight: "8px" }}>{config.icon || "📄"}</span>
                      {item.particular}
                    </td>
                    <td className="text-end" style={{
                      fontWeight: "600",
                      color: getAmountColor(item.particular, item.amount),
                      fontFamily: "monospace",
                      fontSize: config.bold ? "15px" : "14px"
                    }}>
                      {formatAmount(item.amount)}
                    </td>
                    <td className="text-center">
                      <span className={`badge ${
                        item.type === "Balance Sheet" ? "bg-purple" :
                        item.type === "P&L" ? "bg-info" :
                        "bg-secondary"
                      }`} style={{
                        fontSize: "10px",
                        backgroundColor: item.type === "Balance Sheet" ? "#6f42c1" :
                          item.type === "P&L" ? "#0dcaf0" : undefined
                      }}>
                        {item.type}
                      </span>
                    </td>
                    <td className="text-center">
                      {item.hasData ? (
                        <span className="badge bg-success" style={{ fontSize: "10px" }}>Active</span>
                      ) : (
                        <span className="badge bg-warning text-dark" style={{ fontSize: "10px" }}>No Data</span>
                      )}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrialBalanceSummary;
