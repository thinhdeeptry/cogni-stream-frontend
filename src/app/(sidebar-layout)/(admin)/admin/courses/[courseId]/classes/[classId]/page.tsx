"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { useToast } from "@/hooks/use-toast";
import { Class, Course, SyllabusItem } from "@/types/course/types";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  Clock,
  Edit,
  MapPin,
  Plus,
  Users,
  Video,
} from "lucide-react";

import { getClassById } from "@/actions/classActions";
import { getCourseById } from "@/actions/courseAction";
import { getSyllabusByClass } from "@/actions/syllabusActions";

import SyllabusManager from "@/components/admin/SyllabusManager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ClassDetailPage({
  params,
}: {
  params: Promise<{ courseId: string; classId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [classData, setClassData] = useState<Class | null>(null);
  const [syllabusItems, setSyllabusItems] = useState<SyllabusItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSyllabus, setIsLoadingSyllabus] = useState(false);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch course and class data in parallel
        const [courseData, classData] = await Promise.all([
          getCourseById(resolvedParams.courseId),
          getClassById(resolvedParams.classId),
        ]);

        setCourse(courseData);
        setClassData(classData);

        // Fetch syllabus data
        setIsLoadingSyllabus(true);
        const syllabusData = await getSyllabusByClass(resolvedParams.classId);
        setSyllabusItems(syllabusData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin lớp học",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        setIsLoadingSyllabus(false);
      }
    };

    fetchData();
  }, [resolvedParams.courseId, resolvedParams.classId, toast]);

  const refreshSyllabus = async () => {
    try {
      setIsLoadingSyllabus(true);
      const syllabusData = await getSyllabusByClass(resolvedParams.classId);
      setSyllabusItems(syllabusData);
    } catch (error) {
      console.error("Error refreshing syllabus:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải lại lộ trình học",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSyllabus(false);
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

  if (!course || !classData) {
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
      className="p-6 space-y-6 bg-slate-50 min-h-screen"
    >
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/admin/courses/${resolvedParams.courseId}`}>
              <Button
                variant="outline"
                size="icon"
                className="border-slate-200 hover:bg-slate-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {classData.name}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant={classData.isPublished ? "default" : "secondary"}
                  className={
                    classData.isPublished ? "bg-green-500" : "bg-orange-500"
                  }
                >
                  {classData.isPublished ? "Đã mở đăng ký" : "Nháp"}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-blue-200 bg-blue-50 text-blue-700"
                >
                  📹 Lớp học trực tuyến
                </Badge>
                <Badge
                  variant="outline"
                  className="border-slate-200 text-slate-600"
                >
                  {course.level}
                </Badge>
              </div>
              <p className="text-slate-600 mt-1">Khóa học: {course.title}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() =>
                router.push(
                  `/admin/courses/${resolvedParams.courseId}/classes/${resolvedParams.classId}/edit`,
                )
              }
            >
              <Edit className="h-4 w-4" />
              Chỉnh sửa lớp học
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Class Info Sidebar */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Thông tin lớp học
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {classData.description && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">
                    Mô tả
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {classData.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">
                    Học viên hiện tại
                  </h3>
                  <p className="text-lg font-semibold text-blue-600">
                    {classData.currentStudents}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">
                    Sức chứa tối đa
                  </h3>
                  <p className="text-lg font-semibold text-slate-900">
                    {classData.maxStudents}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  Thời gian
                </h3>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Bắt đầu:{" "}
                    {new Date(classData.startDate).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                {classData.endDate && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Kết thúc:{" "}
                      {new Date(classData.endDate).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                )}
              </div>

              {classData.schedules && classData.schedules.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Lịch học
                  </h3>
                  <div className="space-y-2">
                    {classData.schedules.map((schedule, index) => (
                      <div
                        key={index}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-100"
                      >
                        {schedule.name && (
                          <p className="text-sm font-medium text-slate-800 mb-1">
                            {schedule.name}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {schedule.startTime} - {schedule.endTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {schedule.startDate} - {schedule.endDate}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {schedule.days.map((day) => (
                            <Badge
                              key={day}
                              variant="outline"
                              className="text-xs"
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
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Syllabus Manager */}
        <div className="col-span-2">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <div className="flex justify-between items-center">
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Lộ trình học tập
                </CardTitle>
                <Badge variant="outline" className="text-sm">
                  {syllabusItems.length} mục lộ trình
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <SyllabusManager
                classId={resolvedParams.classId}
                courseId={resolvedParams.courseId}
                syllabusItems={syllabusItems}
                isLoading={isLoadingSyllabus}
                onRefresh={refreshSyllabus}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
