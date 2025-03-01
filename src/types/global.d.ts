declare global {
  interface IUser {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    image?: string;
    role: string;
    accountType: string;
    isActive: boolean;
    codeId?: string;
    codeExpired?: Date;
  }

  interface IAuthResponse {
    user: IUser;
    access_token: string;
    // các thông tin authentication khác nếu có
  }
}

export {};
