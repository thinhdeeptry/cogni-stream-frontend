"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { QuestionType, QuestionDifficulty } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ContentEditor } from "./content-editor";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const contentItemSchema = z.object({
  text: z.string(),
  image: z.string().optional(),
  audio: z.string().optional(),
});

const answerOptionSchema = z.object({
  content: contentItemSchema,
  order: z.number(),
  isCorrect: z.boolean(),
});

const referenceAnswerSchema = z.object({
  content: contentItemSchema,
  notes: z.string().optional(),
});

const baseQuestionSchema = z.object({
  type: z.nativeEnum(QuestionType),
  content: contentItemSchema,
  explanation: z.string().optional(),
  questionSetterId: z.string().optional(),
  courseId: z.string().optional(),
  chapterId: z.string().optional(),
  lessonId: z.string(),
  difficulty: z.nativeEnum(QuestionDifficulty),
});

const multipleChoiceSchema = baseQuestionSchema.extend({
  options: z
    .array(answerOptionSchema)
    .min(2, "Phải có ít nhất 2 đáp án")
    .refine(
      (options) => options.some((option) => option.isCorrect),
      "Phải có ít nhất 1 đáp án đúng",
    ),
});

const essaySchema = baseQuestionSchema.extend({
  referenceAnswer: referenceAnswerSchema,
});

const questionSchema = z.discriminatedUnion("type", [
  multipleChoiceSchema.extend({ type: z.literal(QuestionType.SINGLE_CHOICE) }),
  multipleChoiceSchema.extend({
    type: z.literal(QuestionType.MULTIPLE_CHOICE),
  }),
  multipleChoiceSchema.extend({ type: z.literal(QuestionType.TRUE_FALSE) }),
  essaySchema.extend({ type: z.literal(QuestionType.ESSAY) }),
]);

type QuestionFormValues = z.infer<typeof questionSchema>;

interface QuestionFormProps {
  lessonId: string;
  onSubmit?: (data: QuestionFormValues) => void;
}

