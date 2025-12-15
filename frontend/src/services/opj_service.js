import api from "./api";

export const searchOpj = async (filter) => {
  const response = await api.post("/opj/search", {
    params: filter,
  });
  return response;
};

export const getOpjById = async (id) => {
  const response = await api.get(`/opj/${id}`);
  return response;
};

export const createOpj = async (data) => {
  const response = await api.post("/opj", data);
  return response;
};

export const updateOpj = async (id, data) => {
  const response = await api.put(`/opj/${id}`, data);
  return response;
};

export const deleteOpj = async (id) => {
  const response = await api.delete(`/opj/${id}`);
  return response;
};
