import api from "./api";

// export const searchPurchasing = async (filter) => {
//   const response = await api.get("/purchasing/search", {
//     params: filter,
//   });
//   return response;
// };

export const searchPurchasing = async (filter) => {
  const response = await api.post("/purchasing/search", filter);
  return response;
};


export const getPurchasingById = async (id) => {
  const response = await api.get(`/purchasing/${id}`);
  return response;
};

export const createPurchasing = async (data) => {
  const response = await api.post("/purchasing", data);
  return response;
};

export const updatePurchasing = async (id, data) => {
  const response = await api.put(`/purchasing/${id}`, data);
  return response;
};

export const deletePurchasing = async (id) => {
  const response = await api.delete(`/purchasing/${id}`);
  return response;
};
