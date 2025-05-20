"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale/vi";
import { ChevronLeft, ChevronRight, Eye, Heart } from "lucide-react";

import {
  Post,
  getAllPosts,
  getUserRecommendations,
} from "@/actions/postAction";
import { Series, getAllSeries } from "@/actions/seriesAction";

import useUserStore from "@/stores/useUserStore";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function getReadingTime(content: string) {
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} phút đọc`;
}

export default function PublicPostsPage() {
  const [recommendedPosts, setRecommendedPosts] = useState<Post[]>([]);
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const router = useRouter();
  const { user } = useUserStore();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch recommended posts if user is logged in
        if (user?.id) {
          const recommendationsResponse = await getUserRecommendations(
            user.id,
            {
              page: 0,
              size: 5,
              currentUserId: user.id,
            },
          );
          if (recommendationsResponse?.data) {
            setRecommendedPosts(recommendationsResponse.data.content || []);
          }
        }

        // Fetch latest posts
        const latestPostsResponse = await getAllPosts({
          page: currentPage,
          size: 10,
          sortBy: "createdAt",
          sortDir: "desc",
          currentUserId: user?.id,
        });
        if (latestPostsResponse?.data) {
          setLatestPosts(latestPostsResponse.data.content || []);
          setTotalPages(latestPostsResponse.data.totalPages || 0);
        }

        // Fetch series
        const seriesResponse = await getAllSeries({
          page: 0,
          size: 5,
          sortBy: "createdAt",
          sortDir: "desc",
        });
        if (seriesResponse?.data) {
          setSeries(seriesResponse.data.content || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentPage, user?.id]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const renderPostCard = (post: Post) => (
    <div
      key={post.id}
      className="flex items-center justify-between bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition cursor-pointer"
      onClick={() => router.push(`/posts/${post.id}`)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <img
            src={post.author?.avatar || "/default-avatar.png"}
            alt={post.author?.name}
            className="w-10 h-10 rounded-full border"
          />
          <span className="font-semibold flex items-center gap-1">
            {post.author?.name}
            {post.author?.isFeatured && <span title="Tác giả nổi bật">👑</span>}
            {post.author?.isVerified && <span title="Đã xác thực">✔️</span>}
          </span>
        </div>
        <h2 className="text-xl font-bold mb-2 line-clamp-2">{post.title}</h2>
        <p className="text-gray-600 mb-3 line-clamp-2">
          {post.content?.replace(/<[^>]+>/g, "").slice(0, 120) + "..."}
        </p>
        <div className="flex items-center gap-3 flex-wrap text-sm text-gray-500">
          {post.tags && post.tags.length > 0 && (
            <Badge variant="secondary">{post.tags[0]}</Badge>
          )}
          <span>
            {formatDistanceToNow(new Date(post.createdAt), {
              addSuffix: true,
              locale: vi,
            })}
          </span>
          <span>•</span>
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
                post.likedByCurrentUser ? "fill-red-500 text-red-500" : ""
              }`}
            />
            {post.totalLikes}
          </span>
        </div>
      </div>
      {post.coverImage && (
        <img
          src={post.coverImage}
          alt={post.title}
          className="w-56 h-36 object-cover rounded-xl ml-6"
        />
      )}
    </div>
  );

  if (loading) {
    return <div className="container mx-auto py-8">Đang tải...</div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-12">
      {/* Recommended Posts Section */}
      {user && recommendedPosts.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">
            Bài viết được đề xuất cho bạn
          </h2>
          <div className="grid gap-6">
            {recommendedPosts.map(renderPostCard)}
          </div>
        </section>
      )}

      {/* Latest Posts Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Bài viết mới nhất</h2>
        <div className="grid gap-6">
          {latestPosts.length === 0 ? (
            <div>Không có bài viết nào</div>
          ) : (
            <>
              {latestPosts.map(renderPostCard)}

              {/* Pagination */}
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Trang {currentPage + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Series Section */}
      {series.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">Series nổi bật</h2>
          <div className="grid gap-6">
            {series.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition cursor-pointer"
                onClick={() => router.push(`/series/${s.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold mb-2">{s.title}</h2>
                  <p className="text-gray-600 mb-3 line-clamp-2">
                    {s.description}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{s.posts.length} bài viết</span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(s.createdAt), {
                        addSuffix: true,
                        locale: vi,
                      })}
                    </span>
                  </div>
                </div>
                {s.coverImage && (
                  <img
                    src={s.coverImage}
                    alt={s.title}
                    className="w-56 h-36 object-cover rounded-xl ml-6"
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
