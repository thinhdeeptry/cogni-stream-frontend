"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Editor } from "@tinymce/tinymce-react";
import { toast } from "sonner";

import { getPostById, updatePost } from "@/actions/postAction";
import { Series, getAllSeries } from "@/actions/seriesAction";

import { processMediaInContent, uploadCoverImage } from "@/utils/media";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface EditPostPageProps {
  params: {
    id: string;
  };
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [series, setSeries] = useState<Series[]>([]);
  const [coverUploading, setCoverUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    coverImage: "",
    tags: "",
    isPublished: false,
    seriesId: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);
        const [postResponse, seriesResponse] = await Promise.all([
          getPostById(params.id),
          getAllSeries(),
        ]);

        setFormData({
          title: postResponse.title,
          content: postResponse.content,
          coverImage: postResponse.coverImage,
          tags: postResponse.tags.join(", "),
          isPublished: postResponse.isPublished,
          seriesId: postResponse.seriesId || "",
        });
        setSeries(seriesResponse.data.content);
      } catch (error) {
        toast.error("Không thể tải thông tin bài viết");
        router.push("/admin/posts");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tags = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const response = await updatePost(params.id, {
        userId: "current-user-id", // Replace with actual user ID
        title: formData.title,
        content: formData.content,
        coverImage: formData.coverImage,
        tags,
        isPublished: formData.isPublished,
        seriesId: formData.seriesId || undefined,
      });

      if (response.success) {
        toast.success(response.message);
        router.push("/admin/posts");
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi khi cập nhật bài viết");
    } finally {
      setLoading(false);
    }
  };

  // Replace the dummy upload function with the real one
  async function uploadImage(file: File): Promise<string> {
    try {
      return await uploadCoverImage(file);
    } catch (error) {
      toast.error("Không thể tải ảnh bìa lên");
      throw error;
    }
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
        <h1 className="text-2xl font-bold">Chỉnh sửa bài viết</h1>
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
          <Label htmlFor="content">Nội dung</Label>
          <Editor
            apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
            value={formData.content}
            onEditorChange={(content: string) =>
              setFormData({ ...formData, content })
            }
            init={{
              height: 500,
              menubar: true,
              plugins: [
                "advlist",
                "autolink",
                "lists",
                "link",
                "image",
                "charmap",
                "preview",
                "anchor",
                "searchreplace",
                "visualblocks",
                "code",
                "fullscreen",
                "insertdatetime",
                "media",
                "table",
                "code",
                "help",
                "wordcount",
              ],
              toolbar:
                "undo redo | blocks | " +
                "bold italic forecolor | alignleft aligncenter " +
                "alignright alignjustify | bullist numlist outdent indent | " +
                "removeformat | help",
            }}
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

        <div className="space-y-2">
          <Label htmlFor="tags">Tags (phân cách bằng dấu phẩy)</Label>
          <Input
            id="tags"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="Ví dụ: javascript, react, nextjs"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="series">Series (không bắt buộc)</Label>
          <Select
            value={formData.seriesId}
            onValueChange={(value) =>
              setFormData({ ...formData, seriesId: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn series" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Không có series</SelectItem>
              {series.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            {loading ? "Đang cập nhật..." : "Cập nhật bài viết"}
          </Button>
        </div>
      </form>
    </div>
  );
}
