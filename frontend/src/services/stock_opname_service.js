import api from "./api";

// export const searchStockOpname = async (filter) => {
//   const response = await api.post("/stock-opname/search", {
//     params: filter,
//   });
//   return response;
// };

export const searchStockOpname = async (filter) => {
  const response = await api.post("/stock-opname/search", filter);
  return response;
};

export const getStockOpnameById = async (id) => {
  const response = await api.get(`/stock-opname/${id}`);
  return response;
};

export const createStockOpname = async (data) => {
  const response = await api.post("/stock-opname", data);
  return response;
};

export const updateStockOpname = async (id, data) => {
  const response = await api.put(`/stock-opname/${id}`, data);
  return response;
};

export const deleteStockOpname = async (id) => {
  const response = await api.delete(`/product/${id}`);
  return response;
};
