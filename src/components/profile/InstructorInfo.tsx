"use client";

import { useEffect, useState } from "react";

import {
  Award,
  BookOpen,
  Briefcase,
  Calendar,
  GraduationCap,
  Star,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface TeacherProfile {
  userId: string;
  headline?: string;
  bio?: string;
  specialization?: string;
  avgRating: number;
  totalRatings: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
    role: string;
    phone?: string;
    address?: string;
  };
  courses?: Array<{
    id: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    totalStudents: number;
    avgRating: number;
    totalRatings: number;
    isPublished: boolean;
    createdAt: string;
  }>;
  totalStudents?: number;
  totalCourses?: number;
}

interface InstructorInfoProps {
  userId: string;
}

export default function InstructorInfo({ userId }: InstructorInfoProps) {
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeacherProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Import dynamic để tránh top-level await issues
        const { getTeacherProfile } = await import("@/actions/teacherActions");
        const data = await getTeacherProfile(userId);
        setTeacherProfile(data);
      } catch (error) {
        console.error("Error fetching teacher profile:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to fetch teacher profile",
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchTeacherProfile();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <GraduationCap className="h-12 w-12 mx-auto text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-red-900 mb-2">
            Lỗi tải thông tin giảng viên
          </h3>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Thử lại
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!teacherProfile) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <GraduationCap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Không tìm thấy thông tin giảng viên
          </h3>
          <p className="text-gray-500">
            Thông tin hồ sơ giảng viên chưa được thiết lập hoặc không tồn tại.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Thông tin tổng quan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-orange-500" />
            Thông tin giảng viên
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {teacherProfile.headline && (
            <div>
              <h3 className="text-sm font-medium mb-2 text-gray-700">
                Tiêu đề chuyên môn
              </h3>
              <p className="text-gray-900 font-medium">
                {teacherProfile.headline}
              </p>
            </div>
          )}

          {teacherProfile.specialization && (
            <div>
              <h3 className="text-sm font-medium mb-2 text-gray-700">
                Chuyên môn
              </h3>
              <div className="flex flex-wrap gap-2">
                {teacherProfile.specialization
                  .split(",")
                  .map((skill, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-orange-100 text-orange-700"
                    >
                      {skill.trim()}
                    </Badge>
                  ))}
              </div>
            </div>
          )}

          {teacherProfile.bio && (
            <div>
              <h3 className="text-sm font-medium mb-2 text-gray-700">
                Giới thiệu
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {teacherProfile.bio}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Đánh giá và thống kê */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-orange-500" />
            Thành tích & Đánh giá
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Đánh giá trung bình */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Star className="h-5 w-5 text-yellow-500 fill-current" />
                <span className="text-2xl font-bold text-gray-900">
                  {teacherProfile.avgRating.toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-gray-600">Đánh giá trung bình</p>
              <p className="text-xs text-gray-500 mt-1">
                {teacherProfile.totalRatings} đánh giá
              </p>
            </div>

            {/* Số khóa học */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold text-gray-900">
                  {teacherProfile.totalCourses || 0}
                </span>
              </div>
              <p className="text-sm text-gray-600">Khóa học</p>
              <p className="text-xs text-gray-500 mt-1">đã tạo</p>
            </div>

            {/* Số học viên */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Users className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold text-gray-900">
                  {teacherProfile.totalStudents || 0}
                </span>
              </div>
              <p className="text-sm text-gray-600">Học viên</p>
              <p className="text-xs text-gray-500 mt-1">đã đào tạo</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thông tin trạng thái */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-orange-500" />
            Thông tin hệ thống
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-2 text-gray-700">
                Trạng thái
              </h3>
              <Badge
                variant={
                  teacherProfile.status === "ACTIVE" ? "default" : "secondary"
                }
                className={
                  teacherProfile.status === "ACTIVE"
                    ? "bg-green-100 text-green-700"
                    : ""
                }
              >
                {teacherProfile.status === "ACTIVE"
                  ? "Đang hoạt động"
                  : "Không hoạt động"}
              </Badge>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2 text-gray-700">
                Ngày trở thành giảng viên
              </h3>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">
                  {formatDate(teacherProfile.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
