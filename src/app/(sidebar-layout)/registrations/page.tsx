"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { InstructorRegistration } from "@/types/instructor/types";
import { Eye } from "lucide-react";

import { getAllInstructorRegistrations } from "@/actions/instructorRegistrationAction";

import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function InstructorListPage() {
  const [data, setData] = useState<InstructorRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const router = useRouter();

  const fetchData = async (page = pagination.page) => {
    try {
      setLoading(true);
      const registrations = await getAllInstructorRegistrations();
      setData(registrations);

      // Giả sử chưa có API phân trang, mình set tạm
      setPagination({
        page,
        limit: 10,
        total: registrations.length,
        totalPages: Math.ceil(registrations.length / 10),
      });
    } catch (err) {
      console.error("Fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    fetchData(page);
  };

  return (
    <div className="w-full space-y-6 p-6 bg-slate-50">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">
            Quản lý đăng ký giảng viên
          </h1>
          <p className="text-slate-500 text-sm">
            Danh sách các đăng ký trở thành giảng viên trên hệ thống
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-100/50">
              <TableHead className="text-slate-700">ID</TableHead>
              <TableHead className="text-slate-700">Tên</TableHead>
              <TableHead className="text-slate-700">Tiêu đề</TableHead>
              <TableHead className="text-slate-700">Trạng thái</TableHead>
              <TableHead className="text-slate-700">Người duyệt</TableHead>
              <TableHead className="text-right text-slate-700">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-slate-500"
                >
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-slate-500"
                >
                  Không có đăng ký nào
                </TableCell>
              </TableRow>
            ) : (
              data
                .slice(
                  (pagination.page - 1) * pagination.limit,
                  pagination.page * pagination.limit,
                )
                .map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium text-slate-900">
                      {item.id}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {item.user.name}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {item.headline ?? "-"}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {item.status}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {item.reviewer?.name ?? "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="icon"
                        className="hover:bg-slate-100 border-slate-200"
                        onClick={() => router.push(`/registrations/${item.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && data.length > 0 && (
        <div className="mt-6 flex flex-col items-center">
          <Pagination className="mb-2">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(pagination.page - 1)}
                  className={`${
                    pagination.page <= 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer hover:bg-slate-100"
                  } border-slate-200`}
                />
              </PaginationItem>

              {Array.from(
                { length: Math.max(1, pagination.totalPages) },
                (_, i) => i + 1,
              )
                .filter(
                  (page) =>
                    page === 1 ||
                    page === pagination.totalPages ||
                    Math.abs(page - pagination.page) <= 1,
                )
                .map((page, index, array) => {
                  const prevPage = array[index - 1];
                  const showEllipsisBefore = prevPage && prevPage !== page - 1;

                  return (
                    <span key={page}>
                      {showEllipsisBefore && (
                        <PaginationItem>
                          <PaginationEllipsis className="text-slate-400" />
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink
                          isActive={page === pagination.page}
                          onClick={() => handlePageChange(page)}
                          className={`cursor-pointer ${
                            page === pagination.page
                              ? "bg-orange-500 text-white hover:bg-orange-600"
                              : "hover:bg-slate-100 border-slate-200"
                          }`}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    </span>
                  );
                })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(pagination.page + 1)}
                  className={`${
                    pagination.page >= pagination.totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer hover:bg-slate-100"
                  } border-slate-200`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
