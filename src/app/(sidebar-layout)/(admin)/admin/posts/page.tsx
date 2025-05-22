"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { format } from "date-fns";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { Post, deletePost, getPostsByUserId } from "@/actions/postAction";

import useUserStore from "@/stores/useUserStore";

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
  const [posts, setPosts] = useState<Post[]>([]);
  const { user } = useUserStore();

  useEffect(() => {
    const fetchPosts = async () => {
      if (!user?.id) {
        toast.error("Vui lòng đăng nhập để xem bài viết");
        setLoading(false);
        return;
      }

      try {
        const response = await getPostsByUserId(user.id, {
          page: 0,
          size: 10,
          sortBy: "createdAt",
          sortDir: "desc",
        });

        if (response?.data?.content) {
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
  }, [user?.id]);

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Đang tải...</div>
      </div>
    );
  }

  const handleDeletePost = async (postId: string) => {
    if (!user?.id) {
      toast.error("Vui lòng đăng nhập để xóa bài viết");
      return;
    }

    if (window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) {
      try {
        await deletePost(postId, user.id);
        toast.success("Xóa bài viết thành công");
        setPosts(posts.filter((p) => p.id !== postId));
      } catch (error) {
        toast.error("Không thể xóa bài viết");
      }
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý bài viết</h1>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/series")}
          >
            Quản lý Series
          </Button>
          <Button onClick={() => router.push("/admin/posts/create")}>
            Tạo bài viết mới
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <Input
              placeholder="Tìm kiếm bài viết..."
              className="max-w-sm"
              // TODO: Implement search
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Series</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Không có bài viết nào
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell>{post.seriesTitle || "Không có series"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {post.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(post.createdAt), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={post.isPublished ? "default" : "secondary"}>
                      {post.isPublished ? "Đã xuất bản" : "Bản nháp"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/posts/${post.id}`)}
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
                        Chỉnh sửa
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        Xóa
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
