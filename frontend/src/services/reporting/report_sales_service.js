import api from "../api";

export const reportsSalesSummary = async (filters = {}) => {
  const payload = filters;
  const response = await api.post("/reports/sales/summary", payload);
  return response.data;
};

/**
 * Sales Trend — time-based trend (daily, weekly, monthly, yearly)
 */
export const reportsSalesTrend = async (filters = {}) => {
  const payload = filters;
  const response = await api.post("/reports/sales/trend", payload);
  return response.data;
};

/**
 * Sales Products — product-level insights
 */
export const reportsSalesClient = async (filters = {}) => {
  const payload = filters;
  const response = await api.post("/reports/sales/client-top", payload);
  return response.data;
};

/**
 * Sales Suppliers — supplier-level analytics
 */
export const reportsReceivableTrend = async (filters = {}) => {
  const payload = filters;
  const response = await api.post(
    "/reports/sales/payment-receivable-trend",
    payload
  );
  return response.data;
};
