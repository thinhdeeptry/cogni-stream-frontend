"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale/vi";
import { Eye, Heart } from "lucide-react";

import { Post, getAllPosts } from "@/actions/postAction";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function getReadingTime(content: string) {
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} phút đọc`;
}

export default function PublicPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const response = await getAllPosts({
          page: 0,
          size: 10,
          sortBy: "createdAt",
          sortDir: "desc",
        });
        setPosts(response.data.content);
      } catch (error) {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Bài viết nổi bật</h1>
      <div className="grid gap-6">
        {loading ? (
          <div>Đang tải...</div>
        ) : posts.length === 0 ? (
          <div>Không có bài viết nào</div>
        ) : (
          posts.map((post) => (
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
                    {post.author?.isFeatured && (
                      <span title="Tác giả nổi bật">👑</span>
                    )}
                    {post.author?.isVerified && (
                      <span title="Đã xác thực">✔️</span>
                    )}
                  </span>
                </div>
                <h2 className="text-xl font-bold mb-2 line-clamp-2">
                  {post.title}
                </h2>
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
                        post.likedByCurrentUser
                          ? "fill-red-500 text-red-500"
                          : ""
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
          ))
        )}
      </div>
    </div>
  );
}
