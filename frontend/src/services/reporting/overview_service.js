import api from "../api";

export const getDashboardData = async (filters = {}) => {
  const payload = filters;
  const response = await api.post("/reports/overview/summary", payload);
  return response.data;
};
