"use client";

import { useRef, useState } from "react";

import { toast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api/authApi";
import { Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface AvatarUploadProps {
  onSuccess?: () => void;
}

export function AvatarUpload({ onSuccess }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Loại file không hợp lệ",
        description: "Vui lòng chọn file hình ảnh",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File quá lớn",
        description: "Kích thước file tối đa là 5MB",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!previewUrl) return;

    setIsUploading(true);

    try {
      // Create form data for upload
      const formData = new FormData();
      const file = fileInputRef.current?.files?.[0];
      if (!file) return;

      formData.append("file", file);
      formData.append("bucket", "avatars");
      const storageApiUrl =
        process.env.NEXT_PUBLIC_STORAGE_API_URL ||
        "https://storage.eduforge.io.vn";
      // Upload to storage service
      const response = await fetch(`${storageApiUrl}/api/v1/storage/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Không thể tải lên ảnh đại diện");
      }

      const data = await response.json();
      const imageUrl = data.url;

      // Update avatar in user profile
      const result = await authApi.updateAvatar(imageUrl);

      // Trong hàm handleUpload sau khi cập nhật thành công
      if (result.error) {
        // ... xử lý lỗi
      } else {
        toast({
          title: "Cập nhật ảnh đại diện thành công",
          description: "Ảnh đại diện của bạn đã được cập nhật",
        });

        // Reset preview
        setPreviewUrl(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        // Dispatch event profile-updated
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
        description: "Không thể tải lên ảnh đại diện. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {previewUrl ? (
        <div className="space-y-4">
          <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-white shadow-md">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex gap-2 justify-center">
            <Button onClick={handleUpload} disabled={isUploading} size="sm">
              {isUploading ? "Đang tải lên..." : "Lưu ảnh"}
            </Button>
            <Button onClick={handleCancel} variant="outline" size="sm">
              <X className="h-4 w-4 mr-1" />
              Hủy
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          Chọn ảnh đại diện
        </Button>
      )}
    </div>
  );
}
