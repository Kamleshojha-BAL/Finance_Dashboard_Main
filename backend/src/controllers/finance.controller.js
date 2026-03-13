import * as sapService from "../services/sap.service.js";
import { generateAIInsights, detectFinanceAlerts } from "../services/ai.service.js";

export const refreshDashboard = async (req, res) => {
  try {
    const { month, year, empId } = req.body;
    if (!month || !year) {
      return res.status(400).json({ error: "month and year are required" });
    }
    const result = await sapService.refreshKPI(month, year, empId);
    const kpis = await sapService.getKPIData(month, year);
    res.json({ status: "success", data: { ...result, kpis } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getFinanceDashboard = async (req, res) => {
  try {
    const { month, year } = req.query;
    const data = await sapService.getDashboardData(month, year);
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
    const data = await sapService.getCostStructure();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRevenueMix = async (req, res) => {
  try {
    const { month, year } = req.query;
    const data = await sapService.getRevenueMix(month, year);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDailyTrend = async (req, res) => {
  try {
    const data = await sapService.getDailyRevenueTrend();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getKPIFormulaValues = async (req, res) => {
  try {
    const { month, year } = req.query;
    const data = await sapService.getKPIFormulaValues(month, year);
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
