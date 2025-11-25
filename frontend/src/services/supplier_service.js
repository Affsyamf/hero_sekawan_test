import api from "./api";

export const searchSupplier = async (filter) => {
  const response = await api.get("/supplier/search", {
    params: filter,
  });
  return response;
};

export const searchSupplierCk = async (filter) => {
  const response = await api.get("/supplier/color-kitchen", {
    params: filter,
  });
  return response;
};

export const getSupplierById = async (id) => {
  const response = await api.get(`/supplier/${id}`);
  return response;
};

export const createSupplier = async (data) => {
  const response = await api.post("/supplier", data);
  return response;
};

export const updateSupplier = async (id, data) => {
  const response = await api.put(`/supplier/${id}`, data);
  return response;
};

export const deleteSupplier = async (id) => {
  const response = await api.delete(`/supplier/${id}`);
  return response;
};
