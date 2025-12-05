"use client";

import type React from "react";
import { useEffect, useState } from "react";

import { authApi } from "@/lib/api/authApi";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Console } from "console";
import {
  ArrowUpDown,
  ChevronDown,
  Download,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { Toaster, toast } from "sonner";

import { getDashboardData } from "@/actions/authActions";

import useUserStore from "@/stores/useUserStore";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import Loading from "@/components/userLayout/Loading";

interface PaginationInfo {
  current: number;
  pageSize: number;
  total: number;
}

// Define columns for TanStack Table
const columns: ColumnDef<IUser>[] = [
  {
    accessorKey: "id",
    header: "ID Người dùng",
    cell: ({ row }) => <div className="font-medium">{row.getValue("id")}</div>,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Tên
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Vai trò",
  },
  {
    accessorKey: "accountType",
    header: "Loại tài khoản",
  },
  {
    accessorKey: "isActive",
    header: "Trạng thái",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean;

      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {isActive ? "Đã xác thực" : "Chưa xác thực"}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Ngày tạo
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date;
      return <div>{new Date(date).toLocaleString()}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(user.id);
                toast.success("ID đã được sao chép vào bộ nhớ tạm thời");
              }}
            >
              Sao chép ID người dùng
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* <DropdownMenuItem>Xem chi tiết</DropdownMenuItem> */}
            <UpdateUserDialog user={user} />
            {/* <ChangePasswordDialog user={user} /> */}
            <DeleteUserDialog user={user} />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// Add New User Dialog Component
