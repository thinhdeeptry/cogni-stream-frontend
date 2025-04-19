import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { authApi } from "@/lib/api/authApi";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";

import useUserStore from "@/stores/useUserStore";

/**
 * Hook cung cấp các hàm xử lý authentication
 */
export function useAuth() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { user, accessToken, refreshToken, clearUser, setTokens } =
    useUserStore();

  /**
   * Kiểm tra xem người dùng đã đăng nhập chưa
   */
  const isAuthenticated = !!session && !!accessToken;

  /**
   * Đăng xuất khỏi hệ thống
   */
  const logout = useCallback(async () => {
    try {
      clearUser();
      await signOut({ redirect: false });
      toast.success("Đăng xuất thành công");
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Có lỗi xảy ra khi đăng xuất");
    }
  }, [clearUser, router]);

  /**
   * Làm mới token khi hết hạn
   */
  const refreshAccessToken = useCallback(async () => {
    try {
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const result = await authApi.refresh();

      if (result.accessToken) {
        setTokens(result.accessToken, refreshToken);
        return result.accessToken;
      } else {
        throw new Error("Failed to refresh token");
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      // Nếu không thể refresh token, đăng xuất người dùng
      await logout();
      throw error;
    }
  }, [refreshToken, setTokens, logout]);

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isLoading: status === "loading",
    logout,
    refreshAccessToken,
  };
}

export default useAuth;
