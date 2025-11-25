import { create } from "zustand";
import { persist } from "zustand/middleware";
import { refreshAccessToken } from "../services/auth_service";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      permissions: [],

      initialized: false,

      // -----------------------------
      // SETTERS
      // -----------------------------
      login: ({ accessToken, user, permissions }) =>
        set({ accessToken, user, permissions }),

      setAccessToken: (token) => set({ accessToken: token }),

      setUser: (user) => set({ user }),

      setPermissions: (permissions) => set({ permissions }),

      logout: () =>
        set({
          accessToken: null,
          user: null,
          permissions: [],
        }),

      setInitialized: (v) => set({ initialized: v }),

      // -----------------------------
      // INIT AUTH ON PAGE LOAD
      // -----------------------------
      initAuth: async () => {
        try {
          const { access_token, user, permissions } =
            await refreshAccessToken();

          // update Zustand
          const auth = get();
          auth.setAccessToken(access_token);
          auth.setUser(user);
          auth.setPermissions(permissions || []);

          console.log("🔄 Session restored from refresh token");
        } catch (err) {
          console.log("❌ No valid refresh token");
        } finally {
          // ALWAYS set initialized = true
          set({ initialized: true });
        }
      },
    }),
    {
      name: "auth-storage",

      // disable writing to localStorage COMPLETELY
      storage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      },
    }
  )
);
