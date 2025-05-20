"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, GripVertical, Plus, Trash2 } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { getTestById, updateTest } from "@/actions/testAction";

import { QuestionSelectionForm } from "@/components/assessment/question-selection-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const testTypes = [
  { value: "PRACTICE", label: "Bài tập" },
  { value: "QUIZ", label: "Bài kiểm tra" },
  { value: "FINAL", label: "Bài thi cuối kỳ" },
  { value: "ASSIGNMENT", label: "Bài tập về nhà" },
];

const formSchema = z.object({
  id: z.string(),
  testCreator: z.string(),
  title: z.string().min(1, "Vui lòng nhập tiêu đề"),
  description: z.string().optional(),
  courseId: z.string(),
  chapterId: z.string(),
  lessonId: z.string(),
  testType: z.string().min(1, "Vui lòng chọn loại bài kiểm tra"),
  duration: z.number().nullable(),
  maxScore: z.number().min(0, "Điểm tối đa không được âm"),
  maxAttempts: z.number().nullable(),
  cooldownPeriod: z.number().nullable(),
  testStart: z.string().nullable(),
  testEnd: z.string().nullable(),
  shuffleQuestions: z.boolean().default(false),
  allowReview: z.boolean().default(true),
  enforceTimeLimit: z.boolean().default(false),
  unlimitedAttempts: z.boolean().default(false),
  scoringPolicy: z.string().default("HIGHEST"),
  questionOrder: z.array(z.string()),
  testQuestions: z.array(
    z.object({
      id: z.string(),
      testId: z.string(),
      questionId: z.string(),
      maxScore: z.number(),
      createdAt: z.string(),
      updatedAt: z.string(),
    }),
  ),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export default function EditTestPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: "",
      testCreator: "",
      title: "",
      description: "",
      courseId: "",
      chapterId: "",
      lessonId: "",
      testType: "",
      duration: null,
      maxScore: 0,
      maxAttempts: null,
      cooldownPeriod: null,
      testStart: null,
      testEnd: null,
      shuffleQuestions: false,
      allowReview: true,
      enforceTimeLimit: false,
      unlimitedAttempts: false,
      scoringPolicy: "HIGHEST",
      questionOrder: [],
      testQuestions: [],
      createdAt: "",
      updatedAt: "",
    },
  });

  useEffect(() => {
    const fetchTest = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await getTestById(params.id as string);

        if (result.success && result.data) {
          const test = result.data;
          form.reset({
            ...test,
          });
        } else {
          setError(result.message || "Không thể lấy thông tin bài kiểm tra");
        }
      } catch (error) {
        console.error("Error fetching test:", error);
        setError("Đã xảy ra lỗi khi lấy thông tin bài kiểm tra");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTest();
  }, [params.id, form]);

  const handleQuestionsSelected = (data: {
    testQuestions: Array<{ questionId: string; maxScore: number }>;
    questionOrder: string[];
    maxScore: number;
  }) => {
    // Update the form with the new questions and maxScore
    form.setValue(
      "testQuestions",
      data.testQuestions.map((q, index) => ({
        id: form.getValues("testQuestions")[index]?.id || "",
        testId: params.id as string,
        questionId: q.questionId,
        maxScore: q.maxScore,
        createdAt:
          form.getValues("testQuestions")[index]?.createdAt ||
          new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
    );
    form.setValue("questionOrder", data.questionOrder);
    form.setValue("maxScore", data.maxScore);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const result = await updateTest(params.id as string, values);

      if (result.success) {
        toast.success("Cập nhật bài kiểm tra thành công");
        router.push("/assessment/tests");
      } else {
        toast.error(
          result.message || "Có lỗi xảy ra khi cập nhật bài kiểm tra",
        );
      }
    } catch (error) {
      console.error("Error updating test:", error);
      toast.error("Có lỗi xảy ra khi cập nhật bài kiểm tra");
    }
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500 bg-red-50 rounded-lg p-4 border border-red-200">
        <p className="font-semibold">Lỗi:</p>
        <p>{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Chỉnh sửa bài kiểm tra</h1>
          <p className="text-muted-foreground">
            Cập nhật thông tin và quản lý câu hỏi cho bài kiểm tra
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Hủy
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)}>Lưu thay đổi</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
              <CardDescription>Thông tin chung về bài kiểm tra</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tiêu đề</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nhập tiêu đề bài kiểm tra"
                            {...field}
                            value={field.value || ""}
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
                            placeholder="Nhập mô tả bài kiểm tra"
                            {...field}
                            value={field.value || ""}
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
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn loại bài kiểm tra" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {testTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="maxScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Điểm tối đa</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Nhập điểm tối đa"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxAttempts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Số lần làm bài</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Nhập số lần làm bài"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                              disabled={form.watch("unlimitedAttempts")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="testStart"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Thời gian bắt đầu</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={
                                    "w-full pl-3 text-left font-normal"
                                  }
                                >
                                  {field.value ? (
                                    format(new Date(field.value), "PPP")
                                  ) : (
                                    <span>Chọn ngày</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <DayPicker
                                mode="single"
                                selected={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
                                }
                                onSelect={(date) =>
                                  field.onChange(date?.toISOString() || null)
                                }
                                disabled={(date: Date) =>
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="testEnd"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Thời gian kết thúc</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={
                                    "w-full pl-3 text-left font-normal"
                                  }
                                >
                                  {field.value ? (
                                    format(new Date(field.value), "PPP")
                                  ) : (
                                    <span>Chọn ngày</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <DayPicker
                                mode="single"
                                selected={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
                                }
                                onSelect={(date) =>
                                  field.onChange(date?.toISOString() || null)
                                }
                                disabled={(date: Date) =>
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Câu hỏi</CardTitle>
              <CardDescription>
                Quản lý danh sách câu hỏi trong bài kiểm tra
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuestionSelectionForm
                courseId={form.getValues("courseId")}
                chapterId={form.getValues("chapterId")}
                lessonId={form.getValues("lessonId")}
                defaultQuestions={form.getValues("testQuestions").map((q) => ({
                  questionId: q.questionId,
                  maxScore: q.maxScore,
                }))}
                defaultOrder={form.getValues("questionOrder")}
                onQuestionsSelected={handleQuestionsSelected}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt nâng cao</CardTitle>
              <CardDescription>
                Các tùy chọn bổ sung cho bài kiểm tra
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Form {...form}>
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="shuffleQuestions"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Xáo trộn câu hỏi</FormLabel>
                          <FormDescription>
                            Thứ tự câu hỏi sẽ được xáo trộn ngẫu nhiên
                          </FormDescription>
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
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Cho phép xem lại</FormLabel>
                          <FormDescription>
                            Học viên có thể xem lại bài làm sau khi nộp
                          </FormDescription>
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
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Giới hạn thời gian</FormLabel>
                          <FormDescription>
                            Tự động nộp bài khi hết thời gian
                          </FormDescription>
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
                    name="unlimitedAttempts"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Không giới hạn số lần làm</FormLabel>
                          <FormDescription>
                            Học viên có thể làm bài không giới hạn số lần
                          </FormDescription>
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
                        <FormLabel>Chính sách tính điểm</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn cách tính điểm" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="HIGHEST">
                              Điểm cao nhất
                            </SelectItem>
                            <SelectItem value="LATEST">
                              Lần làm gần nhất
                            </SelectItem>
                            <SelectItem value="AVERAGE">
                              Điểm trung bình
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Cách tính điểm khi học viên làm bài nhiều lần
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
