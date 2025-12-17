import api from "./api";



// ==================== Account Parent ===================

// export const searchAccountParent = async (filter) => {
//   const response = await api.get("/account_parent/search", {
//     params: filter,
//   });
//   return response;
// };

export const searchAccountParent = async (filter) => {
  const response = await api.get("/account_parent/search", {
    params: filter,
  });
  return response;
};


export const getAccountParentById = async (id) => {
  const response = await api.get(`/account_parent/${id}`);
  return response;
};

export const createAccountParent = async (data) => {
  const response = await api.post("/account_parent", data);
  return response;
};

export const updateAccountParent = async (id, data) => {
  const response = await api.put(`/account_parent/${id}`, data);
  return response;
};

export const deleteAccountParent = async (id) => {
  const response = await api.delete(`/account_parent/${id}`);
  return response;
};
