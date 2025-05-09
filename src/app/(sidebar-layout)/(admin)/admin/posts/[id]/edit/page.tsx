"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { Editor } from "@tinymce/tinymce-react";
import { toast } from "sonner";

import {
  ApiResponse,
  Post,
  getPostById,
  updatePost,
} from "@/actions/postAction";
import { Series, getSeriesByUserId } from "@/actions/seriesAction";

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

interface EditPostPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useUserStore();
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
      if (!user?.id) {
        console.log("No user ID found, redirecting...");
        toast.error("Vui lòng đăng nhập để chỉnh sửa bài viết");
        router.push("/admin/posts");
        return;
      }

      try {
        setInitialLoading(true);
        console.log("Fetching post with ID:", resolvedParams.id);
        const [postResponse, seriesResponse] = await Promise.all([
          getPostById(resolvedParams.id),
          getSeriesByUserId(user.id, {
            page: 0,
            size: 100,
            sortBy: "createdAt",
            sortDir: "desc",
          }),
        ]);

        if (!postResponse?.data) {
          console.log("Post not found, redirecting...");
          throw new Error("Không tìm thấy bài viết");
        }

        const post = postResponse.data;
        console.log("Post data:", post);
        console.log("Current user ID:", user.id);
        console.log("Post user ID:", post.userId);

        if (!post.userId) {
          console.log("Post user ID is missing, redirecting...");
          toast.error("Không thể xác định chủ sở hữu bài viết");
          router.push("/admin/posts");
          return;
        }

        if (post.userId !== user.id) {
          console.log("User doesn't own the post, redirecting...");
          toast.error("Bạn không có quyền chỉnh sửa bài viết này");
          router.push("/admin/posts");
          return;
        }

        setFormData({
          title: post.title || "",
          content: post.content || "",
          coverImage: post.coverImage || "",
          tags: Array.isArray(post.tags) ? post.tags.join(", ") : "",
          isPublished: post.published || false,
          seriesId: post.seriesId || "none",
        });
        setSeries(seriesResponse.data.content || []);
      } catch (error) {
        console.error("Error fetching post data:", error);
        toast.error("Không thể tải thông tin bài viết");
        router.push("/admin/posts");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.id, router, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error("Vui lòng đăng nhập để cập nhật bài viết");
      return;
    }

    setLoading(true);

    try {
      const tags = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const response = await updatePost(resolvedParams.id, {
        userId: user.id,
        title: formData.title,
        content: formData.content,
        coverImage: formData.coverImage,
        tags,
        isPublished: formData.isPublished,
        seriesId: formData.seriesId === "none" ? undefined : formData.seriesId,
      });

      if (response.success) {
        toast.success(response.message);
        router.push("/admin/posts");
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("Đã xảy ra lỗi khi cập nhật bài viết");
    } finally {
      setLoading(false);
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
              <SelectItem value="none">Không có series</SelectItem>
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
