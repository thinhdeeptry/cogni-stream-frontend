"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { useToast } from "@/hooks/use-toast";
import { Class, Course } from "@/types/course/types";
import { motion } from "framer-motion";
import { Calendar, ChevronLeft, Clock, Plus, Trash, Users } from "lucide-react";

import { getClassById, updateClass } from "@/actions/classActions";
import { getCourseById } from "@/actions/courseAction";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export default function EditClassPage({
  params,
}: {
  params: Promise<{ courseId: string; classId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [originalClass, setOriginalClass] = useState<Class | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [classData, setClassData] = useState({
    name: "",
    description: "",
    maxStudents: 20,
    startDate: "",
    endDate: "",
    isPublished: false,
    schedules: [
      {
        name: "",
        startDate: "",
        endDate: "",
        days: [] as string[],
        startTime: "",
        endTime: "",
      },
    ],
  });

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const [courseData, classInfo] = await Promise.all([
          getCourseById(resolvedParams.courseId),
          getClassById(resolvedParams.classId),
        ]);

        setCourse(courseData);
        setOriginalClass(classInfo);

        // Convert API response to form format
        setClassData({
          name: classInfo.name,
          description: classInfo.description || "",
          maxStudents: classInfo.maxStudents,
          startDate: classInfo.startDate,
          endDate: classInfo.endDate || "",
          isPublished: classInfo.isPublished,
          schedules: classInfo.schedules?.map((schedule) => ({
            name: schedule.name || "",
            startDate: schedule.startDate,
            endDate: schedule.endDate,
            days: schedule.days.map((day) => day.toLowerCase()),
            startTime: schedule.startTime,
            endTime: schedule.startTime, // API chỉ có startTime, cần fix
          })) || [
            {
              name: "",
              startDate: "",
              endDate: "",
              days: [],
              startTime: "",
              endTime: "",
            },
          ],
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin lớp học",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.courseId, resolvedParams.classId, toast]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    if (name === "maxStudents") {
      const numValue = parseInt(value) || 0;
      if (numValue >= 1 && numValue <= 1000) {
        setClassData((prev) => ({ ...prev, [name]: numValue }));
      }
    } else if (name === "startDate" || name === "endDate") {
      setClassData((prev) => {
        if (name === "startDate" && prev.endDate && value > prev.endDate) {
          toast({
            title: "Lỗi ngày",
            description: "Ngày bắt đầu lớp không thể sau ngày kết thúc lớp",
            variant: "destructive",
          });
          return prev;
        }

        if (name === "endDate" && prev.startDate && value < prev.startDate) {
          toast({
            title: "Lỗi ngày",
            description: "Ngày kết thúc lớp không thể trước ngày bắt đầu lớp",
            variant: "destructive",
          });
          return prev;
        }

        return { ...prev, [name]: value };
      });
    } else {
      setClassData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!classData.name || !classData.startDate) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert schedules to API format
      const schedulesForApi = classData.schedules.map((schedule) => {
        const formattedDays = schedule.days.map(
          (day) => day.charAt(0).toUpperCase() + day.slice(1).toLowerCase(),
        );

        return {
          name: schedule.name || "", // Ensure 'name' is included
          days: formattedDays,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          startDate: schedule.startDate,
          endDate: schedule.endDate,
        };
      });

      const payload = {
        name: classData.name,
        description: classData.description,
        maxStudents: classData.maxStudents,
        startDate: classData.startDate,
        endDate: classData.endDate,
        isPublished: classData.isPublished,
        schedules: schedulesForApi,
      };

      const result = await updateClass(resolvedParams.classId, payload);

      if (result.success) {
        toast({
          title: "Thành công",
          description: "Cập nhật lớp học thành công",
        });
        router.push(
          `/admin/courses/${resolvedParams.courseId}/classes/${resolvedParams.classId}`,
        );
      } else {
        toast({
          title: "Lỗi",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Đã có lỗi xảy ra khi cập nhật lớp học",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin border-2 border-orange-500 border-t-transparent rounded-full" />
          <p className="text-slate-500">Đang tải thông tin lớp học...</p>
        </div>
      </div>
    );
  }

  if (!course || !originalClass) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-4">
        <div className="text-slate-500 text-center">
          <p className="text-lg font-semibold">Không tìm thấy lớp học</p>
          <p className="text-sm">
            Lớp học này có thể đã bị xóa hoặc không tồn tại
          </p>
        </div>
        <Link href={`/admin/courses/${resolvedParams.courseId}`}>
          <Button variant="outline" className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Quay lại khóa học
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full h-full mx-auto py-6"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <Link
              href={`/admin/courses/${resolvedParams.courseId}/classes/${resolvedParams.classId}`}
            >
              <Button variant="outline" size="icon" className="rounded-full">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Chỉnh sửa lớp học</h1>
              <p className="text-gray-600">
                Khóa học: {course.title} - Lớp: {originalClass.name}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                router.push(
                  `/admin/courses/${resolvedParams.courseId}/classes/${resolvedParams.classId}`,
                )
              }
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang cập nhật..." : "Cập nhật lớp học"}
            </Button>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Basic Info Card */}
          <Card className="shadow-sm border-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-gray-700">
                  Tên lớp học <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={classData.name}
                  onChange={handleInputChange}
                  required
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  placeholder="VD: Lớp K1 buổi tối, Lớp cuối tuần..."
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="text-gray-700">
                  Mô tả lớp học
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={classData.description}
                  onChange={handleInputChange}
                  className="min-h-[100px] border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  placeholder="Mô tả chi tiết về lớp học này..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="maxStudents" className="text-gray-700">
                    Số học viên tối đa
                  </Label>
                  <Input
                    id="maxStudents"
                    name="maxStudents"
                    type="number"
                    min="1"
                    max="1000"
                    value={classData.maxStudents}
                    onChange={handleInputChange}
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-gray-700">Học viên hiện tại</Label>
                  <div className="p-2 bg-gray-50 rounded border">
                    <span className="text-lg font-semibold text-blue-600">
                      {originalClass.currentStudents}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">học viên</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-gray-700">Trạng thái lớp học</Label>
                    <p className="text-sm text-gray-500">
                      {classData.isPublished
                        ? "Lớp học sẽ được mở và học viên có thể đăng ký"
                        : "Lớp học sẽ ở trạng thái nháp, chưa mở đăng ký"}
                    </p>
                  </div>
                  <Switch
                    checked={classData.isPublished}
                    onCheckedChange={(checked) =>
                      setClassData((prev) => ({
                        ...prev,
                        isPublished: checked,
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Class Duration */}
          <Card className="shadow-sm border-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Thời gian lớp học
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <Label htmlFor="startDate" className="text-gray-700">
                    Ngày bắt đầu lớp <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={classData.startDate}
                    onChange={handleInputChange}
                    required
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="endDate" className="text-gray-700">
                    Ngày kết thúc lớp (tùy chọn)
                  </Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={classData.endDate}
                    min={classData.startDate || undefined}
                    onChange={handleInputChange}
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Info (Read-only for now) */}
          <Card className="shadow-sm border-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Lịch học hiện tại
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 mb-4">
                💡 Để thay đổi lịch học, vui lòng liên hệ quản trị viên hệ
                thống.
              </div>
              {originalClass.schedules && originalClass.schedules.length > 0 ? (
                <div className="space-y-3">
                  {originalClass.schedules.map((schedule, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      {schedule.name && (
                        <p className="font-medium text-gray-800 mb-2">
                          {schedule.name}
                        </p>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">
                            Thời gian:
                          </span>
                          <p className="text-gray-600">{schedule.startTime}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Thời gian:
                          </span>
                          <p className="text-gray-600">
                            {schedule.startDate} - {schedule.endDate}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Ngày trong tuần:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {schedule.days.map((day) => (
                              <span
                                key={day}
                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                              >
                                {day === "Monday"
                                  ? "T2"
                                  : day === "Tuesday"
                                    ? "T3"
                                    : day === "Wednesday"
                                      ? "T4"
                                      : day === "Thursday"
                                        ? "T5"
                                        : day === "Friday"
                                          ? "T6"
                                          : day === "Saturday"
                                            ? "T7"
                                            : day === "Sunday"
                                              ? "CN"
                                              : day}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Chưa có lịch học được thiết lập</p>
              )}
            </CardContent>
          </Card>
        </div>
      </form>
    </motion.div>
  );
}
