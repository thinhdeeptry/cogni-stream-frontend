"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Editor } from "@tinymce/tinymce-react";
import { toast } from "sonner";

import { createPost } from "@/actions/postAction";
import { getAllSeries } from "@/actions/seriesAction";

import useUserStore from "@/stores/useUserStore";

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
import { Textarea } from "@/components/ui/textarea";

export default function CreatePostPage() {
  const router = useRouter();
  const { user } = useUserStore();
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
  const [coverUploading, setCoverUploading] = useState(false);

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
    if (!user?.id) {
      toast.error("Vui lòng đăng nhập để tạo bài viết");
      return;
    }

    setLoading(true);

    try {
      const response = await createPost({
        userId: user.id,
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

  const handleEditorChange = (content: string) => {
    setFormData({ ...formData, content });
  };

  const handleImageUpload = async (blobInfo: any) => {
    try {
      const file = blobInfo.blob();
      const url = await uploadCoverImage(file);
      return url;
    } catch (error) {
      toast.error("Không thể tải ảnh lên");
      throw error;
    }
  };

  async function uploadImage(file: File): Promise<string> {
    try {
      return await uploadCoverImage(file);
    } catch (error) {
      toast.error("Không thể tải ảnh bìa lên");
      throw error;
    }
  }

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
            apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
            value={formData.content}
            onEditorChange={handleEditorChange}
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
                "codesample",
                "help",
                "wordcount",
              ],
              toolbar:
                "undo redo | blocks | " +
                "bold italic forecolor | alignleft aligncenter " +
                "alignright alignjustify | bullist numlist outdent indent | " +
                "image codesample | removeformat | help",
              images_upload_handler: handleImageUpload,
              codesample_languages: [
                { text: "HTML/XML", value: "markup" },
                { text: "JavaScript", value: "javascript" },
                { text: "TypeScript", value: "typescript" },
                { text: "CSS", value: "css" },
                { text: "PHP", value: "php" },
                { text: "Python", value: "python" },
                { text: "Java", value: "java" },
                { text: "C", value: "c" },
                { text: "C#", value: "csharp" },
                { text: "SQL", value: "sql" },
                { text: "Bash", value: "bash" },
                { text: "JSON", value: "json" },
                { text: "YAML", value: "yaml" },
                { text: "Markdown", value: "markdown" },
              ],
              codesample_global_prismjs: true,
              content_style: `
                .mce-content-body pre {
                  background-color: #1e1e1e;
                  color: #d4d4d4;
                  padding: 1em;
                  border-radius: 4px;
                  font-family: 'Fira Code', monospace;
                }
                .mce-content-body code {
                  font-family: 'Fira Code', monospace;
                }
              `,
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
