# Finance Dashboard — Balasore Alloys Limited

A comprehensive financial analytics dashboard built with React and Node.js, integrated with SAP General Ledger data via MySQL. Features 16 financial KPIs across 6 categories, interactive detail modals, AI-powered alerts, and rich chart visualizations.

![Stack](https://img.shields.io/badge/React-19-blue) ![Stack](https://img.shields.io/badge/Node.js-Express-green) ![Stack](https://img.shields.io/badge/MySQL-Database-orange) ![Stack](https://img.shields.io/badge/Bootstrap-5-purple)

---

## Features

- **16 KPI System** — Gross Profit Margin, Net Profit Margin, EBIT, EBITDA, ROA, ROE, ROI, EPS, Current Ratio, and more
- **Clickable KPI Detail Modals** — Full formula breakdown, component values, and mapped GL accounts
- **6 Dashboard Sections** — Executive Overview, Profitability, Returns, Cash Flow & Liquidity, Asset & Investment, Valuation
- **AI Alerts** — Automatic anomaly detection (flags KPI swings > 10% increase or > 5% decrease)
- **Chart Visualizations** — Revenue mix (pie), P&L trend (line), cost structure (bar) using Recharts & Chart.js
- **SAP GL Integration** — Direct mapping to SAP General Ledger accounts with fiscal year/period handling
- **Period Selection** — View historical data by month and year
- **Data Refresh** — Trigger stored procedure recalculation from the dashboard
- **Network Accessible** — Works across LAN (uses dynamic hostname instead of localhost)

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 19, Bootstrap 5, Recharts, Chart.js |
| Backend    | Node.js, Express 5                  |
| Database   | MySQL (mysql2)                      |
| HTTP       | Axios                               |

---

## Project Structure

```
Finance_Dashboard/
├── backend/
│   └── src/
│       ├── app.js                    # Express server (port 8800)
│       ├── config/db.js              # MySQL connection pool
│       ├── controllers/
│       │   └── finance.controller.js
│       ├── routes/
│       │   ├── finance.routes.js     # Finance API routes
│       │   └── hits.js               # Page hit counter
│       └── services/
│           ├── sap.service.js        # SAP/GL data queries
│           └── ai.service.js         # AI insights & alert detection
│
├── frontend/
│   └── src/
│       ├── App.js
│       ├── pages/
│       │   └── Dashboard.jsx         # Main dashboard layout
│       ├── sections/                 # 6 dashboard sections
│       │   ├── ExecutiveOverview.jsx
│       │   ├── Profitability.jsx
│       │   ├── Returns.jsx
│       │   ├── CashFlowLiquidity.jsx
│       │   ├── AssetInvestment.jsx
│       │   └── Valuation.jsx
│       ├── components/
│       │   ├── overview/             # KPI cards, grid, table, detail modal
│       │   ├── charts/               # PLTrend, RevenueMix, CostStructure
│       │   ├── ai/                   # AIInsightsPanel, AIAlertsPanel
│       │   ├── layout/               # Header, Footer, Tabs
│       │   └── common/               # Loader, Skeleton
│       └── services/
│           └── financeApi.js         # API client
```

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- MySQL database with SAP GL data loaded

### Installation

```bash
# Clone the repo
git clone https://github.com/Kamleshojha-BAL/Finance_Dashboard_Main.git
cd Finance_Dashboard_Main

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Configuration

Create `backend/.env`:

```env
PORT=8800
```

Update the database connection in `backend/src/config/db.js` with your MySQL credentials.

### Database Setup

The application requires these MySQL tables:

| Table | Purpose |
|-------|---------|
| `zfi_finance_accounts` | Raw SAP GL transaction data |
| `gl_account_master` | GL account metadata (series, category, PL/BS grouping) |
| `finance_period_summary` | Pre-aggregated period totals by GL account |
| `finance_kpi_results` | Calculated KPI values per period |

And these stored procedures:

| Procedure | Purpose |
|-----------|---------|
| `sp_build_finance_summary` | Aggregates raw GL data into `finance_period_summary` |
| `SP_CALCULATE_FINANCE_KPI` | Computes all 16 KPIs from summary data |

### Running

```bash
# Start backend (port 8800)
cd backend
npm start

# Start frontend (port 6001) — in a separate terminal
cd frontend
npm start
```

Open `http://localhost:6001` in your browser.

---

## API Endpoints

**Base URL:** `http://<hostname>:8800/api/finance`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard?month=&year=` | Dashboard data — KPIs, revenue summary, breakdowns |
| GET | `/pl-trend` | P&L trend across periods |
| GET | `/revenue-mix?month=&year=` | Revenue breakdown by GL account |
| GET | `/cost-structure?month=&year=` | Expense breakdown by category |
| GET | `/kpi-formula-values?month=&year=` | Detailed formula components for all KPIs |
| GET | `/ai-insights?month=&year=` | AI-generated strategic insights |
| GET | `/ai-alerts?month=&year=` | AI-detected anomalies and alerts |
| POST | `/refresh-dashboard` | Re-run stored procedures for a given period |

---

## KPI Reference

| # | KPI | Category | Formula |
|---|-----|----------|---------|
| 1 | Gross Profit Margin | Profitability | (Revenue - COGS) / Revenue x 100 |
| 2 | Net Profit Margin | Profitability | Net Income / Revenue x 100 |
| 3 | EBIT Margin | Profitability | EBIT / Revenue x 100 |
| 4 | Operating Ratio | Profitability | Operating Expenses / Revenue x 100 |
| 5 | EBITDA Margin | Profitability | (EBIT + Depreciation) / Revenue x 100 |
| 6 | Return on Assets | Returns | Net Income / Total Assets x 100 |
| 7 | Return on Equity | Returns | Net Income / Shareholders Equity x 100 |
| 8 | Return on Investment | Returns | Investment Income / Total Investments x 100 |
| 9 | Depreciation Ratio | Asset & Investment | Accum. Depreciation / Gross Fixed Assets x 100 |
| 10 | CapEx Ratio | Asset & Investment | Capital Expenditure / Revenue x 100 |
| 11 | Inventory Turnover | Asset & Investment | COGS / Average Inventory |
| 12 | Earnings Per Share | Valuation | Net Income / Outstanding Shares |
| 13 | Operating Cash Flow | Cash Flow | (Net Income + Depreciation) / 100M |
| 14 | Free Cash Flow | Cash Flow | (OCF - CapEx) / 100M |
| 15 | Cash Position | Liquidity | Cash & Bank Balance / 100M |
| 16 | Current Ratio | Liquidity | Current Assets / Current Liabilities |

---

## SAP Period Mapping

The application converts calendar months to SAP fiscal periods (April = Period 001):

| Calendar Month | SAP Period | Fiscal Year |
|---------------|------------|-------------|
| April (4)     | 001        | Same year   |
| May (5)       | 002        | Same year   |
| ...           | ...        | ...         |
| March (3)     | 012        | Previous year |

---

## License

Internal use — Balasore Alloys Limited.
