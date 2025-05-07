"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { format } from "date-fns";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { Series, deleteSeries, getAllSeries } from "@/actions/seriesAction";
import { searchSeries } from "@/actions/seriesAction";

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

export default function SeriesPage() {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const fetchSeries = async () => {
    try {
      setLoading(true);
      const response = await getAllSeries({
        page: 1,
        size: 10,
        sortBy: "createdAt",
        sortDir: "desc",
      });
      setSeries(response.data);
    } catch (error) {
      toast.error("Không thể tải danh sách series");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchSeries();
      return;
    }

    try {
      setLoading(true);
      const response = await searchSeries(searchQuery, {
        page: 1,
        size: 10,
      });
      setSeries(response.data);
    } catch (error) {
      toast.error("Không thể tìm kiếm series");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (seriesId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa series này?")) return;

    try {
      const response = await deleteSeries(seriesId, "current-user-id"); // Replace with actual user ID
      if (response.success) {
        toast.success(response.message);
        fetchSeries();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Không thể xóa series");
    }
  };

  useEffect(() => {
    fetchSeries();
  }, []);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý series</h1>
        <Button onClick={() => router.push("/admin/series/create")}>
          Tạo series mới
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Input
            placeholder="Tìm kiếm series..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Search
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
            onClick={handleSearch}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Số bài viết</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : series.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Không có series nào
                </TableCell>
              </TableRow>
            ) : (
              series.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.title}</TableCell>
                  <TableCell>
                    <Badge
                      variant={s.isPublished ? "default" : "secondary"}
                      className={s.isPublished ? "bg-green-500" : ""}
                    >
                      {s.isPublished ? "Đã xuất bản" : "Bản nháp"}
                    </Badge>
                  </TableCell>
                  <TableCell>{s.posts.length}</TableCell>
                  <TableCell>
                    {format(new Date(s.createdAt), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/series/${s.id}`)}
                      >
                        Xem
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/series/${s.id}/edit`)
                        }
                      >
                        Sửa
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(s.id)}
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
