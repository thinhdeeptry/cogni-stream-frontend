"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { format } from "date-fns";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { Post, deletePost, getAllPosts } from "@/actions/postAction";
import { searchPosts } from "@/actions/postAction";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PostsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await getAllPosts();
        // Kiểm tra và đảm bảo posts là một mảng
        if (response.data && Array.isArray(response.data.content)) {
          setPosts(response.data.content);
        } else {
          console.error("Invalid posts data:", response);
          setPosts([]);
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
        toast.error("Không thể tải danh sách bài viết");
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý bài viết</h1>
        <Button onClick={() => router.push("/admin/posts/create")}>
          Tạo bài viết mới
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Series</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Chưa có bài viết nào
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell>
                    <Badge
                      variant={post.isPublished ? "default" : "secondary"}
                      className={post.isPublished ? "bg-green-500" : ""}
                    >
                      {post.isPublished ? "Đã xuất bản" : "Bản nháp"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {post.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{post.seriesTitle || "Không có series"}</TableCell>
                  <TableCell>
                    {new Date(post.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/posts/${post.id}`)}
                      >
                        Xem
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/posts/${post.id}/edit`)
                        }
                      >
                        Sửa
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
