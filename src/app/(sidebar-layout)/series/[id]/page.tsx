"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale/vi";
import { ChevronLeft, Eye, Heart } from "lucide-react";

import { Series, getSeriesById } from "@/actions/seriesAction";

import useUserStore from "@/stores/useUserStore";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function getReadingTime(content: string) {
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} phút đọc`;
}

function cleanHtmlEntities(text: string) {
  if (!text) return "";
  // First decode HTML entities
  const decodedText = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  // Then remove HTML tags
  return decodedText.replace(/<[^>]+>/g, "");
}

interface SeriesPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function SeriesPage({ params }: SeriesPageProps) {
  const resolvedParams = use(params);
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useUserStore();

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const response = await getSeriesById(resolvedParams.id, user?.id);
        if (response?.data) {
          setSeries(response.data);
        }
      } catch (error) {
        console.error("Error fetching series:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSeries();
  }, [resolvedParams.id, user?.id]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Đang tải...</div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Không tìm thấy series</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Series Header */}
      <div className="mb-8">
        <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>

        <div className="flex flex-col md:flex-row gap-8">
          {series.coverImage && (
            <img
              src={series.coverImage}
              alt={series.title}
              className="w-full md:w-1/3 h-64 object-cover rounded-xl"
            />
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-4">{series.title}</h1>
            <p className="text-gray-600 mb-4">{series.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{series.posts.length} bài viết</span>
              <span>•</span>
              <span>
                {formatDistanceToNow(new Date(series.createdAt), {
                  addSuffix: true,
                  locale: vi,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Series Posts */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold mb-6">Danh sách bài viết</h2>
        {series.posts.length === 0 ? (
          <div className="text-center text-gray-500">
            Chưa có bài viết nào trong series này
          </div>
        ) : (
          series.posts
            .sort((a, b) => a.order - b.order)
            .map((post) => (
              <div
                key={post.postId}
                className="flex items-center justify-between bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition cursor-pointer"
                onClick={() => router.push(`/posts/${post.postId}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">Bài {post.order}</Badge>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{post.postTitle}</h3>
                  <p className="text-gray-600 mb-2 line-clamp-2">
                    {post.content
                      ? cleanHtmlEntities(post.content)
                          .split(/[.!?]/)
                          .slice(0, 2)
                          .join(". ")
                          .slice(0, 120)
                      : ""}
                    {post.content &&
                    cleanHtmlEntities(post.content).length > 120
                      ? "..."
                      : ""}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{getReadingTime(post.content)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {post.totalViews}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Heart
                        className={`w-4 h-4 ${
                          post.likedByCurrentUser
                            ? "fill-red-500 text-red-500"
                            : ""
                        }`}
                      />
                      {post.totalLikes}
                    </span>
                  </div>
                </div>
                {post.postCoverImage && (
                  <img
                    src={post.postCoverImage}
                    alt={post.postTitle}
                    className="w-48 h-32 object-cover rounded-xl ml-6"
                  />
                )}
              </div>
            ))
        )}
      </div>
    </div>
  );
}
