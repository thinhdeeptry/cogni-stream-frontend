"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { toast } from "@/hooks/use-toast";
import {
  InstructorRegistration,
  RegistrationStatus,
} from "@/types/instructor/types";
import {
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Shield,
  XCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";

import { getUserInstructorRegistration } from "@/actions/instructorRegistrationAction";

import useUserStore from "@/stores/useUserStore";

import { createGoogleDriveImageProps } from "@/utils/googleDriveUtils";

import { AvatarUpload } from "@/components/auth/avatar-upload";
import { ProfileUpdateForm } from "@/components/auth/profile-update-form";
import InstructorInfo from "@/components/profile/InstructorInfo";
import MyClassesList from "@/components/profile/MyClassesList";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function ProfilePageContent() {
  const { user, clearUser, setUser, hydrated, setHydrated } = useUserStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [instructorRegistration, setInstructorRegistration] =
    useState<InstructorRegistration | null>(null);

  // Handle hydration
  useEffect(() => {
    // Mark the store as hydrated
    setHydrated(true);

    // If we have a session but no user in store, sync them
    if (session?.user && !user && hydrated) {
      if (session.user && session.accessToken) {
        setUser(session.user, session.accessToken as string);
      }
    }

    setIsLoading(false);
  }, [session, user, hydrated, setHydrated, setUser]);

  // Check instructor registration status
  useEffect(() => {
    const checkInstructorRegistration = async () => {
      if (user?.id && user?.role?.toLowerCase() === "student") {
        try {
          const registration = await getUserInstructorRegistration(user.id);
          setInstructorRegistration(registration);
        } catch (error) {
          console.error("Error checking instructor registration:", error);
        }
      }
    };

    if (user?.id) {
      checkInstructorRegistration();
    }
  }, [user?.id, user?.role]);

  // Handle tab from URL parameter
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "classes") {
      setActiveTab("classes");
    } else if (
      tab === "instructor" &&
      user?.role?.toLowerCase() === "instructor"
    ) {
      setActiveTab("instructor");
    } else {
      setActiveTab("profile");
    }
  }, [searchParams, user?.role]);

  // Handle redirection if no user after hydration
  // useEffect(() => {
  //   if (!isLoading && !user && hydrated) {
  //     router.push("/auth/login");
  //   }
  // }, [user, router, isLoading, hydrated]);

  const handleLogout = () => {
    clearUser();
    router.push("/auth/login");
  };

  const handleProfileUpdateSuccess = () => {
    setIsEditDialogOpen(false);
  };

  const handleAvatarUpdateSuccess = () => {
    setIsAvatarDialogOpen(false);
  };

  const getInstructorRegistrationButton = () => {
    // Nếu đã là giảng viên thì không hiển thị gì cả
    if (user?.role?.toLowerCase() === "instructor") {
      return null;
    }

    // Nếu không phải student thì cũng không hiển thị
    if (!user || user.role?.toLowerCase() !== "student") {
      return null;
    }

    if (!instructorRegistration) {
      // Chưa có đơn đăng ký - hiển thị nút đăng ký
      return (
        <div className="mt-2">
          <Button
            variant="outline"
            className="w-full border-orange-500 text-orange-500 hover:bg-orange-50"
            onClick={() => router.push("/instructor/apply")}
          >
            Đăng ký làm giảng viên
          </Button>
        </div>
      );
    }

    // Đã có đơn đăng ký - hiển thị trạng thái
    const getStatusInfo = () => {
      switch (instructorRegistration.status) {
        case RegistrationStatus.PENDING:
          return {
            text: "Đơn đăng ký đang chờ duyệt",
            icon: <Clock className="h-4 w-4" />,
            className: "border-yellow-500 text-yellow-600 bg-yellow-50",
          };
        case RegistrationStatus.APPROVED:
          return {
            text: "Đơn đăng ký đã được duyệt",
            icon: <CheckCircle className="h-4 w-4" />,
            className: "border-green-500 text-green-600 bg-green-50",
          };
        case RegistrationStatus.REJECTED:
          return {
            text: "Đơn đăng ký bị từ chối",
            icon: <XCircle className="h-4 w-4" />,
            className: "border-red-500 text-red-600 bg-red-50",
          };
        default:
          return {
            text: "Trạng thái không xác định",
            icon: <Clock className="h-4 w-4" />,
            className: "border-gray-500 text-gray-600 bg-gray-50",
          };
      }
    };

    const statusInfo = getStatusInfo();

    return (
      <div className="mt-2">
        <Button
          variant="outline"
          className={`w-full cursor-default ${statusInfo.className}`}
          disabled
        >
          <div className="flex items-center gap-2">
            {statusInfo.icon}
            {statusInfo.text}
          </div>
        </Button>
        {instructorRegistration.status === RegistrationStatus.REJECTED &&
          instructorRegistration.rejectionReason && (
            <p className="text-xs text-red-600 mt-1 px-2">
              Lý do: {instructorRegistration.rejectionReason}
            </p>
          )}
        {instructorRegistration.status === RegistrationStatus.REJECTED && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2 border-orange-500 text-orange-500 hover:bg-orange-50"
            onClick={() => router.push("/instructor/apply")}
          >
            Đăng ký lại
          </Button>
        )}
      </div>
    );
  };

  // Show loading state while checking authentication
  if (isLoading || status === "loading" || !hydrated) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  // If no user after loading, redirect (this is a fallback)
  if (!user) {
    return null;
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                {/* <AvatarImage
                  src={user.image || "/default-avatar.png"}
                  alt={user.name}
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.onerror = null;
                    target.src = "/default-avatar.png";
                  }}
                /> */}
                <Image
                  {...createGoogleDriveImageProps(
                    user.image || "/default-avatar.png",
                  )}
                  alt={user.name}
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.onerror = null;
                    target.src = "/default-avatar.png";
                  }}
                  fill
                  className="object-cover w-full h-full"
                />
                <AvatarFallback className="text-2xl">
                  {user.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Dialog
                open={isAvatarDialogOpen}
                onOpenChange={setIsAvatarDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-white"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cập nhật ảnh đại diện</DialogTitle>
                    <DialogDescription>
                      Tải lên ảnh đại diện mới của bạn
                    </DialogDescription>
                  </DialogHeader>
                  <AvatarUpload onSuccess={handleAvatarUpdateSuccess} />
                </DialogContent>
              </Dialog>
            </div>
            <CardTitle className="text-xl font-bold">{user.name}</CardTitle>
            <CardDescription>{user.email}</CardDescription>

            <div className="flex gap-2 mt-2">
              <Badge
                variant={user.isActive ? "default" : "destructive"}
                className="capitalize"
              >
                {user.isActive ? "Đang hoạt động" : "Không hoạt động"}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {user.role?.toLowerCase() === "admin"
                  ? "Quản trị viên"
                  : user.role?.toLowerCase() === "instructor"
                    ? "Giảng viên"
                    : "Học viên"}
              </Badge>
              <Badge variant="secondary" className="capitalize">
                {user.accountType?.toLowerCase() === "google"
                  ? "Google"
                  : user.accountType?.toLowerCase() === "facebook"
                    ? "Facebook"
                    : "Cục bộ"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user.email}</span>
              </div>

              {user.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{user.phone}</span>
                </div>
              )}

              {user.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{user.address}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>
                  Loại tài khoản:{" "}
                  {user.accountType?.toLowerCase() === "google"
                    ? "Google"
                    : user.accountType?.toLowerCase() === "facebook"
                      ? "Facebook"
                      : "Cục bộ"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Ngày tham gia: {formatDate(user.createdAt)}</span>
              </div>

              <Separator className="my-4" />

              <Button
                variant="destructive"
                className="w-full gap-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="md:col-span-2 -mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList
              className={`grid w-full ${user.role?.toLowerCase() === "instructor" ? "grid-cols-3" : "grid-cols-2"}`}
            >
              <TabsTrigger value="profile">Thông tin cá nhân</TabsTrigger>
              <TabsTrigger value="classes">Lớp học của tôi</TabsTrigger>
              {user.role?.toLowerCase() === "instructor" && (
                <TabsTrigger value="instructor">Hồ sơ giảng viên</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="profile" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin cá nhân</CardTitle>
                  <CardDescription>
                    Xem và cập nhật thông tin cá nhân của bạn
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Họ và tên</h3>
                      <div className="p-3 border rounded-md bg-muted/50">
                        {user.name || "Chưa cập nhật"}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">Email</h3>
                      <div className="p-3 border rounded-md bg-muted/50">
                        {user.email}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">
                        Số điện thoại
                      </h3>
                      <div className="p-3 border rounded-md bg-muted/50">
                        {user.phone || "Chưa cập nhật"}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">Địa chỉ</h3>
                      <div className="p-3 border rounded-md bg-muted/50">
                        {user.address || "Chưa cập nhật"}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">Vai trò</h3>
                      <div className="p-3 border rounded-md bg-muted/50">
                        {user.role?.toLowerCase() === "admin"
                          ? "Quản trị viên"
                          : user.role?.toLowerCase() === "teacher"
                            ? "Giảng viên"
                            : "Học viên"}
                      </div>
                    </div>

                    <div className="mt-4">
                      <Dialog
                        open={isEditDialogOpen}
                        onOpenChange={setIsEditDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="default"
                            className="w-full bg-orange-500"
                          >
                            Cập nhật thông tin
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              Cập nhật thông tin cá nhân
                            </DialogTitle>
                            <DialogDescription>
                              Cập nhật thông tin cá nhân của bạn
                            </DialogDescription>
                          </DialogHeader>
                          <ProfileUpdateForm
                            user={user}
                            onSuccess={handleProfileUpdateSuccess}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>

                    {user.accountType?.toLowerCase() === "local" && (
                      <div className="mt-2">
                        <Button variant="outline" className="w-full">
                          Đổi mật khẩu
                        </Button>
                      </div>
                    )}

                    {getInstructorRegistrationButton()}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="classes" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lớp học của tôi</CardTitle>
                  <CardDescription>
                    Danh sách các lớp học trực tiếp mà bạn đã đăng ký
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MyClassesList userId={user.id} />
                </CardContent>
              </Card>
            </TabsContent>

            {user.role?.toLowerCase() === "instructor" && (
              <TabsContent value="instructor" className="mt-6">
                <InstructorInfo userId={user.id} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfilePageContent />
    </Suspense>
  );
}
