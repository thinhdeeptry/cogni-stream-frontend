import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface UserState {
  user: IUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setUser: (user: IUser, accessToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearUser: () => void;
  clearTokens: () => void;
  hydrated: boolean;
  setHydrated: (state: boolean) => void;
}

// Check if we're in a browser environment
const isServer = typeof window === "undefined";

const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      hydrated: false,
      setUser: (user, accessToken) => set({ user, accessToken }),
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      clearUser: () =>
        set({ user: null, accessToken: null, refreshToken: null }),
      clearTokens: () => set({ accessToken: null, refreshToken: null }),
      setHydrated: (state) => set({ hydrated: state }),
    }),
    {
      name: "user-session",
      // Use localStorage instead of sessionStorage for persistence across refreshes
      storage: isServer
        ? createJSONStorage(() => ({
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          }))
        : createJSONStorage(() => localStorage),
      // Skip persistence on server
      skipHydration: true, // Always skip initial hydration
    },
  ),
);

export default useUserStore;
