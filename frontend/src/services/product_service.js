import api from "./api";

// export const searchProduct = async (filter) => {
//   const response = await api.get("/product/search", {
//     params: filter,
//   });
//   return response;
// };
export const searchProduct = async (filter) => {
  const response = await api.post("/product/search", filter);
  return response;
};

export const searchCkProduct = async (filter) => {
  const response = await api.get("/product/color-kitchen", {
    params: filter,
  });
  return response;
};

export const getProductById = async (id) => {
  const response = await api.get(`/product/${id}`);
  return response;
};

export const createProduct = async (data) => {
  const response = await api.post("/product", data);
  return response;
};

export const updateProduct = async (id, data) => {
  const response = await api.put(`/product/${id}`, data);
  return response;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/product/${id}`);
  return response;
};
