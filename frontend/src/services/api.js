// services/api.js
import { loadingManager } from "../contexts/loadingManager";
import { useAuthStore } from "../stores/useAuthStore";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  withCredentials: true, // Enable cookie sending
});

// ✅ Flag untuk prevent multiple refresh calls
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    loadingManager.setLoading(true);

    // Access token stored in Zustand, NOT refresh token
    const token = useAuthStore.getState().accessToken;

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => {
    loadingManager.setLoading(false);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    loadingManager.setLoading(false);
    return response;
  },

  async (error) => {
    loadingManager.setLoading(false);

    const originalRequest = error.config;

    // Jika bukan 401 → langsung reject
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest.url.includes("/auth/refresh-token")) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    // -------------------------------------
    // 🔥 HANDLE JIKA SEDANG REFRESH
    // -------------------------------------
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers["Authorization"] = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    // -------------------------------------
    // 🔥 REFRESH TOKEN UTAMA
    // -------------------------------------
    isRefreshing = true;

    try {
      const response = await api.post("/auth/refresh-token");

      const newToken = response.data.data.access_token;

      // Simpan access token baru
      // Store to Zustand
      useAuthStore.getState().setAccessToken(newToken);

      // Update header global
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      originalRequest.headers["Authorization"] = `Bearer ${newToken}`;

      // Jalankan queue request
      processQueue(null, newToken);

      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.clear();
      useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
