import api from "./api";

// export const searchColorKitchen = async (filter) => {
//   const response = await api.post("/color-kitchen-entry/search", {
//     params: filter,
//   });
//   return response;
// };

export const searchColorKitchen = async (filter) => {
  const response = await api.post("/color-kitchen-entry/search", filter);
  return response;
};

export const getColorKitchenById = async (id) => {
  const response = await api.get(`/color-kitchen-entry/${id}`);
  return response;
};

export const createColorKitchen = async (data) => {
  const response = await api.post("/color-kitchen-entry", data);
  return response;
};

export const updateColorKitchen = async (id, data) => {
  const response = await api.put(`/color-kitchen-entry/${id}`, data);
  return response;
};

export const deleteColorKitchen = async (id) => {
  const response = await api.delete(`/color-kitchen-entry/${id}`);
  return response;
};
