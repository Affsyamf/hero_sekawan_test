// services/auth_service.js
import { useAuthStore } from "../stores/useAuthStore";
import api from "./api";

export const login = async (payload) => {
  const res = await api.post("/auth/login", payload);
  const data = res.data;

  useAuthStore.getState().login({
    accessToken: data.access_token,
    user: data.user,
    permissions: data.user.permissions,
  });

  return res;
};

export const logout = async () => {
  const refreshToken = localStorage.getItem("refresh_token");

  try {
    // ✅ Kirim refresh token untuk revoke
    await api.post("/auth/logout", { refresh_token: refreshToken });
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // ✅ Clear localStorage
    localStorage.clear();
    window.location.href = "/";
  }
};

export const refreshAccessToken = async () => {
  const response = await api.post("/auth/refresh-token");
  const newToken = response.data.data.access_token;
  useAuthStore.getState().setAccessToken(newToken);
};

// export const login2 = async ( username, password ) => {
//     const { data, error } = await supabase.auth.signInWithPassword({ email: username, password });

//     if ( error ) throw new Error(error.message);

//     // console.log({ data })

//     const authData = {
//         access_token: data.session.access_token,
//         expires_at: data.session.expires_at,
//         refresh_token: data.session.refresh_token,
//         user: {
//             id: data.session.user.id,
//             email: data.session.user.email,
//             role: data.session.user.role,
//         }
//     };

//     // Simpan ke localStorage dan Context provider
//     localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
//     return authData;
// };

// export const logout = async () => {
//     const { error } = await supabase.auth.signOut()
//     if ( error ) throw error
//     localStorage.removeItem(AUTH_KEY);
// };

// export const getCurrentUser = () => {
//     const auth = localStorage.getItem(AUTH_KEY);
//     return auth ? JSON.parse(auth) : null;
// };

// export const refreshToken = async ( refresh_token ) => {
//     const { data, error } = await supabase.auth.refreshSession({ refresh_token });
//     if ( error ) throw new Error(error.message);
//     return data;
// }
