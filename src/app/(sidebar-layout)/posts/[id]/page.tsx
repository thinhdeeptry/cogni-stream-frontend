"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale/vi";

import { getPostById } from "@/actions/postAction";

import { Badge } from "@/components/ui/badge";

function getReadingTime(content: string) {
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} phút đọc`;
}

interface PostDetailPageProps {
  params: { id: string };
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const response = await getPostById(params.id);
        setPost((response as any).data || response);
      } catch (error) {
        setPost(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 text-center">Đang tải...</div>
    );
  }
  if (!post) {
    return (
      <div className="container mx-auto py-8 text-center">
        Không tìm thấy bài viết
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <img
          src={post.author?.avatar || "/default-avatar.png"}
          alt={post.author?.name}
          className="w-12 h-12 rounded-full border"
        />
        <div>
          <div className="font-semibold flex items-center gap-1">
            {post.author?.name}
            {post.author?.isFeatured && <span title="Tác giả nổi bật">👑</span>}
            {post.author?.isVerified && <span title="Đã xác thực">✔️</span>}
          </div>
          <div className="text-sm text-gray-500 flex gap-2 items-center">
            {formatDistanceToNow(new Date(post.createdAt), {
              addSuffix: true,
              locale: vi,
            })}
            <span>•</span>
            <span>{getReadingTime(post.content)}</span>
          </div>
        </div>
      </div>
      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
      {post.coverImage && (
        <img
          src={post.coverImage}
          alt={post.title}
          className="w-full h-64 object-cover rounded-xl mb-6"
        />
      )}
      <div className="flex gap-2 mb-6 flex-wrap">
        {post.tags &&
          post.tags.map((tag: string) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
      </div>
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </div>
  );
}
