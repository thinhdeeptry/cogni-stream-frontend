"use client";

import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

enum TestType {
  PRACTICE = "PRACTICE",
  QUIZ = "QUIZ",
  FINAL = "FINAL",
  ASSIGNMENT = "ASSIGNMENT",
}

enum ScoringPolicy {
  HIGHEST = "HIGHEST",
  AVERAGE = "AVERAGE",
  LATEST = "LATEST",
}

const testFormSchema = z.object({
  title: z.string().min(1, "Vui lòng nhập tiêu đề"),
  description: z.string(),
  courseId: z.string().min(1, "Vui lòng chọn khóa học"),
  chapterId: z.string().optional(),
  lessonId: z.string().optional(),
  duration: z.number().min(1, "Thời gian làm bài phải lớn hơn 0"),
  testType: z.nativeEnum(TestType),
  shuffleQuestions: z.boolean(),
  maxAttempts: z.number().min(0, "Số lần làm lại không được âm"),
  cooldownPeriod: z.number().min(0, "Thời gian chờ không được âm").optional(),
  scoringPolicy: z.nativeEnum(ScoringPolicy),
  allowReview: z.boolean(),
  testStart: z.string(),
  testEnd: z.string(),
});

type TestFormValues = z.infer<typeof testFormSchema>;

interface TestFormProps {
  onSubmit: (data: TestFormValues) => void;
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

export function TestForm({ onSubmit }: TestFormProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<TestFormValues>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      title: "",
      description: "",
      duration: 60,
      testType: TestType.PRACTICE,
      shuffleQuestions: false,
      maxAttempts: 1,
      cooldownPeriod: 24,
      scoringPolicy: ScoringPolicy.HIGHEST,
      allowReview: true,
      testStart: "",
      testEnd: "",
    },
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
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
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const selectedChapter = selectedCourse?.chapters.find(
    (c) => c.id === selectedChapterId,
  );

  const handleSubmit = (data: TestFormValues) => {
    // Validate test end time
    const startTime = new Date(data.testStart);
    const endTime = new Date(data.testEnd);
    const durationInMs = data.duration * 60 * 1000; // Convert minutes to milliseconds

    if (endTime.getTime() - startTime.getTime() < durationInMs) {
      form.setError("testEnd", {
        type: "manual",
        message:
          "Thời gian kết thúc phải lớn hơn thời gian bắt đầu + thời gian làm bài",
      });
      return;
    }

    // Convert to ISO string
    const formattedData = {
      ...data,
      testStart: startTime.toISOString(),
      testEnd: endTime.toISOString(),
      testCreator: "lê hoàng khang",
    };

    onSubmit(formattedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="grid gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tiêu đề</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nhập tiêu đề bài kiểm tra..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mô tả</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Nhập mô tả bài kiểm tra..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Khóa học</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedCourseId(value);
                      setSelectedChapterId("");
                      form.setValue("chapterId", "");
                      form.setValue("lessonId", "");
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn khóa học" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoading ? (
                        <SelectItem value="loading" disabled>
                          Đang tải khóa học...
                        </SelectItem>
                      ) : courses.length === 0 ? (
                        <SelectItem value="empty" disabled>
                          Không có khóa học nào
                        </SelectItem>
                      ) : (
                        courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="chapterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chương</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedChapterId(value);
                      form.setValue("lessonId", "");
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn chương" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoading ? (
                        <SelectItem value="loading" disabled>
                          Đang tải chương...
                        </SelectItem>
                      ) : !selectedCourse ? (
                        <SelectItem value="empty" disabled>
                          Vui lòng chọn khóa học trước
                        </SelectItem>
                      ) : selectedCourse.chapters.length === 0 ? (
                        <SelectItem value="empty" disabled>
                          Không có chương nào
                        </SelectItem>
                      ) : (
                        selectedCourse.chapters.map((chapter) => (
                          <SelectItem key={chapter.id} value={chapter.id}>
                            {chapter.title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lessonId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bài học</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn bài học" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoading ? (
                        <SelectItem value="loading" disabled>
                          Đang tải bài học...
                        </SelectItem>
                      ) : !selectedChapter ? (
                        <SelectItem value="empty" disabled>
                          Vui lòng chọn chương trước
                        </SelectItem>
                      ) : selectedChapter.lessons.length === 0 ? (
                        <SelectItem value="empty" disabled>
                          Không có bài học nào
                        </SelectItem>
                      ) : (
                        selectedChapter.lessons.map((lesson) => (
                          <SelectItem key={lesson.id} value={lesson.id}>
                            {lesson.title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thời gian làm bài (phút)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="testType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại bài kiểm tra</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại bài kiểm tra" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={TestType.PRACTICE}>
                        Luyện tập
                      </SelectItem>
                      <SelectItem value={TestType.QUIZ}>
                        Kiểm tra nhanh
                      </SelectItem>
                      <SelectItem value={TestType.FINAL}>
                        Kiểm tra cuối kỳ
                      </SelectItem>
                      <SelectItem value={TestType.ASSIGNMENT}>
                        Bài tập
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="maxAttempts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số lần làm lại</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cooldownPeriod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thời gian chờ giữa các lần làm (phút)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      disabled={form.watch("maxAttempts") === 0}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="testStart"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thời gian bắt đầu</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="testEnd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thời gian kết thúc</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="shuffleQuestions"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Xáo trộn câu hỏi
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowReview"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Cho phép xem lại
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scoringPolicy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cách tính điểm</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={form.watch("maxAttempts") === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn cách tính điểm" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={ScoringPolicy.HIGHEST}>
                        Điểm cao nhất
                      </SelectItem>
                      <SelectItem value={ScoringPolicy.AVERAGE}>
                        Điểm trung bình
                      </SelectItem>
                      <SelectItem value={ScoringPolicy.LATEST}>
                        Lần cuối cùng
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="lg">
            Tiếp theo
          </Button>
        </div>
      </form>
    </Form>
  );
}
