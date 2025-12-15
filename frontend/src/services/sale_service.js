import api from "./api";

export const searchSales = async (filter) => {
  const response = await api.post("/sales/search", {
    params: filter,
  });
  return response;
};

export const getSalesById = async (id) => {
  const response = await api.get(`/sales/${id}`);
  return response;
};

export const createSales = async (data) => {
  const response = await api.post("/sales", data);
  return response;
};

export const updateSales = async (id, data) => {
  const response = await api.put(`/sales/${id}`, data);
  return response;
};

export const deleteSales = async (id) => {
  const response = await api.delete(`/sales/${id}`);
  return response;
};
