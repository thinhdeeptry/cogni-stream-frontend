"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Toaster, toast } from "sonner";
import * as z from "zod";

import { loginUser } from "@/actions/authActions";

import GoogleLoginButton from "@/components/auth/google-login-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { ShineBorder } from "../magicui/shine-border";

const formSchema = z.object({
  email: z.string().email({
    message: "Email không hợp lệ.",
  }),
  password: z.string().min(6, {
    message: "Mật khẩu phải có ít nhất 6 ký tự.",
  }),
});

export default function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("");
  useEffect(() => {
    const messageParam = searchParams.get("message");
    if (messageParam === "session-expired") {
      setMessage("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }
  }, [searchParams]);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);

    const { email, password } = values;
    try {
      const result = await loginUser(email, password);
      if (result.error) {
        toast.error(result.message);
        setError(result.message);
        if (result.redirectTo) {
          router.push(result.redirectTo);
        }
      } else if (result.success) {
        if (result.redirectTo) {
          router.push(result.redirectTo);
          toast.success(result.message);
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setError("Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  }
  const handleForgotPassword = () => {
    // Store the current email in localStorage if available
    const currentEmail = form.getValues().email;
    if (currentEmail) {
      localStorage.setItem("forgotPasswordEmail", currentEmail);
    }

    // Navigate to forgot password page
    router.push("/auth/forgot-password");
  };
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative bg-gradient-to-br from-purple-50/30 to-orange-50/30">
      <Toaster richColors position="top-right" />
      <Card className="w-full max-w-md bg-white/20 backdrop-blur-md rounded-xl shadow-lg border-white/30 relative overflow-hidden">
        <ShineBorder
          shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
          borderWidth={2}
        />
        <CardHeader className="text-center pt-8 pb-2">
          <h2 className="text-3xl font-bold text-orange-400">Edu Forge</h2>
          <p className="text-lg text-gray-500">
            {" "}
            Nơi tri thức bùng nổ, tương lai rộng mở!
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          {message && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm">
              {message}
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Enter Email"
                        className="rounded-full h-12 px-4 border-input"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Passcode"
                          className="rounded-full h-12 px-4 border-input pr-10"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                          onClick={togglePasswordVisibility}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="sr-only">
                            {showPassword ? "Hide password" : "Show password"}
                          </span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage>
                      <button
                        type="button"
                        className="ml-3 mt-2 text-blue-700 text-xs underline-offset-2 hover:underline"
                        onClick={handleForgotPassword}
                      >
                        Đã quên mật khẩu?
                      </button>
                    </FormMessage>
                  </FormItem>
                )}
              />
              {/* <div className="text-center">
                <Button
                  variant="link"
                  className="text-sm text-muted-foreground p-0 h-auto"
                >
                  Having trouble in sign in?
                </Button>
              </div> */}
              {error && (
                <p className="text-destructive text-sm text-center">{error}</p>
              )}
              <Button
                type="submit"
                className="w-full h-12 rounded-full text-md font-semibold bg-main-400 hover:bg-main-500 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Đăng nhập
              </Button>
            </form>
          </Form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">
                Hoặc đăng nhập bằng
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <GoogleLoginButton
              callbackUrl="/"
              className="rounded-lg h-12 border-input hover:bg-main-50"
            />
          </div>
          {/* Add the new account request section */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Chưa có tài khoản?{" "}
            <Button
              variant="link"
              className="p-0 h-auto font-semibold text-main-900 hover:text-main-800"
              onClick={() => router.push("/auth/register")}
            >
              Đăng ký ngay
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
