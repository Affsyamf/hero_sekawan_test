// src/services/report_purchasing_service.js
import api from "../api";

/**
 * Utility: normalize filters to ensure correct defaults and structure
 */
// const =(filters = {}) => ({
//   start_date: filters.start_date || null,
//   end_date: filters.end_date || null,
//   account_type: filters.account_type || null,
//   granularity: filters.granularity || "monthly",
// });

/**
 * Purchasing Summary — top-level KPIs
 */
export const reportsPurchasingSummary = async (filters = {}) => {
  const payload = filters;
  const response = await api.post("reports/purchasing/summary", payload);
  return response.data;
};

/**
 * Purchasing Trend — time-based trend (daily, weekly, monthly, yearly)
 */
export const reportsPurchasingTrend = async (filters = {}) => {
  const payload = filters;
  const response = await api.post("reports/purchasing/trend", payload);
  return response.data;
};

/**
 * Purchasing Products — product-level insights
 */
export const reportsPurchasingProducts = async (filters = {}) => {
  const payload = filters;
  const response = await api.post("reports/purchasing/products", payload);
  return response.data;
};

/**
 * Purchasing Suppliers — supplier-level analytics
 */
export const reportsPurchasingSuppliers = async (filters = {}) => {
  const payload = filters;
  const response = await api.post("reports/purchasing/suppliers", payload);
  return response.data;
};

/**
 * Purchasing Breakdown Summary — goods vs services distribution
 */
export const reportsPurchasingBreakdownSummary = async (filters = {}) => {
  const payload = filters;
  const response = await api.post(
    "reports/purchasing/breakdown/summary",
    payload
  );
  return response.data;
};

/**
 * Purchasing Breakdown — goods vs services distribution
 */
export const reportsPurchasingBreakdown = async (
  level,
  parent_type,
  parent_account_id = 0,
  filters = {}
) => {
  const payload = filters;
  const response = await api.post(
    `reports/purchasing/breakdown?level=${level}&parent_type=${parent_type}&parent_account_id=${parent_account_id}`,
    payload
  );
  return response.data;
};
