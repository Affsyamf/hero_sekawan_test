import api from "./api";

export const searchDelivery = async (filter) => {
  const response = await api.post("/delivery/search", {
    params: filter,
  });
  return response;
};

export const getDeliveryById = async (id) => {
  const response = await api.get(`/delivery/${id}`);
  return response;
};

export const createDelivery = async (data) => {
  const response = await api.post("/delivery", data);
  return response;
};

export const updateDelivery = async (id, data) => {
  const response = await api.put(`/delivery/${id}`, data);
  return response;
};

export const deleteDelivery = async (id) => {
  const response = await api.delete(`/delivery/${id}`);
  return response;
};
