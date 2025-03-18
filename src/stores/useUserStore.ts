import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface UserState {
  user: IUser | null; // Sử dụng IUser làm kiểu cho user
  accessToken: string | null;
  setUser: (user: IUser, accessToken: string) => void;
  clearUser: () => void;
}
const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setUser: (user, accessToken) => set({ user, accessToken }),
      clearUser: () => set({ user: null, accessToken: null }),
    }),
    {
      name: "user-session", // Tên key lưu trong sessionStorage
      storage: createJSONStorage(() => sessionStorage), // Lưu vào sessionStorage
    },
  ),
);

export default useUserStore;
