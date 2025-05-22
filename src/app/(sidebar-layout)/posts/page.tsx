"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale/vi";
import { ChevronLeft, ChevronRight, Eye, Heart } from "lucide-react";

import {
  Post,
  UserInfo,
  getAllPosts,
  getUserInfo,
  getUserRecommendations,
} from "@/actions/postAction";
import { Series, getAllSeries } from "@/actions/seriesAction";

import useUserStore from "@/stores/useUserStore";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";

function decodeHTMLEntities(text: string) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

function stripHTMLAndDecodeEntities(html: string) {
  // First decode HTML entities
  const decodedText = decodeHTMLEntities(html);
  // Then remove HTML tags
  return decodedText
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim();
}

function getReadingTime(content: string) {
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} phút đọc`;
}

export default function PublicPostsPage() {
  const [recommendedPosts, setRecommendedPosts] = useState<Post[]>([]);
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [authorInfoMap, setAuthorInfoMap] = useState<Record<string, UserInfo>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const router = useRouter();
  const { user } = useUserStore();

  const fetchAuthorInfo = async (posts: Post[]) => {
    const uniqueAuthorIds = [...new Set(posts.map((post) => post.userId))];
    const authorInfoPromises = uniqueAuthorIds.map(async (userId) => {
      try {
        const userInfo = await getUserInfo(userId);
        return [userId, userInfo] as [string, UserInfo];
      } catch (error) {
        console.error(`Error fetching author info for ${userId}:`, error);
        return null;
      }
    });

    const authorInfoResults = await Promise.all(authorInfoPromises);
    const newAuthorInfoMap: Record<string, UserInfo> = {};
    authorInfoResults.forEach((result) => {
      if (result) {
        const [userId, userInfo] = result;
        newAuthorInfoMap[userId] = userInfo;
      }
    });
    setAuthorInfoMap(newAuthorInfoMap);
  };

  const fetchRecommendations = async () => {
    if (!user?.id) return;

    setRecommendationsLoading(true);
    try {
      const response = await getUserRecommendations(user.id, {
        page: 0,
        size: 5,
        currentUserId: user.id,
      });

      if (response?.data?.content) {
        const recommendedContent = response.data.content;
        setRecommendedPosts(recommendedContent);
        await fetchAuthorInfo(recommendedContent);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch recommendations if user is logged in
        if (user?.id) {
          await fetchRecommendations();
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
          await fetchAuthorInfo(latestPostsResponse.data.content || []);
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
          <UserAvatar
            name={authorInfoMap[post.userId]?.name || "Unknown User"}
            avatarUrl={authorInfoMap[post.userId]?.image}
          />
          <div className="flex flex-col">
            <span className="font-semibold flex items-center gap-1">
              {authorInfoMap[post.userId]?.name || "Unknown User"}
              {post.author?.isFeatured && (
                <span title="Tác giả nổi bật">👑</span>
              )}
              {post.author?.isVerified && <span title="Đã xác thực">✔️</span>}
            </span>
            {post.seriesTitle && (
              <span className="text-sm text-gray-500">
                Series: {post.seriesTitle} - Phần {post.orderInSeries}
              </span>
            )}
          </div>
        </div>

        <h2 className="text-xl font-bold mb-2 line-clamp-2">{post.title}</h2>
        <p className="text-gray-600 mb-3 line-clamp-2">
          {stripHTMLAndDecodeEntities(post.content || "").slice(0, 150)}...
        </p>
        <div className="flex items-center gap-3 flex-wrap text-sm text-gray-500">
          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <span>
            {formatDistanceToNow(new Date(post.createdAt), {
              addSuffix: true,
              locale: vi,
            })}
          </span>
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
      {user &&
        (recommendationsLoading ? (
          <section>
            <h2 className="text-2xl font-bold mb-6">
              Đang tải bài viết phù hợp với bạn...
            </h2>
            <div className="grid gap-6">
              {/* Add loading skeleton here if needed */}
            </div>
          </section>
        ) : recommendedPosts.length > 0 ? (
          <section>
            <h2 className="text-2xl font-bold mb-6">
              Bài viết phù hợp với bạn
            </h2>
            <div className="grid gap-6">
              {recommendedPosts.map(renderPostCard)}
            </div>
          </section>
        ) : null)}

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
