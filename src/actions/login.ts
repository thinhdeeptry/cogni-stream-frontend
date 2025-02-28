"use server";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function loginUser(
  email: string,
  password: string,
  redirectTo?: string | undefined,
) {
  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirectTo: redirectTo,
    });
    return result;
  } catch (error) {
    console.error("email login: ", error);
    if (error instanceof AuthError) {
      return { error: "error", message: error.message, status: 401 };
    }
    throw error;
  }
}
