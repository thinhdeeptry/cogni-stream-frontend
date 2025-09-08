"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { toast } from "@/hooks/use-toast";
import { BookOpen, Calendar, Clock, GraduationCap, Video } from "lucide-react";

import { getMyClasses } from "@/actions/enrollmentActions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface EnrollmentData {
  id: string;
  progress: number;
  isCompleted: boolean;
  updatedAt: string;
  createdAt: string;
  type: "STREAM" | "ONLINE";
  class?: {
    id: string;
    name: string;
    description?: string;
    status: string;
    startDate?: string;
    endDate?: string;
    course: {
      id: string;
      title: string;
      thumbnailUrl: string;
      description?: string;
    };
  };
  course?: {
    id: string;
    title: string;
    thumbnailUrl: string;
    description?: string;
  };
}

interface MyClassesListProps {
  userId: string;
}

export default function MyClassesList({ userId }: MyClassesListProps) {
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchMyClasses = async () => {
      try {
        setLoading(true);
        const result = await getMyClasses(userId);
        console.log("res: ", result);

        if (result.success && result.data) {
          // API trả về { data: { data: [...] } }, nên cần lấy result.data.data
          const classesData = result.data.data || result.data || [];
          setEnrollments(
            Array.isArray(classesData.data) ? classesData.data : [],
          );
        } else {
          toast({
            title: "Lỗi",
            description: result.message || "Không thể tải dữ liệu",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching my classes:", error);
        toast({
          title: "Lỗi",
          description: "Có lỗi xảy ra khi tải dữ liệu",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchMyClasses();
    }
  }, [userId]);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      return "Vừa học";
    } else if (diffInHours < 24) {
      return `${diffInHours} giờ trước`;
    } else if (diffInDays < 7) {
      return `${diffInDays} ngày trước`;
    } else {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} tuần trước`;
    }
  };

  const handleViewCourse = (courseId: string, type: string) => {
    if (type === "class") {
      router.push(`/course/${courseId}`);
    } else {
      router.push(`/course/${courseId}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-t-lg"></div>
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Chưa có lớp hoặc khóa học
          </h3>
          <p className="text-muted-foreground mb-4">
            Bạn chưa tham gia lớp học trực tiếp nào. Khám phá các khóa học để
            bắt đầu!
          </p>
          <Button onClick={() => router.push("/courses")}>
            Khám phá khóa học
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {enrollments.map((enrollment) => {
        const courseData = enrollment.class?.course || enrollment.course;
        const isClass = !!enrollment.class;

        return (
          <Card
            key={enrollment.id}
            className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() =>
              handleViewCourse(
                courseData?.id || "",
                isClass ? "class" : "course",
              )
            }
          >
            <div className="relative">
              <img
                src={courseData?.thumbnailUrl || "/default-course.jpg"}
                alt={courseData?.title || "Course"}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/default-course.jpg";
                }}
              />
              <div className="absolute top-3 right-3">
                <Badge
                  variant={isClass ? "default" : "secondary"}
                  className="text-xs"
                >
                  {isClass ? (
                    <>
                      <Video className="w-3 h-3 mr-1" />
                      Lớp học
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-3 h-3 mr-1" />
                      Tự học
                    </>
                  )}
                </Badge>
              </div>
              {enrollment.isCompleted && (
                <div className="absolute top-3 left-3">
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    <GraduationCap className="w-3 h-3 mr-1" />
                    Hoàn thành
                  </Badge>
                </div>
              )}
            </div>

            <CardHeader className="pb-3">
              <h4 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                {courseData?.title}
              </h4>
              {isClass && enrollment.class && (
                <p className="text-sm text-muted-foreground">
                  Lớp: {enrollment.class.name}
                </p>
              )}
            </CardHeader>

            <CardContent className="pt-0 space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Tiến độ</span>
                  <span className="font-medium">{enrollment.progress}%</span>
                </div>
                <Progress value={enrollment.progress} className="h-2" />
              </div>

              {/* Last Activity */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Học lần cuối: {formatTimeAgo(enrollment.updatedAt)}</span>
              </div>

              {/* Class specific info */}
              {isClass && enrollment.class?.startDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Bắt đầu:{" "}
                    {new Date(enrollment.class.startDate).toLocaleDateString(
                      "vi-VN",
                    )}
                  </span>
                </div>
              )}

              {/* Status Badge */}
              <div className="flex justify-between items-center">
                <Badge
                  variant={enrollment.isCompleted ? "default" : "outline"}
                  className={
                    enrollment.isCompleted ? "bg-green-100 text-green-800" : ""
                  }
                >
                  {enrollment.isCompleted ? "Đã hoàn thành" : "Đang học"}
                </Badge>
                {isClass && enrollment.class && (
                  <Badge variant="secondary" className="text-xs">
                    {enrollment.class.status}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
