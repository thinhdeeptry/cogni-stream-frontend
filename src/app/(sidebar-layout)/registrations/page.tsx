"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  InstructorRegistration,
  RegistrationStatus,
} from "@/types/instructor/types";
import {
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  Filter,
  RefreshCw,
  Search,
  User,
  XCircle,
} from "lucide-react";

import { getAllInstructorRegistrations } from "@/actions/instructorRegistrationAction";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function InstructorRegistrationsPage() {
  const [data, setData] = useState<InstructorRegistration[]>([]);
  const [filteredData, setFilteredData] = useState<InstructorRegistration[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const router = useRouter();

  const fetchData = async () => {
    try {
      setLoading(true);
      const registrations = await getAllInstructorRegistrations();
      console.log("Fetched registrations:", registrations);
      setData(registrations.data);
      setFilteredData(registrations.data);
    } catch (err) {
      console.error("Fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter and search
  useEffect(() => {
    let filtered = data;

    // Filter by status
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (item) =>
          item.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.user.email.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredData(filtered);
  }, [data, searchTerm, statusFilter]);

  const getStatusBadge = (status: RegistrationStatus) => {
    switch (status) {
      case RegistrationStatus.PENDING:
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Chờ duyệt
          </Badge>
        );
      case RegistrationStatus.APPROVED:
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Đã duyệt
          </Badge>
        );
      case RegistrationStatus.REJECTED:
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Từ chối
          </Badge>
        );
    }
  };

  const getStats = () => {
    const total = data.length;
    const pending = data.filter(
      (item) => item.status === RegistrationStatus.PENDING,
    ).length;
    const approved = data.filter(
      (item) => item.status === RegistrationStatus.APPROVED,
    ).length;
    const rejected = data.filter(
      (item) => item.status === RegistrationStatus.REJECTED,
    ).length;

    return { total, pending, approved, rejected };
  };

  const stats = getStats();

  return (
    <div className="w-full space-y-6 p-6 bg-slate-50">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">
            Quản lý đăng ký giảng viên
          </h1>
          <p className="text-slate-500 text-sm">
            Xem xét và phê duyệt các đơn đăng ký trở thành giảng viên
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Tổng số đơn</p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Chờ duyệt</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pending}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Đã duyệt</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.approved}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Đã từ chối</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.rejected}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Tìm kiếm theo tên, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="min-w-[200px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  <SelectItem value={RegistrationStatus.PENDING}>
                    Chờ duyệt
                  </SelectItem>
                  <SelectItem value={RegistrationStatus.APPROVED}>
                    Đã duyệt
                  </SelectItem>
                  <SelectItem value={RegistrationStatus.REJECTED}>
                    Đã từ chối
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-100/50">
                <TableHead className="text-slate-700">Người đăng ký</TableHead>
                <TableHead className="text-slate-700">Hồ sơ</TableHead>
                <TableHead className="text-slate-700">Portfolio</TableHead>
                <TableHead className="text-slate-700">Trạng thái</TableHead>
                <TableHead className="text-slate-700">Ngày đăng ký</TableHead>
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
                    colSpan={7}
                    className="text-center py-8 text-slate-500"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Đang tải...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-slate-500"
                  >
                    {searchTerm || statusFilter !== "ALL"
                      ? "Không tìm thấy đơn đăng ký phù hợp"
                      : "Chưa có đơn đăng ký nào"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-orange-100 text-orange-600">
                            {item.user.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-900">
                            {item.user.name}
                          </p>
                          <p className="text-sm text-slate-500">
                            {item.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {item.curriculum_vitae_link ? (
                          <div className="flex items-center gap-1">
                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                            <p className="text-sm text-slate-700">Có</p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="inline-block w-2 h-2 bg-gray-300 rounded-full"></span>
                            <p className="text-sm text-slate-500">Chưa có</p>
                          </div>
                        )}
                        {item.qualifications.length > 0 && (
                          <p className="text-xs text-slate-500 mt-1">
                            {item.qualifications.length} chứng chỉ
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {item.portfolio_links.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span className="text-sm">
                            {item.portfolio_links.length} link
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">Chưa có</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-slate-700">
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.submittedAt).toLocaleDateString("vi-VN")}
                      </div>
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
        </CardContent>
      </Card>

      {/* Results info */}
      {!loading && filteredData.length > 0 && (
        <div className="text-sm text-slate-500 text-center">
          Hiển thị {filteredData.length} trong tổng số {data.length} đơn đăng ký
        </div>
      )}
    </div>
  );
}
