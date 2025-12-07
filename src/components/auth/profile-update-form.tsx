"use client";

import { useState } from "react";

import { toast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api/authApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Họ tên phải có ít nhất 2 ký tự",
  }),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileUpdateFormProps {
  user: any;
  onSuccess?: () => void;
}

export function ProfileUpdateForm({ user, onSuccess }: ProfileUpdateFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      address: user?.address || "",
    },
  });

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true);

    try {
      const result = await authApi.updateProfile(data);

      if (result.error) {
        toast({
          title: "Cập nhật thất bại",
          description: result.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Cập nhật thành công",
          description: "Thông tin cá nhân của bạn đã được cập nhật",
        });

        // Dispatch event profile-updated thay vì visibilitychange
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("profile-updated"));
        }

        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      toast({
        title: "Đã xảy ra lỗi",
        description: "Không thể cập nhật thông tin. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Họ và tên</FormLabel>
              <FormControl>
                <Input placeholder="Nhập họ và tên" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Số điện thoại</FormLabel>
              <FormControl>
                <Input placeholder="Nhập số điện thoại" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Địa chỉ</FormLabel>
              <FormControl>
                <Input placeholder="Nhập địa chỉ" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full bg-orange-500"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang cập nhật...
            </>
          ) : (
            "Cập nhật thông tin"
          )}
        </Button>
      </form>
    </Form>
  );
}
