import { log } from "console";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authApi } from "./lib/api/authApi";
import {
  AccountNotActivatedError,
  InvalidEmailPasswordError,
  ServerError,
} from "./utils/errors";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
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
            // Tài khoản chưa kích hoạt
            throw new AccountNotActivatedError();
          } else if (response.statusCode === 401) {
            // Sai email hoặc mật khẩu
            throw new InvalidEmailPasswordError();
          } else {
            throw new ServerError();
          }
        }

        if (response.user && response.access_token) {
          const user = {
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
            accessToken: response.access_token,
          };
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
        // Lưu accessToken riêng, không nằm trong interface IUser
        token.accessToken = user.accessToken;
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
      // Lưu accessToken ở cấp session, không phải trong user
      session.accessToken = token.accessToken;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
