"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Github, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Toaster, toast } from "sonner";
import * as z from "zod";

import { signUpUser } from "@/actions/authActions";

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
import GoogleLoginButton from "./google-login-button";

const formSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Họ tên phải có ít nhất 2 ký tự.",
    })
    .max(100, {
      message: "Họ tên không được vượt quá 100 ký tự.",
    })
    .regex(/^[\p{L}\p{M}\s'.-]+$/u, {
      message:
        "Họ tên chỉ được chứa chữ cái, khoảng trắng và các ký tự đặc biệt như dấu nháy, gạch ngang, chấm.",
    }),
  email: z
    .string()
    .email({
      message: "Email không hợp lệ.",
    })
    .max(254, {
      message: "Email không được vượt quá 254 ký tự.",
    })
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
      message: "Định dạng email không hợp lệ.",
    }),
  password: z
    .string()
    .min(6, {
      message: "Mật khẩu phải có ít nhất 6 ký tự.",
    })
    .max(128, {
      message: "Mật khẩu không được vượt quá 128 ký tự.",
    }),
});

export default function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    const { email, password, name } = values;
    console.log("Check values>>>> ", values);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate a delay
      const result = await signUpUser(email, password, name);
      console.log("Check result>>>>>> ", result);

      if (result.error) {
        console.log("Login error>>> ", result.message);
        toast.error(result.message);
        setError(result.message);
      } else if (result.success) {
        if (result.redirectTo) {
          toast.success("Đăng ký thành công!");
          router.push(result.redirectTo);
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setError("Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.");
      toast.error("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }

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
          <h2 className="text-2xl font-bold text-gray-800">
            Cogni Stream – Mở cửa tri thức{"\n"}ghi danh ngay!
          </h2>
        </CardHeader>
        <CardContent className="pt-6 pb-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Họ tên"
                        maxLength={100}
                        className="rounded-full h-12 px-4 border-white/50 bg-white/50 backdrop-blur-sm focus:bg-white/70 transition-all"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Email"
                        type="email"
                        maxLength={254}
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
                          placeholder="Mật khẩu"
                          maxLength={128}
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-12 rounded-full bg-orange-500/80 hover:bg-orange-500 text-white backdrop-blur-sm transition-all"
                disabled={isLoading}
              >
                Đăng ký
              </Button>
              {error && (
                <p className="text-destructive text-sm text-center">{error}</p>
              )}
            </form>
          </Form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full bg-white/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/30 backdrop-blur-sm px-2 text-gray-700">
                Hoặc đăng ký bằng
              </span>
            </div>
          </div>

          {/* Replace the grid of buttons with single GoogleLoginButton */}
          <div className="grid grid-cols-1 gap-3">
            <GoogleLoginButton
              callbackUrl="/"
              className="rounded-lg h-12 border-input hover:bg-main-50"
            />
          </div>

          <div className="mt-8 text-center text-sm text-gray-700">
            Đã có tài khoản?{" "}
            <Button
              variant="link"
              className="p-0 h-auto font-semibold text-orange-600 hover:text-orange-700"
              onClick={() => router.push("/auth/login")}
            >
              Đăng nhập ngay
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
