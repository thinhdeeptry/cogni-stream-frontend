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
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
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
      } else {
        console.log("JWT callback - No user provided");
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
  secret: process.env.NEXTAUTH_SECRET,
});
