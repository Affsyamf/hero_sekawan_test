import api from "./api";

export const searchPayment = async (filter) => {
  const response = await api.get("/payment/search", {
    params: filter,
  });
  return response;
};

export const getPaymentById = async (id) => {
  const response = await api.get(`/payment/${id}`);
  return response;
};

export const createPayment = async (data) => {
  const response = await api.post("/payment", data);
  return response;
};

export const updatePayment = async (id, data) => {
  const response = await api.put(`/payment/${id}`, data);
  return response;
};

export const deletePayment = async (id) => {
  const response = await api.delete(`/payment/${id}`);
  return response;
};
