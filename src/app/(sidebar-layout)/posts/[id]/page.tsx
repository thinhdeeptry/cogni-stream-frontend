"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale/vi";
import { Heart } from "lucide-react";
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
  addPostView,
  getPostById,
  togglePostLike,
} from "@/actions/postAction";

import useUserStore from "@/stores/useUserStore";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function getReadingTime(content: string) {
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} phút đọc`;
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
  const [loading, setLoading] = useState(true);

  const fetchPost = async () => {
    try {
      const response = await getPostById(resolvedParams.id, user?.id);
      setPost(response.data);
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
      // Highlight all code blocks after content is loaded
      Prism.highlightAll();
    }
  }, [post?.content]);

  if (loading) {
    return <div>Đang tải...</div>;
  }

  if (!post) {
    return <div>Không tìm thấy bài viết</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
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
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="mt-6 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
