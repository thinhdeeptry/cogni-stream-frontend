"use client";

import { useEffect, useState } from "react";

import { Question } from "@/types/assessment/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Editor } from "@tinymce/tinymce-react";
import { Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

enum QuestionType {
  SINGLE_CHOICE = "SINGLE_CHOICE",
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  TRUE_FALSE = "TRUE_FALSE",
  ESSAY = "ESSAY",
}

enum QuestionDifficulty {
  REMEMBERING = "REMEMBERING",
  UNDERSTANDING = "UNDERSTANDING",
  APPLYING = "APPLYING",
  ANALYZING = "ANALYZING",
  EVALUATING = "EVALUATING",
  CREATING = "CREATING",
}

const questionFormSchema = z.object({
  type: z.nativeEnum(QuestionType),
  content: z.object({
    text: z.string().min(1, "Vui lòng nhập nội dung câu hỏi"),
  }),
  questionSetterId: z.string().optional(),
  courseId: z.string().uuid().optional(),
  chapterId: z.string().uuid().optional(),
  lessonId: z.string().uuid().optional(),
  difficulty: z.nativeEnum(QuestionDifficulty),
  options: z
    .array(
      z.object({
        content: z.object({
          text: z.string().min(1, "Vui lòng nhập nội dung câu trả lời"),
        }),
        order: z.number().optional(),
        isCorrect: z.boolean(),
      }),
    )
    .optional(),
  referenceAnswer: z
    .object({
      content: z.object({
        text: z.string().min(1, "Vui lòng nhập đáp án tham khảo"),
      }),
      notes: z.string().optional(),
    })
    .optional(),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

interface QuestionFormProps {
  courseId?: string;
  chapterId?: string;
  lessonId?: string;
  onSubmit: (data: QuestionFormValues) => Promise<void>;
  editorConfig?: any;
  initialData?: Question;
  isSubmitting?: boolean;
}

export function QuestionForm({
  courseId,
  chapterId,
  lessonId,
  onSubmit,
  editorConfig,
  initialData,
  isSubmitting = false,
}: QuestionFormProps) {
  const [questionType, setQuestionType] = useState<QuestionType>(
    initialData?.type || QuestionType.SINGLE_CHOICE,
  );

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      content: initialData?.content || { text: "" },
      type: initialData?.type || QuestionType.SINGLE_CHOICE,
      courseId: courseId || initialData?.courseId,
      chapterId: chapterId || initialData?.chapterId,
      lessonId: lessonId || initialData?.lessonId,
      options: initialData?.options || [
        { content: { text: "" }, isCorrect: false },
        { content: { text: "" }, isCorrect: false },
      ],
      difficulty: initialData?.difficulty || QuestionDifficulty.UNDERSTANDING,
      questionSetterId: initialData?.questionSetterId,
      referenceAnswer: initialData?.referenceAnswer,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const watchQuestionType = form.watch("type");

  useEffect(() => {
    setQuestionType(watchQuestionType);

    // Reset options based on question type
    if (watchQuestionType === QuestionType.TRUE_FALSE) {
      form.setValue("options", [
        { content: { text: "Đúng" }, isCorrect: false },
        { content: { text: "Sai" }, isCorrect: false },
      ]);
    } else if (watchQuestionType === QuestionType.ESSAY) {
      form.setValue("options", []);
    } else if (!form.getValues("options")?.length) {
      form.setValue("options", [
        { content: { text: "" }, isCorrect: false },
        { content: { text: "" }, isCorrect: false },
      ]);
    }
  }, [watchQuestionType, form]);

  const onSubmitForm = async (data: QuestionFormValues) => {
    console.log("onSubmitForm called with data:", data);

    try {
      // Validate SINGLE_CHOICE: only one correct answer
      if (data.type === QuestionType.SINGLE_CHOICE) {
        const correctAnswers =
          data.options?.filter((opt) => opt.isCorrect) || [];
        if (correctAnswers.length !== 1) {
          console.log(
            "Validation error: SINGLE_CHOICE needs exactly one correct answer",
          );
          toast.error("Câu hỏi một lựa chọn phải có đúng một đáp án đúng");
          return;
        }
      }

      // Validate TRUE_FALSE: must have exactly 2 options and one correct
      if (data.type === QuestionType.TRUE_FALSE) {
        if (data.options?.length !== 2) {
          console.log("Validation error: TRUE_FALSE needs exactly 2 options");
          toast.error("Câu hỏi Đúng/Sai phải có đúng 2 lựa chọn");
          return;
        }
        const correctAnswers = data.options.filter((opt) => opt.isCorrect);
        if (correctAnswers.length !== 1) {
          console.log(
            "Validation error: TRUE_FALSE needs exactly one correct answer",
          );
          toast.error("Câu hỏi Đúng/Sai phải có đúng một đáp án đúng");
          return;
        }
      }

      console.log("Form data before submission:", data);
      console.log("Calling parent onSubmit function...");

      await onSubmit(data);
      console.log("Parent onSubmit completed successfully");
    } catch (error) {
      console.error("Error in form submission:", error);
      toast.error("Có lỗi xảy ra khi xử lý form");
    }
  };

  // Handle option selection for SINGLE_CHOICE
  const handleSingleChoiceSelect = (index: number, checked: boolean) => {
    if (questionType === QuestionType.SINGLE_CHOICE && checked) {
      const options = form.getValues("options") || [];
      options.forEach((_, i) => {
        if (i !== index) {
          form.setValue(`options.${i}.isCorrect`, false);
        }
      });
    }
  };

  return (
    <Form {...form}>
      <div className="space-y-8">
        <div className="grid gap-6">
          <FormField
            control={form.control}
            name="content.text"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nội dung câu hỏi</FormLabel>
                <FormControl>
                  <Editor
                    apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                    init={{
                      ...editorConfig,
                      height: 300,
                    }}
                    value={field.value}
                    onEditorChange={(content) => {
                      console.log("Content changed:", content);
                      field.onChange(content);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại câu hỏi</FormLabel>
                  <Select
                    onValueChange={(value: QuestionType) => {
                      console.log("Question type changed:", value);
                      field.onChange(value);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại câu hỏi" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={QuestionType.SINGLE_CHOICE}>
                        Một lựa chọn
                      </SelectItem>
                      <SelectItem value={QuestionType.MULTIPLE_CHOICE}>
                        Nhiều lựa chọn
                      </SelectItem>
                      <SelectItem value={QuestionType.TRUE_FALSE}>
                        Đúng/Sai
                      </SelectItem>
                      <SelectItem value={QuestionType.ESSAY}>
                        Tự luận
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Độ khó</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      console.log("Difficulty changed:", value);
                      field.onChange(value);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn độ khó" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={QuestionDifficulty.REMEMBERING}>
                        Ghi nhớ
                      </SelectItem>
                      <SelectItem value={QuestionDifficulty.UNDERSTANDING}>
                        Hiểu
                      </SelectItem>
                      <SelectItem value={QuestionDifficulty.APPLYING}>
                        Áp dụng
                      </SelectItem>
                      <SelectItem value={QuestionDifficulty.ANALYZING}>
                        Phân tích
                      </SelectItem>
                      <SelectItem value={QuestionDifficulty.EVALUATING}>
                        Đánh giá
                      </SelectItem>
                      <SelectItem value={QuestionDifficulty.CREATING}>
                        Sáng tạo
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {questionType !== QuestionType.ESSAY && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Các lựa chọn</Label>
                {questionType !== QuestionType.TRUE_FALSE && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log("Adding new option");
                      append({ content: { text: "" }, isCorrect: false });
                    }}
                  >
                    Thêm lựa chọn
                  </Button>
                )}
              </div>

              {fields.map((field, index) => (
                <Card key={field.id}>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <FormField
                          control={form.control}
                          name={`options.${index}.content.text`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Editor
                                  apiKey={
                                    process.env.NEXT_PUBLIC_TINYMCE_API_KEY
                                  }
                                  init={{
                                    ...editorConfig,
                                    height: 200,
                                  }}
                                  value={field.value}
                                  onEditorChange={(content) => {
                                    console.log(
                                      `Option ${index} content changed:`,
                                      content,
                                    );
                                    field.onChange(content);
                                  }}
                                  disabled={
                                    questionType === QuestionType.TRUE_FALSE
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex flex-col justify-start gap-2">
                        <FormField
                          control={form.control}
                          name={`options.${index}.isCorrect`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={(checked) => {
                                      console.log(
                                        `Option ${index} isCorrect changed:`,
                                        checked,
                                      );
                                      field.onChange(checked);
                                      handleSingleChoiceSelect(index, checked);
                                    }}
                                  />
                                  <Label>Đáp án đúng</Label>
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {questionType !== QuestionType.TRUE_FALSE && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => {
                              console.log(`Removing option ${index}`);
                              remove(index);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {questionType === QuestionType.ESSAY && (
            <FormField
              control={form.control}
              name="referenceAnswer.content.text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Đáp án tham khảo</FormLabel>
                  <FormControl>
                    <Editor
                      apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                      init={{
                        ...editorConfig,
                        height: 300,
                      }}
                      value={field.value}
                      onEditorChange={(content) => {
                        console.log("Reference answer changed:", content);
                        field.onChange(content);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            size="lg"
            disabled={isSubmitting}
            onClick={async () => {
              console.log("Direct submit button clicked");

              // Get current form values without validation
              const rawValues = form.getValues();
              console.log("Raw form values:", rawValues);

              // Call parent onSubmit directly with current values
              try {
                if (rawValues.type === QuestionType.SINGLE_CHOICE) {
                  const correctAnswers =
                    rawValues.options?.filter((opt) => opt.isCorrect) || [];
                  if (correctAnswers.length !== 1) {
                    toast.error(
                      "Câu hỏi một lựa chọn phải có đúng một đáp án đúng",
                    );
                    return;
                  }
                }

                if (rawValues.type === QuestionType.TRUE_FALSE) {
                  if (rawValues.options?.length !== 2) {
                    toast.error("Câu hỏi Đúng/Sai phải có đúng 2 lựa chọn");
                    return;
                  }
                  const correctAnswers = rawValues.options.filter(
                    (opt) => opt.isCorrect,
                  );
                  if (correctAnswers.length !== 1) {
                    toast.error(
                      "Câu hỏi Đúng/Sai phải có đúng một đáp án đúng",
                    );
                    return;
                  }
                }

                // Direct call to parent
                await onSubmit(rawValues);
              } catch (err) {
                console.error("Error in direct submission:", err);
                toast.error("Có lỗi xảy ra khi gửi form");
              }
            }}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                {initialData ? "Đang cập nhật..." : "Đang tạo..."}
              </>
            ) : initialData ? (
              "Cập nhật câu hỏi"
            ) : (
              "Tạo câu hỏi"
            )}
          </Button>
        </div>
      </div>
    </Form>
  );
}
