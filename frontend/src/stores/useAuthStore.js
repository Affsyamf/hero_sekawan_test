import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      permissions: [],

      // ---- Login helper ----
      login: ({ accessToken, user, permissions }) =>
        set({
          accessToken,
          user,
          permissions,
        }),

      // ---- Update access token only ----
      setAccessToken: (token) =>
        set({
          accessToken: token,
        }),

      // ---- Update user only ----
      setUser: (user) =>
        set({
          user,
        }),

      // ---- Update permissions only ----
      setPermissions: (permissions) =>
        set({
          permissions,
        }),

      // ---- Logout ----
      logout: () =>
        set({
          accessToken: null,
          user: null,
          permissions: [],
        }),
    }),
    {
      name: "auth-storage", // localStorage key
    }
  )
);
