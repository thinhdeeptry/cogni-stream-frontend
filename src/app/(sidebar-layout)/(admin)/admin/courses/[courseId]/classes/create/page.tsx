"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useToast } from "@/hooks/use-toast";
import {
  Course,
  CreateClassFormData,
  CustomSchedule,
  WeeklySchedule,
} from "@/types/course/types";
import { motion } from "framer-motion";
import {
  Calendar,
  ChevronLeft,
  Clock,
  Plus,
  Trash,
  Users,
  Video,
} from "lucide-react";

import { createClass } from "@/actions/classActions";
import { getCourseById } from "@/actions/courseAction";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export default function CreateClassPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);

  const [classData, setClassData] = useState<CreateClassFormData>({
    courseId: courseId,
    name: "",
    description: "",
    maxStudents: 20,
    startDate: "",
    endDate: "",
    meetingUrl: "",
    scheduleType: "WEEKLY",
    weeklySchedule: [
      {
        dayOfWeek: 1, // Thứ 2
        startTime: "19:00",
        durationMinutes: 120, // 2 tiếng
      },
    ],
    customSchedule: [],
    timezone: "Asia/Ho_Chi_Minh",
  });

  // Fetch course info
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const courseData = await getCourseById(courseId);
        setCourse(courseData);
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin khóa học",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCourse(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId, toast]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    if (name === "maxStudents") {
      const numValue = parseInt(value) || 0;
      if (numValue >= 1 && numValue <= 1000) {
        setClassData((prev) => ({ ...prev, [name]: numValue }));
      }
    } else {
      setClassData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setClassData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle weekly schedule
  const updateWeeklySchedule = (
    index: number,
    field: keyof WeeklySchedule,
    value: any,
  ) => {
    setClassData((prev) => {
      const newSchedule = [...prev.weeklySchedule!];
      newSchedule[index] = { ...newSchedule[index], [field]: value };
      return { ...prev, weeklySchedule: newSchedule };
    });
  };

  const addWeeklySchedule = () => {
    setClassData((prev) => ({
      ...prev,
      weeklySchedule: [
        ...prev.weeklySchedule!,
        { dayOfWeek: 1, startTime: "19:00", durationMinutes: 120 },
      ],
    }));
  };

  const removeWeeklySchedule = (index: number) => {
    setClassData((prev) => ({
      ...prev,
      weeklySchedule: prev.weeklySchedule!.filter((_, i) => i !== index),
    }));
  };

  // Handle custom schedule
  const updateCustomSchedule = (
    index: number,
    field: keyof CustomSchedule,
    value: any,
  ) => {
    setClassData((prev) => {
      const newSchedule = [...prev.customSchedule!];
      newSchedule[index] = { ...newSchedule[index], [field]: value };
      return { ...prev, customSchedule: newSchedule };
    });
  };

  const addCustomSchedule = () => {
    setClassData((prev) => ({
      ...prev,
      customSchedule: [
        ...prev.customSchedule!,
        { date: "", startTime: "19:00", durationMinutes: 120, topic: "" },
      ],
    }));
  };

  const removeCustomSchedule = (index: number) => {
    setClassData((prev) => ({
      ...prev,
      customSchedule: prev.customSchedule!.filter((_, i) => i !== index),
    }));
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

    if (
      classData.scheduleType === "WEEKLY" &&
      classData.weeklySchedule!.length === 0
    ) {
      toast({
        title: "Lỗi",
        description: "Vui lòng thêm ít nhất một lịch học hàng tuần",
        variant: "destructive",
      });
      return;
    }

    if (
      classData.scheduleType === "CUSTOM" &&
      classData.customSchedule!.length === 0
    ) {
      toast({
        title: "Lỗi",
        description: "Vui lòng thêm ít nhất một buổi học",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createClass(classData);

      if (result.success) {
        toast({
          title: "Thành công",
          description: "Tạo lớp học thành công",
        });
        router.push(`/admin/courses/${courseId}`);
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
        description: "Đã có lỗi xảy ra khi tạo lớp học",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const dayOfWeekNames = [
    "Chủ nhật",
    "Thứ 2",
    "Thứ 3",
    "Thứ 4",
    "Thứ 5",
    "Thứ 6",
    "Thứ 7",
  ];

  if (isLoadingCourse) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg">Đang tải...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-lg font-medium text-gray-600 mb-4">
          Không tìm thấy khóa học
        </div>
        <Link href="/admin/courses">
          <Button variant="outline">Quay lại danh sách khóa học</Button>
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
            <Link href={`/admin/courses/${courseId}`}>
              <Button variant="outline" size="icon" className="rounded-full">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Tạo lớp học mới</h1>
              <p className="text-gray-600">Khóa học: {course.title}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/admin/courses/${courseId}`)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang tạo..." : "Tạo lớp học"}
            </Button>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content column */}
          <div className="lg:col-span-2 space-y-8">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                    <Label htmlFor="timezone" className="text-gray-700">
                      Múi giờ
                    </Label>
                    <Select
                      value={classData.timezone}
                      onValueChange={(value) =>
                        handleSelectChange("timezone", value)
                      }
                    >
                      <SelectTrigger className="border-gray-300 focus:ring-orange-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Ho_Chi_Minh">
                          Việt Nam (UTC+7)
                        </SelectItem>
                        <SelectItem value="Asia/Bangkok">
                          Thailand (UTC+7)
                        </SelectItem>
                        <SelectItem value="Asia/Singapore">
                          Singapore (UTC+8)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Card */}
            <Card className="shadow-sm border-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Lịch học
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <Label htmlFor="startDate" className="text-gray-700">
                      Ngày bắt đầu <span className="text-red-500">*</span>
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
                      Ngày kết thúc (tùy chọn)
                    </Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={classData.endDate}
                      onChange={handleInputChange}
                      className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-gray-700">
                    Loại lịch học <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={classData.scheduleType}
                    onValueChange={(value) =>
                      handleSelectChange("scheduleType", value)
                    }
                  >
                    <SelectTrigger className="border-gray-300 focus:ring-orange-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEEKLY">
                        Hàng tuần - Lặp lại theo thứ trong tuần
                      </SelectItem>
                      <SelectItem value="CUSTOM">
                        Tùy chỉnh - Chọn từng ngày cụ thể
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Weekly Schedule */}
                {classData.scheduleType === "WEEKLY" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-800">
                        Lịch học hàng tuần
                      </h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addWeeklySchedule}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm buổi học
                      </Button>
                    </div>

                    {classData.weeklySchedule?.map((schedule, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-4 gap-3 items-end p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="space-y-2">
                          <Label className="text-sm">Thứ</Label>
                          <Select
                            value={schedule.dayOfWeek.toString()}
                            onValueChange={(value) =>
                              updateWeeklySchedule(
                                index,
                                "dayOfWeek",
                                parseInt(value),
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {dayOfWeekNames.map((day, dayIndex) => (
                                <SelectItem
                                  key={dayIndex}
                                  value={dayIndex.toString()}
                                >
                                  {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm">Giờ bắt đầu</Label>
                          <Input
                            type="time"
                            value={schedule.startTime}
                            onChange={(e) =>
                              updateWeeklySchedule(
                                index,
                                "startTime",
                                e.target.value,
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm">Thời lượng (phút)</Label>
                          <Input
                            type="number"
                            min="30"
                            max="480"
                            step="30"
                            value={schedule.durationMinutes}
                            onChange={(e) =>
                              updateWeeklySchedule(
                                index,
                                "durationMinutes",
                                parseInt(e.target.value) || 120,
                              )
                            }
                          />
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWeeklySchedule(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Custom Schedule */}
                {classData.scheduleType === "CUSTOM" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-800">
                        Lịch học tùy chỉnh
                      </h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addCustomSchedule}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm buổi học
                      </Button>
                    </div>

                    {classData.customSchedule?.map((schedule, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-5 gap-3 items-end p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="space-y-2">
                          <Label className="text-sm">Ngày</Label>
                          <Input
                            type="date"
                            value={schedule.date}
                            onChange={(e) =>
                              updateCustomSchedule(
                                index,
                                "date",
                                e.target.value,
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm">Giờ bắt đầu</Label>
                          <Input
                            type="time"
                            value={schedule.startTime}
                            onChange={(e) =>
                              updateCustomSchedule(
                                index,
                                "startTime",
                                e.target.value,
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm">Thời lượng (phút)</Label>
                          <Input
                            type="number"
                            min="30"
                            max="480"
                            step="30"
                            value={schedule.durationMinutes}
                            onChange={(e) =>
                              updateCustomSchedule(
                                index,
                                "durationMinutes",
                                parseInt(e.target.value) || 120,
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm">Chủ đề</Label>
                          <Input
                            placeholder="Chủ đề buổi học"
                            value={schedule.topic || ""}
                            onChange={(e) =>
                              updateCustomSchedule(
                                index,
                                "topic",
                                e.target.value,
                              )
                            }
                          />
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCustomSchedule(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar column */}
          <div className="space-y-8">
            {/* Meeting Info Card */}
            <Card className="shadow-sm border-none sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Thông tin họp
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="meetingUrl" className="text-gray-700">
                    Link họp trực tuyến
                  </Label>
                  <Input
                    id="meetingUrl"
                    name="meetingUrl"
                    type="url"
                    value={classData.meetingUrl}
                    onChange={handleInputChange}
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    placeholder="https://meet.google.com/..."
                  />
                  <p className="text-xs text-gray-500">
                    Link Google Meet, Zoom hoặc nền tảng khác
                  </p>
                </div>

                <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">
                    💡 Hướng dẫn
                  </h3>
                  <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
                    <li>Tạo link họp trước khi tạo lớp</li>
                    <li>Kiểm tra quyền truy cập cho học viên</li>
                    <li>Chuẩn bị camera và micro trước buổi học</li>
                    <li>Có thể cập nhật link sau khi tạo lớp</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Preview Card */}
            <Card className="shadow-sm border-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium text-gray-800">
                  Xem trước lớp học
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <span className="font-medium">Tên:</span>{" "}
                  {classData.name || "Chưa đặt tên"}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Sức chứa:</span>{" "}
                  {classData.maxStudents} học viên
                </div>
                <div className="text-sm">
                  <span className="font-medium">Bắt đầu:</span>{" "}
                  {classData.startDate || "Chưa chọn"}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Lịch học:</span>{" "}
                  {classData.scheduleType === "WEEKLY"
                    ? `${classData.weeklySchedule?.length || 0} buổi/tuần`
                    : `${classData.customSchedule?.length || 0} buổi`}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
