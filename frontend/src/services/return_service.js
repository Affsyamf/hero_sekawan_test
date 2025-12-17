import api from "./api";

// export const searchReturn = async (filter) => {
//   const response = await api.post("/returns/search", {
//     params: filter,
//   });
//   return response;
// };

export const searchReturn = async (filter) => {
  const response = await api.post("/returns/search", filter);
  return response;
};

export const getReturnById = async (id) => {
  const response = await api.get(`/returns/${id}`);
  return response;
};

export const createReturn = async (data) => {
  const response = await api.post("/returns", data);
  return response;
};

export const updateReturn = async (id, data) => {
  const response = await api.put(`/returns/${id}`, data);
  return response;
};

export const deleteReturn = async (id) => {
  const response = await api.delete(`/returns/${id}`);
  return response;
};