function AddNewUserDialog() {
  const { accessToken } = useUserStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "STUDENT",
    accountType: "standard",
    isActive: true, // Boolean thay vì string
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === "isActive") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "active", // Convert sang boolean
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authApi.createUser(accessToken || "", {
        name: formData.name,
        email: formData.email,
        password: "123456",
        role: formData.role,
        isActive: formData.isActive, // Gửi trực tiếp boolean value
      });
      console.log("check response >>> ", response);
      if (response.error) {
        toast.error(response.message || "Failed to create user");
      } else {
        toast.success("Tạo người dùng thành công");
        setOpen(false);
        // Refresh the user list
        window.location.reload();
      }
    } catch (error) {
      console.error("Tạo người dùng thất bại:", error);
      toast.error("Đã xảy ra lỗi khi tạo người dùng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Thêm người dùng mới
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Thêm người dùng mới</DialogTitle>
          <DialogDescription>
            Tạo tài khoản người dùng mới. Nhấp vào lưu khi bạn đã hoàn thành.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Tên
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Vai trò
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleSelectChange("role", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">HỌC VIÊN</SelectItem>
                  <SelectItem value="INSTRUCTOR">GIẢNG VIÊN</SelectItem>
                  <SelectItem value="ADMIN">QUẢN TRỊ VIÊN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                Trạng thái
              </Label>
              <Select
                value={formData.isActive ? "active" : "inactive"}
                onValueChange={(value) => handleSelectChange("isActive", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Đã xác thực</SelectItem>
                  <SelectItem value="inactive">Chưa xác thực</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Lưu người dùng</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Update User Dialog Component
function UpdateUserDialog({ user }: { user: IUser }) {
  const { accessToken } = useUserStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role, // Giữ nguyên uppercase vì SelectItem values là STUDENT, INSTRUCTOR, ADMIN
    accountType: user.accountType,
    isActive: user.isActive,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === "isActive") {
      setFormData((prev) => ({ ...prev, [name]: value === "active" }));
    } else {
      // Cho tất cả các trường khác (role, accountType) chỉ cần set value trực tiếp
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authApi.updateUser(accessToken || "", user.id, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive, // Gửi trực tiếp boolean value
      });

      if (response.error) {
        toast.error(response.message || "Failed to update user");
      } else {
        toast.success("Cập nhật thông tin người dùng thành công");
        setOpen(false);
        // Refresh the user list
        window.location.reload();
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          Chỉnh sửa thông tin
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin người dùng. Nhấp vào lưu khi bạn đã hoàn thành.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Tên
              </Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email
              </Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-role" className="text-right">
                Vai trò
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleSelectChange("role", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">HỌC VIÊN</SelectItem>
                  <SelectItem value="INSTRUCTOR">GIẢNG VIÊN</SelectItem>
                  <SelectItem value="ADMIN">QUẢN TRỊ VIÊN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-accountType" className="text-right">
                Loại tài khoản
              </Label>
              <Select
                value={formData.accountType}
                onValueChange={(value) =>
                  handleSelectChange("accountType", value)
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Chọn loại tài khoản" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOCAL">LOCAL</SelectItem>
                  <SelectItem value="GOOGLE">GOOGLE</SelectItem>
                  <SelectItem value="GITHUB">GITHUB</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-isActive" className="text-right">
                Trạng thái
              </Label>
              <Select
                value={formData.isActive ? "active" : "inactive"}
                onValueChange={(value) => handleSelectChange("isActive", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Đã xác thực</SelectItem>
                  <SelectItem value="inactive">Chưa xác thực</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Lưu thay đổi</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Add Delete User Dialog Component
// function DeleteUserDialog({ user }: { user: IUser }) {
//   const { accessToken } = useUserStore();
//   const [open, setOpen] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const handleDelete = async () => {
//     setLoading(true);

//     try {
//       const response = await authApi.deleteUser(accessToken, user.id);

//       if (response.error) {
//         toast.error(response.message || "Failed to delete user");
//       } else {
//         toast.success("User deleted successfully");
//         setOpen(false);
//         // Refresh the user list
//         window.location.reload();
//       }
//     } catch (error) {
//       console.error("Error deleting user:", error);
//       toast.error("An unexpected error occurred");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogTrigger asChild>
//         <DropdownMenuItem
//           onSelect={(e) => e.preventDefault()}
//           className="text-red-600"
//         >
//           Delete user
//         </DropdownMenuItem>
//       </DialogTrigger>
//       <DialogContent>
//         <DialogHeader>
//           <DialogTitle>Confirm Deletion</DialogTitle>
//           <DialogDescription>
//             Are you sure you want to delete user {user.name}? This action cannot
//             be undone.
//           </DialogDescription>
//         </DialogHeader>
//         <DialogFooter>
//           <Button
//             variant="outline"
//             onClick={() => setOpen(false)}
//             disabled={loading}
//           >
//             Cancel
//           </Button>
//           <Button
//             variant="destructive"
//             onClick={handleDelete}
//             disabled={loading}
//           >
//             {loading ? "Deleting..." : "Delete"}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }

// Add Change Password Dialog Component
function ChangePasswordDialog({ user }: { user: IUser }) {
  const { accessToken } = useUserStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.changeUserPassword(
        accessToken || "",
        user.id,
        {
          currentPassword: "adminOverride", // Admin override
          newPassword: passwordData.newPassword,
        },
      );

      if (response.error) {
        toast.error(response.message || "Đã xảy ra lỗi khi đổi mật khẩu");
      } else {
        toast.success("Đổi mật khẩu thành công");
        setOpen(false);
        setPasswordData({
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      console.error("Lỗi khi đổi mật khẩu:", error);
      toast.error("Đã xảy ra lỗi khi đổi mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          Đổi mật khẩu
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đổi mật khẩu người dùng</DialogTitle>
          <DialogDescription>
            Đặt mật khẩu mới cho {user.name}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-password" className="text-right">
                Mật khẩu mới
              </Label>
              <Input
                id="new-password"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="confirm-password" className="text-right">
                Xác nhận mật khẩu
              </Label>
              <Input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang thay đổi..." : "Đổi mật khẩu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Delete User Dialog Component
function DeleteUserDialog({ user }: { user: IUser }) {
  const { accessToken } = useUserStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);

    try {
      const response = await authApi.deleteUser(accessToken || "", user.id);

      if (response.error) {
        toast.error(response.message || "Lỗi khi xóa người dùng");
      } else {
        toast.success("Xóa người dùng thành công");
        setOpen(false);
        // Refresh the user list
        window.location.reload();
      }
    } catch (error) {
      console.error("Lỗi khi xóa người dùng", error);
      toast.error("Lỗi khi xóa người dùng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          className="text-red-600"
        >
          Xóa người dùng
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận xóa</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa người dùng {user.name}? Hành động này
            không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Đang xóa..." : "Xóa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function UsersPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = async (
    page: number,
    pageSize: number,
    search: string = "",
  ) => {
    try {
      setLoading(true);
      console.log("fetchUsers", page, pageSize, search);
      const response = await getDashboardData(search, page, pageSize);
      console.log("response", response);
      if (!response.error && response.data) {
        // Users nằm trong response.data.data
        setUsers(response.data.data || []);
        // Pagination info nằm trong response.data.meta (total, page, limit, totalPages)
        const meta = response.data.meta;
        setPagination({
          current: meta?.page || 1,
          pageSize: meta?.limit || pageSize,
          total: meta?.total || 0,
        });
      } else {
        toast.error(response.message || "Failed to fetch users");
        setUsers([]);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("An unexpected error occurred");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, pagination.pageSize);
  }, []);

  // Xử lý tìm kiếm khi người dùng nhập
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    // Reset về trang 1 khi tìm kiếm
    fetchUsers(1, pagination.pageSize, value);
  };

  const table = useReactTable({
    data: users,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex: pagination.current - 1,
        pageSize: pagination.pageSize,
      },
    },
    manualPagination: true,
    pageCount: Math.ceil(pagination.total / pagination.pageSize),
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const newPagination = updater({
          pageIndex: pagination.current - 1,
          pageSize: pagination.pageSize,
        });
        fetchUsers(
          newPagination.pageIndex + 1,
          newPagination.pageSize,
          searchTerm,
        );
      }
    },
  });

  return (
    <div className="w-full -m-5 pt-2 p-6">
      <Toaster richColors position="top-right" />
      <div className="flex flex-col py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Người dùng</h1>
          <div className="flex items-center gap-3">
            <Input
              placeholder="Tìm kiếm người dùng..."
              value={searchTerm}
              onChange={(event) => handleSearch(event.target.value)}
              className="max-w-sm"
            />
            <AddNewUserDialog />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Cột <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Hiển thị {pagination.pageSize * (pagination.current - 1) + 1} đến{" "}
              {Math.min(
                pagination.pageSize * pagination.current,
                pagination.total,
              )}{" "}
              trong tổng số {pagination.total} người dùng
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loading isLoading={loading} />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Không có kết quả.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">Dòng mỗi trang</p>
          <Select
            value={String(pagination.pageSize)}
            onValueChange={(value) => {
              const newPageSize = Number(value);
              // Reset về trang 1 khi thay đổi pageSize và fetch data mới
              fetchUsers(1, newPageSize, searchTerm);
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={String(pageSize)}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-center text-sm font-medium">
          Trang {pagination.current} của{" "}
          {Math.ceil(pagination.total / pagination.pageSize) || 1}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (pagination.current > 1) {
              fetchUsers(
                pagination.current - 1,
                pagination.pageSize,
                searchTerm,
              );
            }
          }}
          disabled={pagination.current <= 1}
        >
          Trước
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const totalPages = Math.ceil(
              pagination.total / pagination.pageSize,
            );
            if (pagination.current < totalPages) {
              console.log("pagination.current", pagination.current);
              console.log("totalPages", totalPages);
              fetchUsers(
                pagination.current + 1,
                pagination.pageSize,
                searchTerm,
              );
            }
          }}
          disabled={
            pagination.current >=
            Math.ceil(pagination.total / pagination.pageSize)
          }
        >
          Tiếp
        </Button>
      </div>
    </div>
  );
}
