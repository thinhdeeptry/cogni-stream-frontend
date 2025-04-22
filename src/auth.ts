// import { log } from "console";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { authApi } from "./lib/api/authApi";
import {
  AccountNotActivatedError,
  InvalidEmailPasswordError,
  ServerError,
} from "./utils/errors";

export const {
  handlers,
  signIn,
  signOut,
  auth,
}: {
  handlers: any;
  signIn: any;
  signOut: any;
  auth: any;
} = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    Credentials({
      credentials: {
        email: {},
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials): Promise<IUser | null> => {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        if (
          !credentials ||
          typeof credentials.email !== "string" ||
          typeof credentials.password !== "string"
        ) {
          throw new Error("Invalid credentials.");
        }
        // try {
        const { email, password } = credentials;
        const response = await authApi.login(email, password);
        console.log("Authorize response:", response);

        if (response.error) {
          if (response.statusCode === 400) {
            throw new AccountNotActivatedError(response._id);
          } else if (response.statusCode === 401) {
            // Sai email hoặc mật khẩu
            throw new InvalidEmailPasswordError();
          } else {
            throw new ServerError();
          }
        }

        // Kiểm tra các trường hợp khác nhau của response
        if (response.user) {
          // Tạo đối tượng user với các giá trị mặc định cho các trường có thể bị thiếu
          const user = {
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
            role: response.user.role || "USER",
            accountType: response.user.accountType || "LOCAL",
            isActive:
              response.user.isActive !== undefined
                ? response.user.isActive
                : true,
            phone: response.user.phone || "",
            address: response.user.address || "",
            image: response.user.image || "",
            createdAt: response.user.createdAt || new Date().toISOString(),
            // Lấy accessToken và refreshToken từ các vị trí khác nhau có thể có trong response
            accessToken: response.accessToken || response.access_token || "",
            refreshToken: response.refreshToken || response.refresh_token || "",
          };

          console.log("User object being returned to NextAuth:", user);
          return user;
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Check if access token exists and is expired
      if (token && token.accessToken && typeof token.accessToken === "string") {
        try {
          // Check if token is expired using the isTokenExpired function from authApi
          const isExpired = authApi.isTokenExpired(token.accessToken);

          if (isExpired && token.refreshToken) {
            console.log("Access token expired, attempting to refresh...");
            try {
              // Call refresh function to get a new access token
              const refreshResponse = await authApi.refresh();
              if (refreshResponse.accessToken) {
                console.log("Token refreshed successfully");
                // Update the token with new access token
                token.accessToken = refreshResponse.accessToken;
              } else {
                console.error(
                  "Failed to refresh token - no new token received",
                );
              }
            } catch (refreshError) {
              console.error("Error refreshing token:", refreshError);
              // If refresh fails, we keep the existing token and let the user re-authenticate
            }
          }
        } catch (error) {
          console.error("Error checking token expiration:", error);
        }
      }

      // Nếu đăng nhập bằng credentials
      if (user && user.accountType === "LOCAL") {
        // Cập nhật token với thông tin user theo interface IUser
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.accountType = user.accountType;
        token.isActive = user.isActive;
        token.phone = user.phone;
        token.address = user.address;
        token.image = user.image;
        // Lưu accessToken và refreshToken
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;

        console.log("JWT callback - Credentials login, updated token:", {
          id: token.id,
          email: token.email,
          accessToken: token.accessToken ? "[EXISTS]" : "[MISSING]",
          refreshToken: token.refreshToken ? "[EXISTS]" : "[MISSING]",
        });
      }
      // Nếu đăng nhập bằng Google
      else if (account && account.provider === "google" && user) {
        try {
          console.log("JWT callback - Google login, calling backend API");

          // Gọi API backend để xử lý đăng nhập Google và lấy token
          const googleAuthResponse = await authApi.loginWithGoogle({
            provider: account.provider,
            providerId: account.providerAccountId,
            email: token.email || "",
            name: token.name || "",
            image: token.picture || "",
          });

          console.log("Google auth response:", googleAuthResponse);

          if (googleAuthResponse.error) {
            console.error(
              "Error during Google login:",
              googleAuthResponse.message,
            );
            return token;
          }

          // Cập nhật token với thông tin user từ backend
          token.id = googleAuthResponse.user.id;
          token.email = googleAuthResponse.user.email;
          token.name = googleAuthResponse.user.name;
          token.role = googleAuthResponse.user.role || "USER";
          token.accountType = "GOOGLE";
          token.isActive = googleAuthResponse.user.isActive || true;
          token.image = googleAuthResponse.user.image || user.image;

          // Lưu accessToken và refreshToken từ backend
          token.accessToken =
            googleAuthResponse.accessToken || googleAuthResponse.access_token;
          token.refreshToken =
            googleAuthResponse.refreshToken || googleAuthResponse.refresh_token;

          console.log("JWT callback - Google login, updated token:", {
            id: token.id,
            email: token.email,
            accessToken: token.accessToken ? "[EXISTS]" : "[MISSING]",
            refreshToken: token.refreshToken ? "[EXISTS]" : "[MISSING]",
          });
        } catch (error) {
          console.error("Error processing Google login:", error);
        }
      } else {
        console.log("JWT callback - No user or unknown provider");
      }

      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      // Cập nhật session.user theo interface IUser
      session.user = {
        id: token.id,
        email: token.email,
        name: token.name,
        role: token.role,
        accountType: token.accountType,
        isActive: token.isActive,
        phone: token.phone,
        address: token.address,
        image: token.image,
      };

      // Lưu accessToken và refreshToken ở cấp session
      session.refreshToken = token.refreshToken;
      session.accessToken = token.accessToken;
      return session;
    },
    authorized: async ({ auth }) => {
      // Logged in users are authenticated, otherwise redirect to login page
      return !!auth;
    },
  },
  jwt: {
    // Tăng thời gian chấp nhận sai lệch đồng hồ (nếu cần)
    maxAge: 30 * 24 * 60 * 60, // 30 ngày
  },
  secret: process.env.NEXTAUTH_SECRET,
});
