"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { toast } from "sonner";

import { createSeries } from "@/actions/seriesAction";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export default function CreateSeriesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    coverImage: "",
    isPublished: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await createSeries({
        userId: "current-user-id", // Replace with actual user ID
        title: formData.title,
        description: formData.description,
        coverImage: formData.coverImage,
        isPublished: formData.isPublished,
      });

      if (response.success) {
        toast.success(response.message);
        router.push("/admin/series");
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi khi tạo series");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tạo Series mới</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Quay lại
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Tiêu đề</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Mô tả</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="coverImage">Ảnh bìa</Label>
          <Input
            id="coverImage"
            type="url"
            value={formData.coverImage}
            onChange={(e) =>
              setFormData({ ...formData, coverImage: e.target.value })
            }
            placeholder="Nhập URL ảnh bìa"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isPublished"
            checked={formData.isPublished}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, isPublished: checked })
            }
          />
          <Label htmlFor="isPublished">Xuất bản</Label>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Đang tạo..." : "Tạo series"}
          </Button>
        </div>
      </form>
    </div>
  );
}
