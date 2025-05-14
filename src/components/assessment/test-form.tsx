"use client";

import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { ScoringPolicy, TestType } from "@/actions/assessmentAction";
import { getUserCourseStructureWithDetails } from "@/actions/courseAction";

import useUserStore from "@/stores/useUserStore";

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

const testFormSchema = z.object({
  title: z.string().min(1, "Vui lòng nhập tiêu đề"),
  description: z.string().optional(),
  courseId: z.string().min(1, "Vui lòng chọn khóa học"),
  chapterId: z.string().optional(),
  lessonId: z.string().optional(),
  duration: z.number().min(1, "Thời gian làm bài phải lớn hơn 0").optional(),
  maxScore: z.number().min(0).default(100),
  testType: z.nativeEnum(TestType),
  shuffleQuestions: z.boolean(),
  maxAttempts: z.number().min(0, "Số lần làm lại không được âm").optional(),
  cooldownPeriod: z.number().min(0, "Thời gian chờ không được âm").optional(),
  scoringPolicy: z.nativeEnum(ScoringPolicy),
  allowReview: z.boolean(),
  enforceTimeLimit: z.boolean(),
  unlimitedAttempts: z.boolean(),
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
  const [isBrowser, setIsBrowser] = useState(false);

  const form = useForm<TestFormValues>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      title: "",
      description: "",
      duration: 60,
      maxScore: 100,
      testType: TestType.PRACTICE,
      shuffleQuestions: false,
      maxAttempts: 1,
      cooldownPeriod: 24,
      scoringPolicy: ScoringPolicy.HIGHEST,
      allowReview: true,
      enforceTimeLimit: true,
      unlimitedAttempts: false,
    },
  });

  const user = useUserStore((state) => state.user);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  useEffect(() => {
    if (!isBrowser) return;

    if (!user?.id) {
      setIsLoading(false);
      setCourses([]);
      return;
    }

    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        const result = await getUserCourseStructureWithDetails(user.id);
        if (result.success && result.data) {
          if (result.data.value) {
            setCourses(result.data.value);
          } else if (Array.isArray(result.data)) {
            setCourses(result.data);
          } else {
            console.log("Unexpected API response structure");
            setCourses([]);
          }
        } else {
          console.log("Error fetching courses");
          setCourses([]);
        }
      } catch (error) {
        console.log("Error fetching courses");
        setCourses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [user?.id, isBrowser]);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const selectedChapter = selectedCourse?.chapters.find(
    (c) => c.id === selectedChapterId,
  );

  const handleSubmit = (data: TestFormValues) => {
    const formattedData = {
      ...data,
      testStart: new Date(),
      testCreator: user?.id || "unknown",
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
                      disabled={!form.watch("enforceTimeLimit")}
                      value={field.value || ""}
                      onChange={(e) => {
                        const val = e.target.value
                          ? parseInt(e.target.value, 10)
                          : "";
                        field.onChange(val);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Điểm tối đa</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => {
                        const val = e.target.value
                          ? parseInt(e.target.value, 10)
                          : "";
                        field.onChange(val);
                      }}
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
              name="maxAttempts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số lần làm lại</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      disabled={form.watch("unlimitedAttempts")}
                      value={field.value || ""}
                      onChange={(e) => {
                        const val = e.target.value
                          ? parseInt(e.target.value, 10)
                          : "";
                        field.onChange(val);
                      }}
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
                      disabled={
                        form.watch("unlimitedAttempts") ||
                        form.watch("maxAttempts") === 0
                      }
                      value={field.value || ""}
                      onChange={(e) => {
                        const val = e.target.value
                          ? parseInt(e.target.value, 10)
                          : "";
                        field.onChange(val);
                      }}
                    />
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
              name="enforceTimeLimit"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Giới hạn thời gian
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (!checked) {
                          form.setValue("duration", undefined);
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="unlimitedAttempts"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Không giới hạn số lần làm lại
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked) {
                          form.setValue("maxAttempts", undefined);
                          form.setValue("cooldownPeriod", undefined);
                        }
                      }}
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
                    disabled={
                      !form.watch("unlimitedAttempts") &&
                      form.watch("maxAttempts") === 0
                    }
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
