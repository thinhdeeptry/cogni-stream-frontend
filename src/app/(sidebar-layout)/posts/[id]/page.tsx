"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale/vi";
import { ChevronLeft, ChevronRight, Eye, Heart } from "lucide-react";
import Prism from "prismjs";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-java";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-python";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-yaml";
import "prismjs/themes/prism-tomorrow.css";
import { toast } from "sonner";

import {
  Post,
  UserInfo,
  addPostView,
  getAllPosts,
  getPostById,
  getPostsBySeriesId,
  getUserInfo,
  getUserRecommendations,
  togglePostLike,
} from "@/actions/postAction";

import useUserStore from "@/stores/useUserStore";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/ui/user-avatar";

function getReadingTime(content: string) {
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} phút đọc`;
}

function decodeHTMLEntities(html: string) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = html;
  return textarea.value;
}

interface PostDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useUserStore();
  const [post, setPost] = useState<Post | null>(null);
  const [authorInfo, setAuthorInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [seriesPosts, setSeriesPosts] = useState<Post[]>([]);
  const [recommendedPosts, setRecommendedPosts] = useState<Post[]>([]);
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [currentLatestPostsPage, setCurrentLatestPostsPage] = useState(0);
  const postsPerPage = 3;

  const fetchPost = async () => {
    try {
      const response = await getPostById(resolvedParams.id, user?.id);
      setPost(response.data);

      // Fetch author info
      if (response.data.userId) {
        const userInfo = await getUserInfo(response.data.userId);
        setAuthorInfo(userInfo);
      }

      // Fetch series posts if post belongs to a series
      if (response.data.seriesId) {
        const seriesResponse = await getPostsBySeriesId(
          response.data.seriesId,
          {
            currentUserId: user?.id,
          },
        );
        setSeriesPosts(seriesResponse.data.content || []);
      }

      // Fetch recommended posts if user is logged in
      if (user?.id) {
        const recommendationsResponse = await getUserRecommendations(user.id, {
          currentUserId: user.id,
          size: 5,
        });
        setRecommendedPosts(recommendationsResponse.data.content || []);
      }

      // Fetch latest posts
      const latestResponse = await getAllPosts({
        page: 0,
        size: 6,
        sortBy: "createdAt",
        sortDir: "desc",
        currentUserId: user?.id,
      });
      setLatestPosts(latestResponse.data.content || []);
    } catch (error) {
      toast.error("Không thể tải thông tin bài viết");
      router.push("/posts");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user?.id) {
      toast.error("Vui lòng đăng nhập để thích bài viết");
      return;
    }

    try {
      const response = await togglePostLike(resolvedParams.id, user.id);
      setPost(response.data);
    } catch (error) {
      toast.error("Không thể thích bài viết");
    }
  };

  useEffect(() => {
    const recordView = async () => {
      if (!user?.id) return;

      try {
        const response = await addPostView(resolvedParams.id, user.id);
        setPost(response.data);
      } catch (error) {
        console.error("Error recording view:", error);
      }
    };

    fetchPost();
    recordView();
  }, [resolvedParams.id, user?.id]);

  useEffect(() => {
    if (post?.content) {
      // Decode HTML entities in code blocks
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = post.content;

      // Process all code blocks
      const codeBlocks = tempDiv.querySelectorAll("pre code");
      codeBlocks.forEach((codeBlock) => {
        // Decode HTML entities in code content
        const decodedContent = decodeHTMLEntities(codeBlock.innerHTML);
        codeBlock.textContent = decodedContent;

        // Ensure the language class is properly set
        const parentPre = codeBlock.parentElement;
        if (parentPre && !parentPre.className.includes("language-")) {
          const languageClass = Array.from(codeBlock.classList).find((cls) =>
            cls.startsWith("language-"),
          );
          if (languageClass) {
            parentPre.className = `${parentPre.className} ${languageClass}`;
          }
        }
      });

      // Update post content with decoded code blocks
      post.content = tempDiv.innerHTML;

      // Highlight code blocks
      requestAnimationFrame(() => {
        Prism.highlightAll();
      });
    }
  }, [post?.content]);

  const renderSidebarPost = (sidePost: Post) => (
    <div
      key={sidePost.id}
      className={`p-4 rounded-lg cursor-pointer transition-colors ${
        sidePost.id === post?.id ? "bg-primary/10" : "hover:bg-muted"
      }`}
      onClick={() => router.push(`/posts/${sidePost.id}`)}
    >
      {sidePost.coverImage && (
        <img
          src={sidePost.coverImage}
          alt={sidePost.title}
          className="w-full h-32 object-cover rounded-lg mb-3"
        />
      )}
      <div className="flex items-center gap-2 mb-2">
        {sidePost.orderInSeries && (
          <span className="text-sm font-medium text-muted-foreground">
            {sidePost.orderInSeries}.
          </span>
        )}
        <h3 className="font-medium line-clamp-2">{sidePost.title}</h3>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{sidePost.totalViews} lượt xem</span>
        <span>•</span>
        <span>{sidePost.totalLikes} lượt thích</span>
      </div>
    </div>
  );

  const renderLatestPost = (latestPost: Post) => (
    <div
      key={latestPost.id}
      className="flex-1 cursor-pointer hover:opacity-90 transition group"
      onClick={() => router.push(`/posts/${latestPost.id}`)}
    >
      {latestPost.coverImage && (
        <div className="relative aspect-[16/9] mb-4 overflow-hidden rounded-xl">
          <img
            src={latestPost.coverImage}
            alt={latestPost.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        </div>
      )}
      <h3 className="text-lg font-medium line-clamp-2 mb-2 group-hover:text-primary">
        {latestPost.title}
      </h3>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{latestPost.totalViews} lượt xem</span>
        <span>•</span>
        <span>{latestPost.totalLikes} lượt thích</span>
      </div>
    </div>
  );

  if (loading) {
    return <div>Đang tải...</div>;
  }

  if (!post) {
    return <div>Không tìm thấy bài viết</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex gap-8">
        {/* Main Content */}
        <div className="flex-1 max-w-4xl">
          <div className="flex items-center gap-2 mb-4">
            <UserAvatar
              name={authorInfo?.name || "Unknown User"}
              avatarUrl={post.author?.avatar}
            />
            <span className="font-semibold flex items-center gap-1">
              {authorInfo?.name || "Unknown User"}
              {post.author?.isFeatured && (
                <span title="Tác giả nổi bật">👑</span>
              )}
              {post.author?.isVerified && <span title="Đã xác thực">✔️</span>}
            </span>
          </div>

          <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

          <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
            <span>
              {formatDistanceToNow(new Date(post.createdAt), {
                addSuffix: true,
                locale: vi,
              })}
            </span>
            <span>•</span>
            <span>{post.totalViews} lượt xem</span>
            <span>•</span>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1"
              onClick={handleLike}
            >
              <Heart
                className={`w-4 h-4 ${
                  post.likedByCurrentUser ? "fill-red-500 text-red-500" : ""
                }`}
              />
              <span>{post.totalLikes}</span>
            </Button>
          </div>

          {post.coverImage && (
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-64 object-cover rounded-xl mb-6"
            />
          )}

          <div
            className="prose max-w-none [&_pre]:!bg-[#1E1E1E] [&_pre]:!rounded-lg [&_pre]:!p-4 [&_pre]:!shadow-lg [&_pre]:border [&_pre]:border-gray-700 [&_code]:!font-mono [&_code]:!text-sm [&_pre]:!overflow-x-auto [&_pre]:!overflow-y-hidden
            [&_pre_.token.keyword]:!text-[#C586C0]
            [&_pre_.token.function]:!text-[#DCDCAA]
            [&_pre_.token.string]:!text-[#CE9178]
            [&_pre_.token.number]:!text-[#B5CEA8]
            [&_pre_.token.boolean]:!text-[#569CD6]
            [&_pre_.token.comment]:!text-[#6A9955]
            [&_pre_.token.operator]:!text-[#D4D4D4]
            [&_pre_.token.punctuation]:!text-[#D4D4D4]
            [&_pre_.token.property]:!text-[#9CDCFE]
            [&_pre_.token.class-name]:!text-[#4EC9B0]
            [&_pre_.token.regex]:!text-[#D16969]
            [&_pre_.token.important]:!text-[#569CD6]
            [&_pre_.token.variable]:!text-[#9CDCFE]
            [&_pre_.token.constant]:!text-[#4FC1FF]
            [&_pre_.token.symbol]:!text-[#569CD6]
            [&_pre_.token.tag]:!text-[#569CD6]"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="mt-6 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Latest Posts Section */}
          {latestPosts.length > 0 && (
            <div className="mt-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Bài viết mới nhất</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setCurrentLatestPostsPage((prev) => Math.max(0, prev - 1))
                    }
                    disabled={currentLatestPostsPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setCurrentLatestPostsPage((prev) =>
                        Math.min(
                          Math.ceil(
                            latestPosts.filter((p) => p.id !== post.id).length /
                              postsPerPage,
                          ) - 1,
                          prev + 1,
                        ),
                      )
                    }
                    disabled={
                      currentLatestPostsPage >=
                      Math.ceil(
                        latestPosts.filter((p) => p.id !== post.id).length /
                          postsPerPage,
                      ) -
                        1
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6">
                {latestPosts
                  .filter((p) => p.id !== post.id)
                  .slice(
                    currentLatestPostsPage * postsPerPage,
                    (currentLatestPostsPage + 1) * postsPerPage,
                  )
                  .map(renderLatestPost)}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-80 flex-shrink-0 space-y-8">
          {/* Series Posts */}
          {seriesPosts.length > 0 && (
            <div>
              <h3 className="font-semibold mb-4">Các bài viết trong series</h3>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4 pr-4">
                  {seriesPosts.map(renderSidebarPost)}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Recommended Posts */}
          {recommendedPosts.length > 0 && (
            <div>
              <h3 className="font-semibold mb-4">Bài viết phù hợp với bạn</h3>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4 pr-4">
                  {recommendedPosts
                    .filter((p) => p.id !== post.id)
                    .map(renderSidebarPost)}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
