"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import axios from "axios";
import { Calendar, Clock, Eye, Play, Plus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Test {
  id: string;
  title: string;
  description: string;
  testType: string;
  duration: number;
  maxScore: number;
  maxAttempts: number;
  testStart: string;
  testEnd: string;
  courseId: string;
  chapterId: string;
  lessonId: string;
}

interface TestAttempt {
  id: string;
  testId: string;
  attemptNumber: number;
  totalScore: number | null;
  startedAt: string;
  submittedAt: string | null;
  test: {
    title: string;
    testType: string;
    maxScore: number;
  };
}

interface Lesson {
  id: string;
  title: string;
}

interface Chapter {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Course {
  id: string;
  ownerId: string;
  title: string;
  chapters: Chapter[];
}

function getSelectedName(selectedId: string | null, courses: Course[] = []) {
  if (!selectedId) return "Tất cả bài kiểm tra";
  if (!Array.isArray(courses) || courses.length === 0)
    return "Tất cả bài kiểm tra";

  // Tìm khóa học
  const course = courses.find((c) => c && c.id === selectedId);
  if (course) {
    return `Khóa học: ${course.title || "Không có tên"}`;
  }

  // Tìm chương
  for (const course of courses) {
    if (!course || !Array.isArray(course.chapters)) continue;

    const chapter = course.chapters.find((ch) => ch && ch.id === selectedId);
    if (chapter) {
      return `Chương: ${chapter.title || "Không có tên"} - ${course.title || "Không có tên"}`;
    }
  }

  // Tìm bài học
  for (const course of courses) {
    if (!course || !Array.isArray(course.chapters)) continue;

    for (const chapter of course.chapters) {
      if (!chapter || !Array.isArray(chapter.lessons)) continue;

      const lesson = chapter.lessons.find((l) => l && l.id === selectedId);
      if (lesson) {
        return `Bài: ${lesson.title || "Không có tên"} - ${chapter.title || "Không có tên"} - ${course.title || "Không có tên"}`;
      }
    }
  }

  return "Tất cả bài kiểm tra";
}

function getTestTypeText(type: string) {
  switch (type) {
    case "PRACTICE":
      return "Bài tập";
    case "QUIZ":
      return "Bài kiểm tra";
    case "FINAL":
      return "Bài thi cuối kỳ";
    case "ASSIGNMENT":
      return "Bài tập về nhà";
    default:
      return type;
  }
}

export default function TestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("contextId");
  const [tests, setTests] = useState<Test[]>([]);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [activeTab, setActiveTab] = useState("available");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoadingCourses(true);
        const response = await axios.get(
          "http://localhost:3002/courses/user/25e1d787-4ce1-4109-b8eb-a90fe40d942c/structure",
        );

        // Xử lý dữ liệu trả về tùy thuộc vào cấu trúc
        if (response.data && response.data.value) {
          setCourses(response.data.value);
        } else if (Array.isArray(response.data)) {
          setCourses(response.data);
        } else {
          console.error("Unexpected API response structure:", response.data);
          setCourses([]);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        setCourses([]);
      } finally {
        setIsLoadingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setIsLoading(true);
        let params = {};

        if (selectedId && Array.isArray(courses) && courses.length > 0) {
          // Tìm khóa học
          const course = courses.find((c) => c && c.id === selectedId);
          if (course) {
            params = { courseId: selectedId };
          } else {
            // Tìm chương
            let foundChapter = false;
            for (const course of courses) {
              if (!course || !Array.isArray(course.chapters)) continue;

              const chapter = course.chapters.find(
                (ch) => ch && ch.id === selectedId,
              );
              if (chapter) {
                params = { courseId: course.id, chapterId: selectedId };
                foundChapter = true;
                break;
              }
            }

            // Tìm bài học
            if (!foundChapter) {
              // Find the course and chapter that contains this lesson
              for (const course of courses) {
                if (!course || !Array.isArray(course.chapters)) continue;

                for (const chapter of course.chapters) {
                  if (!chapter || !Array.isArray(chapter.lessons)) continue;

                  if (chapter.lessons.some((l) => l && l.id === selectedId)) {
                    params = {
                      courseId: course.id,
                      chapterId: chapter.id,
                      lessonId: selectedId,
                    };
                    break;
                  }
                }
              }
            }
          }
        }

        const response = await axios.get("http://localhost:3005/api/v1/tests", {
          params,
        });

        setTests(response.data);

        // Fetch attempts for the current user
        const attemptsResponse = await axios.get(
          "http://localhost:3005/api/v1/test-attempts",
          {
            params: {
              testTakerId: "current-user-id", // Replace with actual user ID
              isSubmitted: true,
            },
          },
        );

        setAttempts(attemptsResponse.data.attempts);
      } catch (error) {
        console.error("Error fetching tests:", error);
        toast.error("Có lỗi xảy ra khi tải danh sách bài kiểm tra");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTests();
  }, [selectedId, courses]);

  const startTest = async (testId: string) => {
    try {
      const response = await axios.post(
        "http://localhost:3005/api/v1/test-attempts",
        {
          testId,
          testTakerId: "current-user-id", // Replace with actual user ID
        },
      );

      router.push(`/assessment/attemps/${response.data.id}`);
    } catch (error) {
      console.error("Error starting test:", error);
      toast.error("Có lỗi xảy ra khi bắt đầu bài kiểm tra");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Bài kiểm tra</h2>
          <p className="text-muted-foreground">
            {getSelectedName(selectedId, courses)}
          </p>
        </div>
        <Button
          onClick={() => router.push("/assessment/tests/create")}
          size="lg"
          className="h-12 px-6"
        >
          <Plus className="mr-2 h-5 w-5" />
          Thêm bài kiểm tra
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="available">Bài kiểm tra có sẵn</TabsTrigger>
          <TabsTrigger value="completed">Bài kiểm tra đã làm</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : tests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không có bài kiểm tra nào
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tests.map((test) => {
                const testStart = new Date(test.testStart);
                const testEnd = test.testEnd ? new Date(test.testEnd) : null;
                const now = new Date();
                const isActive =
                  now >= testStart && (!testEnd || now <= testEnd);

                return (
                  <Card key={test.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{test.title}</CardTitle>
                        <Badge variant={isActive ? "default" : "secondary"}>
                          {isActive ? "Đang mở" : "Đã đóng"}
                        </Badge>
                      </div>
                      <CardDescription>
                        {getTestTypeText(test.testType)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Thời gian: {test.duration} phút</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            Mở: {testStart.toLocaleDateString()}{" "}
                            {testStart.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {testEnd && (
                          <div className="flex items-center gap-2 ml-6">
                            <span>
                              Đóng: {testEnd.toLocaleDateString()}{" "}
                              {testEnd.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        disabled={!isActive}
                        onClick={() => startTest(test.id)}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Bắt đầu làm bài
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : attempts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Bạn chưa hoàn thành bài kiểm tra nào
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {attempts.map((attempt) => {
                const startedAt = new Date(attempt.startedAt);
                const submittedAt = attempt.submittedAt
                  ? new Date(attempt.submittedAt)
                  : null;
                const scorePercentage = attempt.totalScore
                  ? (attempt.totalScore / attempt.test.maxScore) * 100
                  : 0;

                return (
                  <Card key={attempt.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {attempt.test.title}
                      </CardTitle>
                      <CardDescription>
                        {getTestTypeText(attempt.test.testType)} - Lần thử #
                        {attempt.attemptNumber}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Điểm số:</span>
                          <span>
                            {attempt.totalScore !== null
                              ? `${attempt.totalScore}/${attempt.test.maxScore} (${scorePercentage.toFixed(1)}%)`
                              : "Chưa chấm điểm"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Thời gian nộp:</span>
                          <span>
                            {submittedAt
                              ? submittedAt.toLocaleString()
                              : "Chưa nộp"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" variant="outline" asChild>
                        <Link href={`/assessment/results/${attempt.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Xem kết quả
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
