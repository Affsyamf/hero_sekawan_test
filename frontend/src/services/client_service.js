import api from "./api";

export const searchClient = async (filter) => {
  const response = await api.get("/client/search", {
    params: filter,
  });
  return response;
};

// export const searchCkClient = async (filter) => {
//   const response = await api.get("/client/color-kitchen", {
//     params: filter,
//   });
//   return response;
// };

export const getClientById = async (id) => {
  const response = await api.get(`/client/${id}`);
  return response;
};

export const createClient = async (data) => {
  const response = await api.post("/client", data);
  return response;
};

export const updateClient = async (id, data) => {
  const response = await api.put(`/client/${id}`, data);
  return response;
};

export const deleteClient = async (id) => {
  const response = await api.delete(`/client/${id}`);
  return response;
};
