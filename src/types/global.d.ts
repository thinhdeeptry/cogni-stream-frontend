// Tích hợp với NextAuth
import { DefaultSession, DefaultUser, JWT } from "next-auth";

declare global {
  interface IUser {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    image?: string;
    role: string;
    accountType: string;
    isActive: boolean;
    createdAt: string;
  }

  interface IAuthResponse {
    user: IUser;
    accessToken: string;
    refreshToken: string;
  }
}
namespace NodeJS {
  interface ProcessEnv {
    NEXTAUTH_SECRET: string;
    // Các biến môi trường khác nếu có
  }
}

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & IUser; // Kết hợp DefaultUser với IUser
    accessToken: string;
    refreshToken: string;
  }

  interface User extends DefaultUser, IUser {
    // Kết hợp DefaultUser với IUser
    accessToken?: string;
    refreshToken?: string;
  }

  interface JWT {
    id: string;
    user: IUser;
    accessToken: string;
    refreshToken: string; // Thêm refreshToken vào JWT
  }
}
export {};
