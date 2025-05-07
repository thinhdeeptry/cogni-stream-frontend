"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { toast } from "sonner";

import { getSeriesById } from "@/actions/seriesAction";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SeriesDetailPageProps {
  params: {
    id: string;
  };
}

export default function SeriesDetailPage({ params }: SeriesDetailPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState<any>(null);

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const response = await getSeriesById(params.id);
        setSeries(response.data);
      } catch (error) {
        toast.error("Không thể tải thông tin series");
        router.push("/admin/series");
      } finally {
        setLoading(false);
      }
    };

    fetchSeries();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Đang tải...</div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Không tìm thấy series</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chi tiết Series</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Quay lại
          </Button>
          <Button
            onClick={() => router.push(`/admin/series/${params.id}/edit`)}
          >
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
              <p>{series.title}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">Mô tả</h3>
              <p>{series.description}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">Ảnh bìa</h3>
              {series.coverImage && (
                <img
                  src={series.coverImage}
                  alt={series.title}
                  className="w-48 h-32 object-cover rounded-lg"
                />
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-1">Trạng thái</h3>
              <Badge
                variant={series.published ? "default" : "secondary"}
                className={series.published ? "bg-green-500" : ""}
              >
                {series.published ? "Đã xuất bản" : "Chưa xuất bản"}
              </Badge>
            </div>

            <div>
              <h3 className="font-semibold mb-1">Ngày tạo</h3>
              <p>{new Date(series.createdAt).toLocaleString()}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">Ngày cập nhật</h3>
              <p>{new Date(series.updatedAt).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách bài viết</CardTitle>
          </CardHeader>
          <CardContent>
            {series.posts.length === 0 ? (
              <p className="text-center text-gray-500">
                Chưa có bài viết nào trong series
              </p>
            ) : (
              <div className="space-y-4">
                {series.posts
                  .sort((a: any, b: any) => a.order - b.order)
                  .map((post: any) => (
                    <div
                      key={post.postId}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-gray-500">
                          #{post.order}
                        </span>
                        {post.postCoverImage && (
                          <img
                            src={post.postCoverImage}
                            alt={post.postTitle}
                            className="w-16 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <h4 className="font-medium">{post.postTitle}</h4>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/posts/${post.postId}`)
                        }
                      >
                        Xem bài viết
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
