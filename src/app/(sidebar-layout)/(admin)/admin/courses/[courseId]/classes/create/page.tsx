"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useToast } from "@/hooks/use-toast";
import { Course } from "@/types/course/types";
import { motion } from "framer-motion";
import { Calendar, ChevronLeft, Clock, Plus, Trash, Users } from "lucide-react";

import { createClass } from "@/actions/classActions";
import { getCourseById } from "@/actions/courseAction";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const [classData, setClassData] = useState({
    courseId: courseId,
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
    } else if (name === "startDate" || name === "endDate") {
      // Validate class date constraints
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

        // Update schedules to fit within new class date range
        const newSchedules = prev.schedules.map((schedule) => {
          let updatedSchedule = { ...schedule };

          if (
            name === "startDate" &&
            schedule.startDate &&
            schedule.startDate < value
          ) {
            updatedSchedule.startDate = value;
          }

          if (
            name === "endDate" &&
            schedule.endDate &&
            schedule.endDate > value
          ) {
            updatedSchedule.endDate = value;
          }

          return updatedSchedule;
        });

        return { ...prev, [name]: value, schedules: newSchedules };
      });
    } else {
      setClassData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setClassData((prev) => ({ ...prev, [name]: value }));
  };

  // Hàm thêm schedule mới
  const addSchedule = () => {
    setClassData((prev) => ({
      ...prev,
      schedules: [
        ...prev.schedules,
        {
          name: "",
          startDate: "",
          endDate: "",
          days: [],
          startTime: "",
          endTime: "",
        },
      ],
    }));
  };

  // Hàm xóa schedule
  const removeSchedule = (index: number) => {
    if (classData.schedules.length > 1) {
      setClassData((prev) => ({
        ...prev,
        schedules: prev.schedules.filter((_, i) => i !== index),
      }));
    }
  };

  // Hàm cập nhật schedule
  const handleScheduleChange = useCallback(
    (index: number, field: string, value: any) => {
      if (field === "days") {
        setClassData((prev) => {
          const newSchedules = [...prev.schedules];
          const currentDays = newSchedules[index].days;

          // Toggle day selection
          let newDays;
          if (currentDays.includes(value)) {
            newDays = currentDays.filter((d) => d !== value);
          } else {
            newDays = [...currentDays, value];
          }

          newSchedules[index] = {
            ...newSchedules[index],
            days: newDays,
          };

          return { ...prev, schedules: newSchedules };
        });
      } else {
        setClassData((prev) => {
          const newSchedules = [...prev.schedules];

          // Validate date constraints
          if (field === "startDate" || field === "endDate") {
            const classStartDate = prev.startDate;
            const classEndDate = prev.endDate;

            if (
              field === "startDate" &&
              classStartDate &&
              value < classStartDate
            ) {
              toast({
                title: "Lỗi ngày",
                description:
                  "Ngày bắt đầu khung giờ không thể trước ngày bắt đầu lớp học",
                variant: "destructive",
              });
              return prev;
            }

            if (field === "endDate" && classEndDate && value > classEndDate) {
              toast({
                title: "Lỗi ngày",
                description:
                  "Ngày kết thúc khung giờ không thể sau ngày kết thúc lớp học",
                variant: "destructive",
              });
              return prev;
            }

            if (
              field === "startDate" &&
              newSchedules[index].endDate &&
              value > newSchedules[index].endDate
            ) {
              toast({
                title: "Lỗi ngày",
                description: "Ngày bắt đầu không thể sau ngày kết thúc",
                variant: "destructive",
              });
              return prev;
            }

            if (
              field === "endDate" &&
              newSchedules[index].startDate &&
              value < newSchedules[index].startDate
            ) {
              toast({
                title: "Lỗi ngày",
                description: "Ngày kết thúc không thể trước ngày bắt đầu",
                variant: "destructive",
              });
              return prev;
            }
          }

          // Validate time constraints
          if (field === "startTime" || field === "endTime") {
            if (
              field === "startTime" &&
              newSchedules[index].endTime &&
              value >= newSchedules[index].endTime
            ) {
              toast({
                title: "Lỗi giờ",
                description: "Giờ bắt đầu phải trước giờ kết thúc",
                variant: "destructive",
              });
              return prev;
            }

            if (
              field === "endTime" &&
              newSchedules[index].startTime &&
              value <= newSchedules[index].startTime
            ) {
              toast({
                title: "Lỗi giờ",
                description: "Giờ kết thúc phải sau giờ bắt đầu",
                variant: "destructive",
              });
              return prev;
            }
          }

          (newSchedules[index] as any)[field] = value;
          return { ...prev, schedules: newSchedules };
        });
      }
    },
    [toast],
  );

  // Hàm kiểm tra trùng lặp khung giờ học
  const checkScheduleOverlap = (schedules: any[]) => {
    const conflicts: string[] = [];

    for (let i = 0; i < schedules.length; i++) {
      for (let j = i + 1; j < schedules.length; j++) {
        const schedule1 = schedules[i];
        const schedule2 = schedules[j];

        // Skip if either schedule doesn't have required data
        if (
          !schedule1.startDate ||
          !schedule1.endDate ||
          !schedule1.days.length ||
          !schedule1.startTime ||
          !schedule1.endTime ||
          !schedule2.startDate ||
          !schedule2.endDate ||
          !schedule2.days.length ||
          !schedule2.startTime ||
          !schedule2.endTime
        ) {
          continue;
        }

        // Check if date ranges overlap
        const start1 = new Date(schedule1.startDate);
        const end1 = new Date(schedule1.endDate);
        const start2 = new Date(schedule2.startDate);
        const end2 = new Date(schedule2.endDate);

        const dateOverlap = start1 <= end2 && start2 <= end1;

        if (dateOverlap) {
          // Check if they have common days
          const commonDays = schedule1.days.filter((day: string) =>
            schedule2.days.includes(day),
          );

          if (commonDays.length > 0) {
            // Check time overlap
            const time1Start = schedule1.startTime;
            const time1End = schedule1.endTime;
            const time2Start = schedule2.startTime;
            const time2End = schedule2.endTime;

            // Convert time strings to minutes for comparison
            const timeToMinutes = (time: string) => {
              const [hours, minutes] = time.split(":").map(Number);
              return hours * 60 + minutes;
            };

            const start1Minutes = timeToMinutes(time1Start);
            const end1Minutes = timeToMinutes(time1End);
            const start2Minutes = timeToMinutes(time2Start);
            const end2Minutes = timeToMinutes(time2End);

            // Check if time ranges overlap
            if (start1Minutes < end2Minutes && start2Minutes < end1Minutes) {
              const dayLabels: { [key: string]: string } = {
                sunday: "CN",
                monday: "T2",
                tuesday: "T3",
                wednesday: "T4",
                thursday: "T5",
                friday: "T6",
                saturday: "T7",
              };

              const conflictDays = commonDays
                .map((day: string) => dayLabels[day])
                .join(", ");
              conflicts.push(
                `Khung giờ ${i + 1} và ${j + 1} trùng lặp vào ${conflictDays} từ ${time1Start}-${time1End} và ${time2Start}-${time2End}`,
              );
            }
          }
        }
      }
    }

    return conflicts;
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

    // Validate schedules
    const hasValidSchedule = classData.schedules.some(
      (schedule) =>
        schedule.startDate &&
        schedule.endDate &&
        schedule.days.length > 0 &&
        schedule.startTime &&
        schedule.endTime,
    );

    if (!hasValidSchedule) {
      toast({
        title: "Lỗi",
        description: "Vui lòng thiết lập ít nhất một khung giờ học hợp lệ",
        variant: "destructive",
      });
      return;
    }

    // Check for schedule overlaps
    const conflicts = checkScheduleOverlap(classData.schedules);
    if (conflicts.length > 0) {
      toast({
        title: "Lỗi trùng lặp khung giờ",
        description: conflicts[0], // Show first conflict
        variant: "destructive",
      });
      return;
    }

    // Validate schedule dates are within class dates
    const classStart = new Date(classData.startDate);
    const classEnd = classData.endDate ? new Date(classData.endDate) : null;

    for (let i = 0; i < classData.schedules.length; i++) {
      const schedule = classData.schedules[i];
      if (schedule.startDate && schedule.endDate) {
        const scheduleStart = new Date(schedule.startDate);
        const scheduleEnd = new Date(schedule.endDate);

        if (scheduleStart < classStart) {
          toast({
            title: "Lỗi ngày",
            description: `Khung giờ ${i + 1}: Ngày bắt đầu phải từ ${classData.startDate} trở đi`,
            variant: "destructive",
          });
          return;
        }

        if (classEnd && scheduleEnd > classEnd) {
          toast({
            title: "Lỗi ngày",
            description: `Khung giờ ${i + 1}: Ngày kết thúc không được quá ${classData.endDate}`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      // Convert schedules to ScheduleDto format for API
      const schedulesForApi = classData.schedules.map((schedule, index) => {
        // Convert day names to proper format (capitalize first letter)
        const formattedDays = schedule.days.map(
          (day) => day.charAt(0).toUpperCase() + day.slice(1).toLowerCase(),
        );

        return {
          name: `Lịch học ${index + 1}`, // Add required name field
          days: formattedDays, // ["Monday", "Wednesday", "Friday"]
          startTime: schedule.startTime, // "19:00"
          endTime: schedule.endTime, // "21:00"
          startDate: schedule.startDate, // "2024-01-15"
          endDate: schedule.endDate, // "2024-06-15"
        };
      });

      // Prepare payload for API
      const payload = {
        courseId: classData.courseId,
        name: classData.name,
        description: classData.description,
        maxStudents: classData.maxStudents,
        startDate: classData.startDate,
        endDate: classData.endDate,
        isPublished: classData.isPublished,
        schedules: schedulesForApi,
      };

      const result = await createClass(payload);

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
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-gray-700">
                        Trạng thái lớp học
                      </Label>
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

            {/* Schedule Card - Lập lịch học lặp lại */}
            <Card className="shadow-sm border-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Lịch học lặp lại
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

                <div className="space-y-6">
                  {classData.schedules.map((schedule, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-lg p-4 mb-2"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-gray-800">
                          Khung giờ học #{idx + 1}
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-500"
                          onClick={() => removeSchedule(idx)}
                          disabled={classData.schedules.length === 1}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
                        <div className="space-y-2">
                          <Label>Tên khung giờ (tùy chọn)</Label>
                          <Input
                            value={schedule.name}
                            onChange={(e) =>
                              handleScheduleChange(idx, "name", e.target.value)
                            }
                            placeholder="VD: Lịch học chính, Workshop cuối tuần"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Giờ bắt đầu</Label>
                          <Input
                            type="time"
                            value={schedule.startTime}
                            onChange={(e) =>
                              handleScheduleChange(
                                idx,
                                "startTime",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Giờ kết thúc</Label>
                          <Input
                            type="time"
                            value={schedule.endTime}
                            onChange={(e) =>
                              handleScheduleChange(
                                idx,
                                "endTime",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div></div> {/* Empty div for spacing */}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                        <div className="space-y-2">
                          <Label>Ngày bắt đầu khung giờ</Label>
                          <Input
                            type="date"
                            value={schedule.startDate}
                            min={classData.startDate || undefined}
                            max={classData.endDate || undefined}
                            onChange={(e) =>
                              handleScheduleChange(
                                idx,
                                "startDate",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ngày kết thúc khung giờ</Label>
                          <Input
                            type="date"
                            value={schedule.endDate}
                            min={
                              schedule.startDate ||
                              classData.startDate ||
                              undefined
                            }
                            max={classData.endDate || undefined}
                            onChange={(e) =>
                              handleScheduleChange(
                                idx,
                                "endDate",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Chọn các ngày trong tuần</Label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { key: "sunday", label: "CN" },
                            { key: "monday", label: "T2" },
                            { key: "tuesday", label: "T3" },
                            { key: "wednesday", label: "T4" },
                            { key: "thursday", label: "T5" },
                            { key: "friday", label: "T6" },
                            { key: "saturday", label: "T7" },
                          ].map((day) => {
                            const isSelected = schedule.days.includes(day.key);

                            return (
                              <Button
                                key={day.key}
                                type="button"
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                className={`transition-all duration-200 ${
                                  isSelected
                                    ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                                    : "hover:bg-orange-50 hover:border-orange-300"
                                }`}
                                onClick={() =>
                                  handleScheduleChange(idx, "days", day.key)
                                }
                              >
                                {day.label}
                              </Button>
                            );
                          })}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Chọn ít nhất một ngày trong tuần
                          {schedule.days.length > 0 && (
                            <span className="ml-2 text-orange-600 font-medium">
                              ({schedule.days.length} ngày đã chọn)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addSchedule}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Thêm khung giờ học
                  </Button>
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    💡 Hướng dẫn
                  </h4>
                  <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
                    <li>
                      Bạn có thể thêm nhiều khung giờ học cho một lớp (ví dụ:
                      lịch học chính + workshop cuối tuần)
                    </li>
                    <li>
                      Mỗi khung giờ cần có giờ bắt đầu và giờ kết thúc cụ thể
                    </li>
                    <li>
                      Hệ thống sẽ tự động tạo các buổi học dựa trên lịch lặp lại
                      này
                    </li>
                    <li>
                      Ngày bắt đầu/kết thúc của mỗi khung giờ phải nằm trong
                      khoảng thời gian của lớp học
                    </li>
                    <li>
                      Hệ thống sẽ kiểm tra và cảnh báo nếu có trùng lặp thời
                      gian giữa các khung giờ
                    </li>
                    <li>
                      Link học trực tuyến sẽ được tự động tạo sau khi lớp học
                      được khởi tạo
                    </li>
                    <li>
                      Lớp học ở trạng thái "Nháp" sẽ không hiển thị với học viên
                      và không thể đăng ký. Chỉ khi chuyển sang "Đã mở" thì học
                      viên mới có thể thấy và đăng ký lớp học
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar column */}
          <div className="space-y-8">
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
                  <span className="font-medium">Trạng thái:</span>{" "}
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      classData.isPublished
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {classData.isPublished ? "Đã mở" : "Nháp"}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Bắt đầu:</span>{" "}
                  {classData.startDate || "Chưa chọn"}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Khung giờ học:</span>{" "}
                  {classData.schedules.length} khung giờ
                </div>
                <div className="text-sm">
                  <span className="font-medium">Tổng ngày học:</span>{" "}
                  {classData.schedules.reduce(
                    (total, schedule) => total + schedule.days.length,
                    0,
                  )}{" "}
                  ngày/tuần
                </div>

                {/* Hiển thị chi tiết các ngày đã chọn */}
                {classData.schedules.some(
                  (schedule) => schedule.days.length > 0,
                ) && (
                  <div className="text-sm">
                    <span className="font-medium">Lịch học chi tiết:</span>
                    <div className="mt-2 space-y-2">
                      {classData.schedules.map(
                        (schedule, idx) =>
                          schedule.days.length > 0 && (
                            <div
                              key={idx}
                              className="p-2 bg-gray-50 rounded text-xs"
                            >
                              <div className="font-medium text-gray-700">
                                Khung #{idx + 1}:{" "}
                                {schedule.name || "Chưa đặt tên"}
                              </div>
                              <div className="text-gray-600">
                                Thời gian:{" "}
                                {schedule.startTime && schedule.endTime
                                  ? `${schedule.startTime} - ${schedule.endTime}`
                                  : schedule.startTime || "Chưa chọn giờ"}
                              </div>
                              <div className="text-gray-600">
                                Ngày:{" "}
                                {schedule.days
                                  .map((day) => {
                                    const dayLabels: { [key: string]: string } =
                                      {
                                        sunday: "CN",
                                        monday: "T2",
                                        tuesday: "T3",
                                        wednesday: "T4",
                                        thursday: "T5",
                                        friday: "T6",
                                        saturday: "T7",
                                      };
                                    return dayLabels[day];
                                  })
                                  .join(", ")}
                              </div>
                            </div>
                          ),
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
