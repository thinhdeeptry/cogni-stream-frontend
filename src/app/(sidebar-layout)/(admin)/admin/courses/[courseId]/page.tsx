"use client";

import Link from "next/link";
import { use } from "react";
import { useEffect, useState } from "react";

import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import { Course } from "@/types/course/types";
import { ChevronLeft, Edit, Loader2, Plus } from "lucide-react";

import { getCourseById } from "@/actions/courseAction";

import { CourseContent } from "@/components/CourseContent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AddChapterDialog } from "./AddChapterDialog";

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const resolvedParams = use(params);
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddChapterOpen, setIsAddChapterOpen] = useState(false);
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");

  const fetchCourseData = async () => {
    try {
      setIsLoading(true);
      const courseData = await getCourseById(resolvedParams.courseId);
      setCourse(courseData);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin khóa học",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [resolvedParams.courseId]);

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[200px]">
        <div className="text-muted-foreground">Không tìm thấy khóa học</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/courses">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{course.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={course.isPublished ? "default" : "secondary"}>
                {course.isPublished ? "Đã xuất bản" : "Chưa xuất bản"}
              </Badge>
              <Badge variant="outline">{course.level}</Badge>
            </div>
          </div>
        </div>
        <Link href={`/admin/courses/${resolvedParams.courseId}/edit`}>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Chỉnh sửa
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Course Info */}
        <div className="col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin khóa học</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video relative rounded-lg overflow-hidden">
                <img
                  src={course.thumbnailUrl || "/placeholder-course.jpg"}
                  alt={course.title}
                  className="object-cover w-full h-full"
                />
              </div>

              <div>
                <h3 className="font-semibold mb-1">Mô tả</h3>
                <p className="text-sm text-muted-foreground">
                  {course.description}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-1">Danh mục</h3>
                <p className="text-sm text-muted-foreground">
                  {course.category?.name || "Chưa phân loại"}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-1">Giá</h3>
                <p className="text-sm text-muted-foreground">
                  {course.price === 0
                    ? "Miễn phí"
                    : formatPrice(course.price, course.currency)}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-1">Tổng quan</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Số chương: {course.chapters?.length}</p>
                  <p>Số bài học: {course.totalLessons}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-1">Yêu cầu</h3>
                <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                  {course.requirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-1">Mục tiêu khóa học</h3>
                <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                  {course.learningOutcomes.map((outcome, index) => (
                    <li key={index}>{outcome}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chapters and Lessons */}
        <div className="col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Nội dung khóa học</h2>
            <Button onClick={() => setIsAddChapterOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm chương mới
            </Button>
          </div>

          <CourseContent
            courseId={resolvedParams.courseId}
            chapters={(course.chapters || []).map((chapter) => ({
              ...chapter,
              lessons: chapter.lessons || [],
            }))}
            onOrderUpdate={fetchCourseData}
          />

          {/* Add Lesson Button - Hidden but needed for the dialog */}
          <Button
            className="hidden"
            onClick={() => {
              if (course.chapters && course.chapters.length > 0) {
                setSelectedChapterId(course.chapters[0].id);
                setIsAddLessonOpen(true);
              } else {
                toast({
                  title: "Lỗi",
                  description: "Bạn cần tạo chương trước khi tạo bài học",
                  variant: "destructive",
                });
              }
            }}
          >
            Thêm bài học
          </Button>
        </div>
      </div>

      <AddChapterDialog
        courseId={resolvedParams.courseId}
        open={isAddChapterOpen}
        onOpenChange={setIsAddChapterOpen}
        onSuccess={fetchCourseData}
      />
    </div>
  );
}
