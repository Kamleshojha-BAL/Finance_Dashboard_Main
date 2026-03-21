import * as sapService from "../services/sap.service.js";
import { generateAIInsights, detectFinanceAlerts } from "../services/ai.service.js";

export const refreshDashboard = async (req, res) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) {
      return res.status(400).json({ error: "month and year are required" });
    }
    const result = await sapService.refreshKPI(month, year);
    const kpis = await sapService.getKPIData(month, year);
    res.json({ status: "success", data: { ...result, kpis } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getFinanceDashboard = async (req, res) => {
  try {
    const { month, year, fyear } = req.query;
    const data = await sapService.getDashboardData(month, year, fyear);
    res.json({ status: "success", data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPLTrend = async (req, res) => {
  try {
    const data = await sapService.getPLTrend();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCostStructure = async (req, res) => {
  try {
    const { month, year, fyear } = req.query;
    const data = await sapService.getCostStructure(month, year, fyear);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRevenueMix = async (req, res) => {
  try {
    const { month, year, fyear } = req.query;
    const data = await sapService.getRevenueMix(month, year, fyear);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getKPIFormulaValues = async (req, res) => {
  try {
    const { month, year, fyear } = req.query;
    const data = await sapService.getKPIFormulaValues(month, year, fyear);
    res.json({ status: "success", data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAIInsights = async (req, res) => {
  try {
    const insights = await generateAIInsights();
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAIAlerts = async (req, res) => {
  try {
    const alerts = await detectFinanceAlerts();
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProfitabilityBreakdown = async (req, res) => {
  try {
    const { month, year, fyear } = req.query;
    const data = await sapService.getProfitabilityBreakdown(month, year, fyear);
    res.json({ status: "success", data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTrialBalanceSummary = async (req, res) => {
  try {
    const { month, year, fyear } = req.query;
    const data = await sapService.getTrialBalanceSummary(month, year, fyear);
    res.json({ status: "success", data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getFiscalYears = async (req, res) => {
  try {
    const data = await sapService.getAvailableFiscalYears();
    res.json({ status: "success", data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