export function QuestionForm({ lessonId, onSubmit }: QuestionFormProps) {
  const [questionType, setQuestionType] = useState<QuestionType>(
    QuestionType.SINGLE_CHOICE,
  );

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      type: QuestionType.SINGLE_CHOICE,
      content: {
        text: "",
      },
      lessonId,
      difficulty: QuestionDifficulty.REMEMBERING,
      options: [
        { content: { text: "" }, order: 1, isCorrect: false },
        { content: { text: "" }, order: 2, isCorrect: false },
      ],
    },
  });

  // Reset form when question type changes
  useEffect(() => {
    if (questionType === QuestionType.ESSAY) {
      form.setValue("options", [] as any);
    } else {
      form.setValue("referenceAnswer", {
        content: { text: "" },
        notes: "",
      });
      if (!form.getValues("options")?.length) {
        form.setValue("options", [
          { content: { text: "" }, order: 1, isCorrect: false },
          { content: { text: "" }, order: 2, isCorrect: false },
        ]);
      }
    }
  }, [questionType, form]);

  const getNextOrder = () => {
    const options = form.getValues("options") || [];
    if (options.length === 0) return 1;
    const orders = options.map((option) => option.order);
    return Math.max(...orders) + 1;
  };

  const handleSubmit: SubmitHandler<QuestionFormValues> = (data) => {
    if (data.type === QuestionType.SINGLE_CHOICE) {
      const correctAnswers = data.options?.filter((opt) => opt.isCorrect) || [];
      if (correctAnswers.length !== 1) {
        toast.error(
          "Câu hỏi trắc nghiệm một đáp án phải có đúng 1 đáp án đúng",
        );
        return;
      }
    }

    if (data.type === QuestionType.TRUE_FALSE) {
      if (data.options?.length !== 2) {
        toast.error("Câu hỏi Đúng/Sai phải có đúng 2 đáp án");
        return;
      }
      const correctAnswers = data.options?.filter((opt) => opt.isCorrect) || [];
      if (correctAnswers.length !== 1) {
        toast.error("Câu hỏi Đúng/Sai phải có đúng 1 đáp án đúng");
        return;
      }
    }

    onSubmit?.(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Thông tin câu hỏi</h3>
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Loại câu hỏi</FormLabel>
                    <Select
                      onValueChange={(value: QuestionType) => {
                        field.onChange(value);
                        setQuestionType(value);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue placeholder="Chọn loại câu hỏi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={QuestionType.SINGLE_CHOICE}>
                          Trắc nghiệm một đáp án
                        </SelectItem>
                        <SelectItem value={QuestionType.MULTIPLE_CHOICE}>
                          Trắc nghiệm nhiều đáp án
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
                    <FormLabel className="text-base">Độ khó</FormLabel>
                    <Select
                      onValueChange={(value: QuestionDifficulty) => {
                        field.onChange(value);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue placeholder="Chọn độ khó" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={QuestionDifficulty.REMEMBERING}>
                          Ghi nhớ
                        </SelectItem>
                        <SelectItem value={QuestionDifficulty.UNDERSTANDING}>
                          Thông hiểu
                        </SelectItem>
                        <SelectItem value={QuestionDifficulty.APPLYING}>
                          Vận dụng
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

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">
                      Nội dung câu hỏi
                    </FormLabel>
                    <FormControl>
                      <ContentEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Nhập nội dung câu hỏi..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {questionType !== QuestionType.ESSAY && (
            <div>
              <h3 className="text-lg font-medium mb-4">Danh sách đáp án</h3>
              <div className="space-y-6">
                {form.watch("options")?.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "rounded-lg border p-6",
                      form.watch(`options.${index}.isCorrect`) &&
                        "bg-emerald-50",
                    )}
                  >
                    <FormField
                      control={form.control}
                      name={`options.${index}.content`}
                      render={({ field }) => (
                        <FormItem>
                          <div className="mb-4 flex items-center justify-between">
                            <FormLabel className="text-base">
                              Đáp án {index + 1}
                            </FormLabel>
                            <div className="flex items-center gap-4">
                              <FormField
                                control={form.control}
                                name={`options.${index}.isCorrect`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={(checked) => {
                                            if (
                                              questionType ===
                                                QuestionType.SINGLE_CHOICE &&
                                              checked
                                            ) {
                                              const options =
                                                form.getValues("options") || [];
                                              options.forEach((_, i) => {
                                                if (i !== index) {
                                                  form.setValue(
                                                    `options.${i}.isCorrect`,
                                                    false,
                                                  );
                                                }
                                              });
                                            }
                                            field.onChange(checked);
                                          }}
                                        />
                                        <span className="text-base">
                                          Đáp án đúng
                                        </span>
                                      </div>
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 hover:text-red-500"
                                onClick={() => {
                                  const options =
                                    form.getValues("options") || [];
                                  form.setValue(
                                    "options",
                                    options.filter((_, i) => i !== index),
                                  );
                                }}
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>
                          <FormControl>
                            <ContentEditor
                              value={field.value}
                              onChange={field.onChange}
                              placeholder={`Nhập nội dung đáp án ${index + 1}...`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 text-base"
                  onClick={() =>
                    form.setValue("options", [
                      ...(form.getValues("options") || []),
                      {
                        content: { text: "" },
                        order: getNextOrder(),
                        isCorrect: false,
                      },
                    ])
                  }
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Thêm đáp án
                </Button>
              </div>
            </div>
          )}

          {questionType === QuestionType.ESSAY && (
            <div>
              <h3 className="text-lg font-medium mb-4">Đáp án tham khảo</h3>
              <FormField
                control={form.control}
                name="referenceAnswer"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="space-y-4">
                        <ContentEditor
                          value={field.value?.content || { text: "" }}
                          onChange={(content) =>
                            field.onChange({
                              ...field.value,
                              content,
                            })
                          }
                          placeholder="Nhập đáp án tham khảo..."
                        />
                        <Input
                          placeholder="Ghi chú cho đáp án tham khảo..."
                          value={field.value?.notes || ""}
                          onChange={(e) =>
                            field.onChange({
                              ...field.value,
                              notes: e.target.value,
                            })
                          }
                          className="h-12 text-base"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          <div>
            <h3 className="text-lg font-medium mb-4">Giải thích</h3>
            <FormField
              control={form.control}
              name="explanation"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Nhập giải thích cho đáp án..."
                      {...field}
                      className="h-12 text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            className="min-w-[140px] h-12 text-base"
          >
            Thêm câu hỏi
          </Button>
        </div>
      </form>
    </Form>
  );
}
