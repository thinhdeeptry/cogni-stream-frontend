"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { toast } from "sonner";

import { getSeriesById, updateSeries } from "@/actions/seriesAction";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface EditSeriesPageProps {
  params: {
    id: string;
  };
}

export default function EditSeriesPage({ params }: EditSeriesPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    coverImage: "",
    isPublished: false,
  });
  const [coverUploading, setCoverUploading] = useState(false);

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setInitialLoading(true);
        const response = await getSeriesById(params.id);
        setFormData({
          title: response.data.title,
          description: response.data.description,
          coverImage: response.data.coverImage,
          isPublished: response.data.published,
        });
      } catch (error) {
        toast.error("Không thể tải thông tin series");
        router.push("/admin/series");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchSeries();
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await updateSeries(params.id, {
        userId: "current-user-id", // Replace with actual user ID
        title: formData.title,
        description: formData.description,
        coverImage: formData.coverImage,
        isPublished: formData.isPublished,
        posts: [], // Keep existing posts
      });

      if (response.success) {
        toast.success(response.message);
        router.push("/admin/series");
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi khi cập nhật series");
    } finally {
      setLoading(false);
    }
  };

  // Dummy upload function, bạn sẽ tự xử lý nội dung hàm này
  async function uploadImage(file: File): Promise<string> {
    // TODO: call your API and return the image URL
    return new Promise((resolve) =>
      setTimeout(() => resolve("/demo-cover.jpg"), 1000),
    );
  }

  if (initialLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chỉnh sửa Series</h1>
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
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                setCoverUploading(true);
                const url = await uploadImage(file);
                setFormData({ ...formData, coverImage: url });
                setCoverUploading(false);
              }
            }}
          />
          {coverUploading && (
            <div className="text-sm text-gray-500">Đang tải ảnh...</div>
          )}
          {formData.coverImage && (
            <img
              src={formData.coverImage}
              alt="cover"
              className="w-48 h-32 object-cover rounded mt-2"
            />
          )}
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
            {loading ? "Đang cập nhật..." : "Cập nhật series"}
          </Button>
        </div>
      </form>
    </div>
  );
}
