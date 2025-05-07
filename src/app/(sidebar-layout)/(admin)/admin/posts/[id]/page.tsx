"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { toast } from "sonner";

import { getPostById } from "@/actions/postAction";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PostDetailPageProps {
  params: {
    id: string;
  };
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<any>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await getPostById(params.id);
        setPost(response);
      } catch (error) {
        toast.error("Không thể tải thông tin bài viết");
        router.push("/admin/posts");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Đang tải...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Không tìm thấy bài viết</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chi tiết bài viết</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Quay lại
          </Button>
          <Button onClick={() => router.push(`/admin/posts/${params.id}/edit`)}>
            Chỉnh sửa
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">Tiêu đề</h3>
              <p>{post.title}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">Trạng thái</h3>
              <Badge
                variant={post.isPublished ? "default" : "secondary"}
                className={post.isPublished ? "bg-green-500" : ""}
              >
                {post.isPublished ? "Đã xuất bản" : "Chưa xuất bản"}
              </Badge>
            </div>

            <div>
              <h3 className="font-semibold mb-1">Series</h3>
              <p>{post.seriesId ? post.seriesTitle : "Không có series"}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-1">Ngày tạo</h3>
              <p>{new Date(post.createdAt).toLocaleString()}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">Ngày cập nhật</h3>
              <p>{new Date(post.updatedAt).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nội dung</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
