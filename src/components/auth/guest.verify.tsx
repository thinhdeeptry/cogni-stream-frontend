"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useRef, useState } from "react";

import { Smartphone } from "lucide-react";
import { Toaster, toast } from "sonner";

import { RefreshOTPUser, verifyUser } from "@/actions/authActions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { ShineBorder } from "../magicui/shine-border";

export default function GuestVerify(props: { id: string }) {
  const [mounted, setMounted] = useState(false);
  const { id } = props;
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      handleResendCode();
      toast.success("Vui lòng kiểm tra email để xác thực!");
      startCountdown();
    }
    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Start countdown timer
  const startCountdown = () => {
    setCountdown(60); // 60 seconds
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle resend code
  const handleResendCode = async () => {
    try {
      setIsLoading(true);
      const result = await RefreshOTPUser(id);
      if (result.error) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      startCountdown();
    } catch (error) {
      toast.error("Failed to resend code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change
  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple digits

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Move to next input if value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const newCode = [...code];
      newCode[index - 1] = "";
      setCode(newCode);
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const newCode = [...code];

    for (let i = 0; i < pastedData.length; i++) {
      if (/[0-9]/.test(pastedData[i])) {
        newCode[i] = pastedData[i];
      }
    }

    setCode(newCode);
  };

  const handleSubmit = async () => {
    const verificationCode = code.join("");
    if (verificationCode.length !== 6) {
      toast.error("Please enter a complete verification code");
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyUser(id, verificationCode); // Join the code array into a single string            await new Promise((resolve) => setTimeout(resolve, 1000))
      if (result.error) {
        toast.error(result.message);
        console.log(result);

        return;
      }
      toast.success(result.message);
      if (result.redirectTo) router.push(result.redirectTo);
    } catch (error) {
      toast.error("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Format countdown time
  const formatTime = (seconds: number) => {
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative bg-gradient-to-br from-purple-50/30 to-orange-50/30">
        <Toaster richColors position="top-right" />
        <Card className="w-full max-w-md bg-white/20 backdrop-blur-md rounded-xl shadow-lg border-white/30 relative overflow-hidden">
          <CardHeader className="text-center pt-8 pb-2">
            <div className="h-6 w-32 mx-auto bg-gray-200/50 animate-pulse rounded" />
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative bg-gradient-to-br from-purple-50/30 to-orange-50/30">
      <Toaster richColors position="top-right" />
      <Card className="w-full max-w-md bg-white/20 backdrop-blur-md rounded-xl shadow-lg border-white/30 relative overflow-hidden">
        <ShineBorder
          shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
          borderWidth={2}
        />
        <CardHeader className="space-y-1 text-center pt-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-orange-100/50 backdrop-blur-sm flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">
            Xác thực tài khoản
          </h2>
          <p className="text-sm text-gray-600">
            Nhập mã xác thực được gửi đến email của bạn
          </p>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {/* Verification code inputs */}
          <div className="flex justify-center gap-2">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el: HTMLInputElement | null): void => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-14 text-center text-lg font-semibold 
                  border border-orange-200 
                  bg-white/70 
                  backdrop-blur-sm 
                  rounded-lg 
                  focus:border-orange-400 
                  focus:ring-2 
                  focus:ring-orange-200 
                  focus:bg-white/90
                  outline-none 
                  transition-all
                  shadow-sm"
              />
            ))}
          </div>

          <div className="space-y-4">
            <Button
              className="w-full h-12 bg-orange-500/80 hover:bg-orange-500 text-white font-medium rounded-full backdrop-blur-sm transition-all"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              XÁC NHẬN
            </Button>

            <div className="text-center">
              <Button
                variant="link"
                className="text-sm text-gray-600 hover:text-orange-600 transition-colors"
                onClick={handleResendCode}
                disabled={countdown > 0 || isLoading}
              >
                {countdown > 0 ? (
                  <span>Gửi lại mã sau {formatTime(countdown)}</span>
                ) : (
                  <span>Gửi lại mã</span>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
