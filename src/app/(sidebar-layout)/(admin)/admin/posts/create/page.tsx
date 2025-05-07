"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Editor } from "@tinymce/tinymce-react";
import { toast } from "sonner";

import { createPost } from "@/actions/postAction";
import { getAllSeries } from "@/actions/seriesAction";

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
import { Textarea } from "@/components/ui/textarea";

export default function CreatePostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [series, setSeries] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    coverImage: "",
    tags: "",
    seriesId: "",
    isPublished: false,
  });

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const response = await getAllSeries();
        setSeries(response.data.content);
      } catch (error) {
        console.error("Error fetching series:", error);
      }
    };

    fetchSeries();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await createPost({
        userId: "current-user-id", // Replace with actual user ID
        title: formData.title,
        content: formData.content,
        coverImage: formData.coverImage,
        tags: formData.tags.split(",").map((tag) => tag.trim()),
        seriesId: formData.seriesId || undefined,
        isPublished: formData.isPublished,
      });

      if (response.success) {
        toast.success(response.message);
        router.push("/admin/posts");
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi khi tạo bài viết");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tạo bài viết mới</h1>
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
            apiKey="your-tinymce-api-key"
            value={formData.content}
            onEditorChange={(content) => setFormData({ ...formData, content })}
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
            type="url"
            value={formData.coverImage}
            onChange={(e) =>
              setFormData({ ...formData, coverImage: e.target.value })
            }
            placeholder="Nhập URL ảnh bìa"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="Nhập tags, phân cách bằng dấu phẩy"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="series">Series</Label>
          <Select
            value={formData.seriesId}
            onValueChange={(value) =>
              setFormData({ ...formData, seriesId: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn series (không bắt buộc)" />
            </SelectTrigger>
            <SelectContent>
              {series.length > 0 ? (
                series.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.title}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-series" disabled>
                  Chưa có series nào
                </SelectItem>
              )}
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
            {loading ? "Đang tạo..." : "Tạo bài viết"}
          </Button>
        </div>
      </form>
    </div>
  );
}
