"use client";

import type React from "react";
import { useEffect, useState } from "react";

import { toast } from "@/hooks/use-toast";
import {
  type Answer,
  type Question,
  QuestionType,
} from "@/types/assessment/types";
import { Editor } from "@tinymce/tinymce-react";
import {
  AlertCircle,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit,
  HelpCircle,
  Plus,
  Target,
  Trash2,
} from "lucide-react";

import {
  createQuestion,
  deleteQuestion,
  getQuestions,
  updateQuestion,
} from "@/actions/assessmentAction";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Types based on new backend structure
interface QuestionManagerProps {
  lessonId?: string;
  courseId?: string;
  chapterId?: string;
  onQuestionsChange?: (questions: Question[]) => void;
}

interface QuestionFormData {
  id?: string;
  text: string;
  type: QuestionType;
  answers: Answer[];
}

export function QuestionManager({
  lessonId,
  courseId,
  chapterId,
  onQuestionsChange,
}: QuestionManagerProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set(),
  );
  const [questionPoints, setQuestionPoints] = useState<number>(2.0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for new/editing question
  const [formData, setFormData] = useState<QuestionFormData>({
    text: "",
    type: QuestionType.SINGLE_CHOICE,
    answers: [
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
  });

  // Editor configuration
  const editorConfig = {
    height: 200,
    menubar: false,
    plugins: [
      "advlist",
      "autolink",
      "lists",
      "link",
      "image",
      "charmap",
      "preview",
      "anchor",
      "searchreplace",
      "visualblocks",
      "code",
      "fullscreen",
      "insertdatetime",
      "media",
      "table",
      "help",
      "wordcount",
    ],
    toolbar:
      "undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help",
    content_style: `
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; }
      .mce-content-body img { max-width: 100%; height: auto; }
    `,
  };

  const questionTypeOptions = [
    {
      value: QuestionType.SINGLE_CHOICE,
      label: "Một lựa chọn",
      icon: CheckCircle2,
      description: "Học viên chọn một đáp án đúng từ nhiều lựa chọn",
      color: "text-blue-600",
    },
    {
      value: QuestionType.MULTIPLE_CHOICE,
      label: "Nhiều lựa chọn",
      icon: CheckCircle2,
      description: "Học viên có thể chọn nhiều đáp án đúng",
      color: "text-green-600",
    },
    {
      value: QuestionType.SHORT_ANSWER,
      label: "Trả lời ngắn",
      icon: Edit,
      description: "Câu trả lời văn bản ngắn gọn",
      color: "text-orange-600",
    },
    {
      value: QuestionType.ESSAY,
      label: "Tự luận",
      icon: Edit,
      description: "Câu trả lời dài, chi tiết",
      color: "text-purple-600",
    },
    {
      value: QuestionType.FILL_IN_BLANK,
      label: "Điền từ",
      icon: Edit,
      description: "Điền từ hoặc cụm từ vào chỗ trống",
      color: "text-pink-600",
    },
  ];

  // Load questions when lessonId changes
  useEffect(() => {
    if (lessonId) {
      loadQuestions();
    }
  }, [lessonId]);

  // Notify parent component when questions change
  useEffect(() => {
    if (onQuestionsChange) {
      onQuestionsChange(questions);
    }
  }, [questions, onQuestionsChange]);

  const loadQuestions = async () => {
    if (!lessonId) return;

    setIsLoading(true);
    try {
      const result = await getQuestions({ lessonId });
      if (result.success) {
        const questionsData = Array.isArray(result.data)
          ? result.data
          : result.data?.data || [];
        setQuestions(questionsData);
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách câu hỏi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      text: "",
      type: QuestionType.SINGLE_CHOICE,
      answers: getDefaultAnswersForType(QuestionType.SINGLE_CHOICE),
    });
  };

  const getDefaultAnswersForType = (type: QuestionType): Answer[] => {
    switch (type) {
      case QuestionType.SINGLE_CHOICE:
        return [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
        ];
      case QuestionType.MULTIPLE_CHOICE:
        return [
          { text: "", isCorrect: false, points: 0.0 },
          { text: "", isCorrect: false, points: 0.0 },
        ];
      case QuestionType.SHORT_ANSWER:
      case QuestionType.ESSAY:
      case QuestionType.FILL_IN_BLANK:
        return [
          {
            text: "",
            isCorrect: true,
            acceptedAnswers: [],
            caseSensitive: false,
            exactMatch: false,
            points: 2.0, // Điểm đầy đủ
          },
          {
            text: "",
            isCorrect: true,
            acceptedAnswers: [],
            caseSensitive: false,
            exactMatch: false,
            points: 1.0, // Điểm một phần
          },
        ];
      default:
        return [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ];
    }
  };

  const handleAddAnswer = () => {
    if (isTextBasedQuestion(formData.type)) {
      // For text-based questions, just add accepted answers
      const currentAnswer = formData.answers[0] || {};
      const updatedAnswers = [
        {
          ...currentAnswer,
          acceptedAnswers: [...(currentAnswer.acceptedAnswers || []), ""],
        },
      ];
      setFormData((prev) => ({ ...prev, answers: updatedAnswers }));
    } else {
      // For multiple choice questions
      setFormData((prev) => ({
        ...prev,
        answers: [...prev.answers, { text: "", isCorrect: false }],
      }));
    }
  };

  const handleRemoveAnswer = (index: number) => {
    if (isTextBasedQuestion(formData.type)) {
      // For text-based questions, remove accepted answer
      const currentAnswer = formData.answers[0] || {};
      const acceptedAnswers = currentAnswer.acceptedAnswers || [];
      if (acceptedAnswers.length <= 1) return;

      const updatedAnswers = [
        {
          ...currentAnswer,
          acceptedAnswers: acceptedAnswers.filter((_, i) => i !== index),
        },
      ];
      setFormData((prev) => ({ ...prev, answers: updatedAnswers }));
    } else {
      // For multiple choice questions
      if (formData.answers.length <= 2) return;
      setFormData((prev) => ({
        ...prev,
        answers: prev.answers.filter((_, i) => i !== index),
      }));
    }
  };

  const handleAnswerChange = (index: number, field: string, value: any) => {
    if (isTextBasedQuestion(formData.type)) {
      // For text-based questions
      setFormData((prev) => ({
        ...prev,
        answers: [
          {
            ...prev.answers[0],
            [field]: value,
          },
        ],
      }));
    } else {
      // For multiple choice questions
      setFormData((prev) => ({
        ...prev,
        answers: prev.answers.map((answer, i) => {
          if (i === index) {
            return { ...answer, [field]: value };
          }
          // For single choice, uncheck other answers when one is selected
          if (
            field === "isCorrect" &&
            prev.type === QuestionType.SINGLE_CHOICE &&
            value &&
            i !== index
          ) {
            return { ...answer, isCorrect: false };
          }
          return answer;
        }),
      }));
    }
  };

  const handleAcceptedAnswerChange = (index: number, value: string) => {
    const currentAnswer = formData.answers[0] || {};
    const acceptedAnswers = [...(currentAnswer.acceptedAnswers || [])];
    acceptedAnswers[index] = value;

    const updatedAnswers = [
      {
        ...currentAnswer,
        acceptedAnswers,
      },
    ];
    setFormData((prev) => ({ ...prev, answers: updatedAnswers }));
  };

  const isTextBasedQuestion = (type: QuestionType): boolean => {
    return [
      QuestionType.SHORT_ANSWER,
      QuestionType.ESSAY,
      QuestionType.FILL_IN_BLANK,
    ].includes(type);
  };

  const validateForm = (): boolean => {
    if (!formData.text.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập nội dung câu hỏi",
        variant: "destructive",
      });
      return false;
    }

    if (isTextBasedQuestion(formData.type)) {
      // Validate text-based questions
      const answer = formData.answers[0];
      if (
        !answer ||
        (!answer.text?.trim() &&
          (!answer.acceptedAnswers || answer.acceptedAnswers.length === 0))
      ) {
        toast({
          title: "Lỗi",
          description: "Vui lòng nhập đáp án hoặc các đáp án được chấp nhận",
          variant: "destructive",
        });
        return false;
      }
    } else {
      // Validate multiple choice questions
      const correctAnswers = formData.answers.filter(
        (answer) => answer.isCorrect,
      );

      if (
        formData.type === QuestionType.SINGLE_CHOICE &&
        correctAnswers.length !== 1
      ) {
        toast({
          title: "Lỗi",
          description: "Câu hỏi một lựa chọn phải có đúng một đáp án đúng",
          variant: "destructive",
        });
        return false;
      }

      if (
        formData.type === QuestionType.MULTIPLE_CHOICE &&
        correctAnswers.length === 0
      ) {
        toast({
          title: "Lỗi",
          description: "Câu hỏi nhiều lựa chọn phải có ít nhất một đáp án đúng",
          variant: "destructive",
        });
        return false;
      }

      // Check if all answers have content
      const emptyAnswers = formData.answers.filter(
        (answer) => !answer.text?.trim(),
      );
      if (emptyAnswers.length > 0) {
        toast({
          title: "Lỗi",
          description: "Vui lòng nhập nội dung cho tất cả các đáp án",
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.text.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập nội dung câu hỏi",
        variant: "destructive",
      });
      return;
    }

    if (formData.type === QuestionType.SINGLE_CHOICE && questionPoints <= 0) {
      toast({
        title: "Lỗi",
        description: "Câu hỏi một lựa chọn phải có điểm số > 0",
        variant: "destructive",
      });
      return;
    }

    if (formData.type === QuestionType.MULTIPLE_CHOICE) {
      const totalAnswerPoints = formData.answers
        .filter((a) => a.isCorrect)
        .reduce((sum, a) => sum + (a.points || 0), 0);

      if (totalAnswerPoints > questionPoints) {
        toast({
          title: "Lỗi",
          description:
            "Tổng điểm các đáp án đúng không được vượt quá điểm tối đa của câu hỏi",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setIsSubmitting(true);

      if (!lessonId) {
        toast({
          title: "Lỗi",
          description: "Không xác định được bài học để tạo câu hỏi",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const questionData = {
        ...formData,
        points: questionPoints,
        lessonId: lessonId,
      };

      let result;
      if (editingQuestion) {
        result = await updateQuestion(editingQuestion.id!, questionData);
      } else {
        result = await createQuestion(questionData);
      }

      if (result.success) {
        toast({
          title: "Thành công",
          description: editingQuestion
            ? "Cập nhật câu hỏi thành công"
            : "Tạo câu hỏi thành công",
        });
        resetForm();
        setEditingQuestion(null);
        setShowAddForm(false);
        await loadQuestions();
      } else {
        toast({
          title: "Lỗi",
          description: result.message || "Có lỗi xảy ra",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving question:", error);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi lưu câu hỏi",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (question: Question) => {
    setFormData({
      id: question.id,
      text: question.text,
      type: question.type,
      answers: question.answers || getDefaultAnswersForType(question.type),
    });
    setQuestionPoints(question.points || 2.0);
    setEditingQuestion(question);
    setShowAddForm(true);
  };

  const handleDelete = async (questionId: string) => {
    setIsLoading(true);
    try {
      const result = await deleteQuestion(questionId);
      if (result.success) {
        toast({
          title: "Thành công",
          description: "Xóa câu hỏi thành công",
        });
        await loadQuestions();
      } else {
        toast({
          title: "Lỗi",
          description: result.message || "Không thể xóa câu hỏi",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi xóa câu hỏi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpanded = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case QuestionType.SINGLE_CHOICE:
        return "Một lựa chọn";
      case QuestionType.MULTIPLE_CHOICE:
        return "Nhiều lựa chọn";
      case QuestionType.SHORT_ANSWER:
        return "Trả lời ngắn";
      case QuestionType.ESSAY:
        return "Tự luận";
      case QuestionType.FILL_IN_BLANK:
        return "Điền từ";
      default:
        return "Không xác định";
    }
  };

  const addAnswer = () => {
    if (isTextBasedQuestion(formData.type)) {
      const newAnswer: Answer = {
        text: "",
        isCorrect: true,
        acceptedAnswers: [],
        caseSensitive: false,
        exactMatch: false,
        points: 1.0,
      };
      setFormData((prev) => ({
        ...prev,
        answers: [...prev.answers, newAnswer],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        answers: [...prev.answers, { text: "", isCorrect: false, points: 0.0 }],
      }));
    }
  };

  const removeAnswer = (index: number) => {
    setFormData((prev) => {
      const newAnswers = [...prev.answers];
      newAnswers.splice(index, 1);
      return { ...prev, answers: newAnswers };
    });
  };

  const handleEditQuestion = (question: Question) => {
    setFormData({
      id: question.id,
      text: question.text,
      type: question.type,
      answers: question.answers || getDefaultAnswersForType(question.type),
    });
    setQuestionPoints(question.points || 2.0);
    setEditingQuestion(question);
    setShowAddForm(true);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    setIsLoading(true);
    try {
      const result = await deleteQuestion(questionId);
      if (result.success) {
        toast({
          title: "Thành công",
          description: "Xóa câu hỏi thành công",
        });
        await loadQuestions();
      } else {
        toast({
          title: "Lỗi",
          description: result.message || "Không thể xóa câu hỏi",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi xóa câu hỏi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg border border-purple-200">
        <div>
          <h3 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Quản lý câu hỏi Quiz
          </h3>
          <p className="text-sm text-purple-700 mt-1">
            {questions.length > 0
              ? `Đã có ${questions.length} câu hỏi trong quiz này`
              : "Chưa có câu hỏi nào. Hãy thêm câu hỏi đầu tiên!"}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            resetForm();
            setEditingQuestion(null);
            setShowAddForm(!showAddForm);
          }}
          disabled={isLoading}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm câu hỏi
        </Button>
      </div>

      {showAddForm && (
        <Card className="shadow-lg border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              {editingQuestion ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Question Content */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Edit className="h-4 w-4 text-purple-600" />
                Nội dung câu hỏi
                <Badge variant="secondary" className="text-xs">
                  Bắt buộc
                </Badge>
              </Label>
              <div className="border-2 border-purple-200 rounded-lg overflow-hidden">
                <Editor
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  init={editorConfig}
                  value={formData.text}
                  onEditorChange={(content) => {
                    setFormData((prev) => ({
                      ...prev,
                      text: content,
                    }));
                  }}
                />
              </div>
            </div>

            {/* Question Type */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600" />
                Loại câu hỏi
                <Badge variant="secondary" className="text-xs">
                  Bắt buộc
                </Badge>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: QuestionType) => {
                  setFormData((prev) => ({
                    ...prev,
                    type: value,
                    answers: getDefaultAnswersForType(value),
                  }));
                }}
              >
                <SelectTrigger className="border-purple-200 focus:ring-purple-500 focus:border-purple-500 h-12">
                  <SelectValue placeholder="Chọn loại câu hỏi" />
                </SelectTrigger>
                <SelectContent>
                  {questionTypeOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="py-3"
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={`h-4 w-4 ${option.color} mt-0.5`} />
                          <div>
                            <div className="flex items-start font-medium">
                              {option.label}
                            </div>
                            <div className="text-xs text-slate-500">
                              {option.description}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Question Points Section */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <Label className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-blue-600" />
                Điểm số câu hỏi
              </Label>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={questionPoints}
                  onChange={(e) =>
                    setQuestionPoints(Number.parseFloat(e.target.value) || 0)
                  }
                  className="w-24 border-blue-200 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="flex-1">
                  <p className="text-sm text-slate-600">
                    {formData.type === QuestionType.SINGLE_CHOICE &&
                      "Điểm nhận được khi chọn đúng đáp án"}
                    {formData.type === QuestionType.MULTIPLE_CHOICE &&
                      "Điểm tối đa (tham chiếu) - điểm thực tế tính từ các đáp án"}
                    {isTextBasedQuestion(formData.type) &&
                      "Điểm tối đa cho câu trả lời hoàn hảo"}
                  </p>
                </div>
              </div>
            </div>

            {/* Single Choice Answers */}
            {formData.type === QuestionType.SINGLE_CHOICE && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <Label className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  Đáp án (Chọn một)
                </Label>
                <div className="space-y-3">
                  {formData.answers.map((answer, index) => (
                    <div
                      key={index}
                      className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm"
                    >
                      <div className="flex gap-4 items-start">
                        <div className="flex-1">
                          <Label className="text-xs text-slate-600 mb-2 block">
                            Đáp án {String.fromCharCode(65 + index)}
                          </Label>
                          <div className="border border-slate-200 rounded-md overflow-hidden">
                            <Editor
                              apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                              init={{ ...editorConfig, height: 150 }}
                              value={answer.text}
                              onEditorChange={(content) => {
                                handleAnswerChange(index, "text", content);
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-3 pt-6">
                          <div className="flex items-center space-x-2 bg-blue-50 p-2 rounded-lg">
                            <input
                              type="radio"
                              name="single-choice-correct"
                              checked={answer.isCorrect}
                              onChange={() => {
                                handleAnswerChange(index, "isCorrect", true);
                              }}
                              className="w-4 h-4 text-blue-600 border-blue-300 focus:ring-blue-500"
                            />
                            <Label className="text-xs font-medium text-blue-700">
                              {answer.isCorrect ? "Đúng" : "Chọn"}
                            </Label>
                          </div>
                          {formData.answers.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => removeAnswer(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAnswer}
                  className="mt-3 border-blue-300 text-blue-700 hover:bg-blue-50 bg-transparent"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm đáp án
                </Button>
                <div className="mt-3 p-2 bg-blue-100 rounded text-sm">
                  <span className="font-medium">Đáp án đúng: </span>
                  <span className="text-blue-700">
                    {formData.answers.find((a) => a.isCorrect)?.text ||
                      "Chưa chọn đáp án đúng"}
                  </span>
                </div>
              </div>
            )}

            {/* Multiple Choice Answers */}
            {formData.type === QuestionType.MULTIPLE_CHOICE && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <Label className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Đáp án (Chọn nhiều)
                </Label>
                <div className="space-y-3">
                  {formData.answers.map((answer, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200"
                    >
                      <Checkbox
                        checked={answer.isCorrect}
                        onCheckedChange={(checked) =>
                          handleAnswerChange(index, "isCorrect", checked)
                        }
                        className="border-green-300 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                      <Input
                        placeholder={`Đáp án ${index + 1}`}
                        value={answer.text}
                        onChange={(e) =>
                          handleAnswerChange(index, "text", e.target.value)
                        }
                        className="flex-1 border-green-200 focus:ring-green-500 focus:border-green-500"
                      />
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-slate-600">Điểm:</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={answer.points || 0}
                          onChange={(e) =>
                            handleAnswerChange(
                              index,
                              "points",
                              Number.parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-16 text-xs border-green-200 focus:ring-green-500 focus:border-green-500"
                          disabled={!answer.isCorrect}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAnswer(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAnswer}
                  className="mt-3 border-green-300 text-green-700 hover:bg-green-50 bg-transparent"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm đáp án
                </Button>
                <div className="mt-3 p-2 bg-green-100 rounded text-sm">
                  <span className="font-medium">Tổng điểm đáp án đúng: </span>
                  <span className="text-green-700">
                    {formData.answers
                      .filter((a) => a.isCorrect)
                      .reduce((sum, a) => sum + (a.points || 0), 0)
                      .toFixed(1)}{" "}
                    / {questionPoints.toFixed(1)}
                  </span>
                </div>
              </div>
            )}

            {/* Text-based Questions */}
            {isTextBasedQuestion(formData.type) && (
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <Label className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
                  <Edit className="h-4 w-4 text-orange-600" />
                  Đáp án mẫu và chấm điểm tự động
                </Label>
                <div className="space-y-4">
                  {formData.answers.map((answer, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white rounded-lg border border-orange-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-medium text-slate-700">
                          Mức điểm {index + 1}
                        </Label>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-slate-600">
                            Điểm:
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            max={questionPoints}
                            step="0.5"
                            value={answer.points || 0}
                            onChange={(e) =>
                              handleAnswerChange(
                                index,
                                "points",
                                Number.parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-16 text-xs border-orange-200 focus:ring-orange-500 focus:border-orange-500"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAnswer(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-slate-600 mb-1 block">
                            Các đáp án được chấp nhận (mỗi dòng một đáp án):
                          </Label>
                          <Textarea
                            placeholder="useState hook quản lý state&#10;useState&#10;hook state"
                            value={answer.acceptedAnswers?.join("\n") || ""}
                            onChange={(e) =>
                              handleAnswerChange(
                                index,
                                "acceptedAnswers",
                                e.target.value
                                  .split("\n")
                                  .filter((line) => line.trim()),
                              )
                            }
                            className="border-orange-200 focus:ring-orange-500 focus:border-orange-500"
                            rows={3}
                          />
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`caseSensitive-${index}`}
                              checked={answer.caseSensitive || false}
                              onCheckedChange={(checked) =>
                                handleAnswerChange(
                                  index,
                                  "caseSensitive",
                                  checked,
                                )
                              }
                              className="border-orange-300 data-[state=checked]:bg-orange-600"
                            />
                            <Label
                              htmlFor={`caseSensitive-${index}`}
                              className="text-xs text-slate-600"
                            >
                              Phân biệt hoa/thường
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`exactMatch-${index}`}
                              checked={answer.exactMatch || false}
                              onCheckedChange={(checked) =>
                                handleAnswerChange(index, "exactMatch", checked)
                              }
                              className="border-orange-300 data-[state=checked]:bg-orange-600"
                            />
                            <Label
                              htmlFor={`exactMatch-${index}`}
                              className="text-xs text-slate-600"
                            >
                              So sánh chính xác
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newAnswer: Answer = {
                      text: "",
                      isCorrect: true,
                      acceptedAnswers: [],
                      caseSensitive: false,
                      exactMatch: false,
                      points: 1.0,
                    };
                    setFormData((prev) => ({
                      ...prev,
                      answers: [...prev.answers, newAnswer],
                    }));
                  }}
                  className="mt-3 border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm mức điểm
                </Button>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-purple-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingQuestion(null);
                  resetForm();
                }}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg px-8"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {editingQuestion ? "Cập nhật" : "Tạo câu hỏi"}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {isLoading && questions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-slate-300">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-slate-600 font-medium">
              Đang tải câu hỏi...
            </p>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border-2 border-dashed border-slate-300">
            <Brain className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 font-medium mb-2">
              Chưa có câu hỏi nào
            </p>
            <p className="text-sm text-slate-500">
              Hãy thêm câu hỏi đầu tiên để bắt đầu tạo quiz!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((question, index) => (
              <Card
                key={question.id}
                className="shadow-md hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-purple-500"
              >
                <Collapsible
                  open={expandedQuestions.has(question.id || "")}
                  onOpenChange={() => toggleExpanded(question.id || "")}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-purple-100 text-purple-700 rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <Badge
                              variant="outline"
                              className={`text-xs mb-1 ${
                                questionTypeOptions.find(
                                  (opt) => opt.value === question.type,
                                )?.color || "text-slate-600"
                              }`}
                            >
                              {getQuestionTypeLabel(question.type)}
                            </Badge>
                            <div
                              className="text-sm text-slate-700 line-clamp-2"
                              dangerouslySetInnerHTML={{
                                __html:
                                  question.text?.substring(0, 100) +
                                    (question.text?.length > 100
                                      ? "..."
                                      : "") || "",
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(question);
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <AlertCircle className="h-5 w-5 text-red-500" />
                                  Xác nhận xóa câu hỏi
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bạn có chắc chắn muốn xóa câu hỏi này? Hành
                                  động này không thể hoàn tác và sẽ ảnh hưởng
                                  đến kết quả quiz của học viên.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDelete(question.id || "")
                                  }
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Xóa câu hỏi
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          {expandedQuestions.has(question.id || "") ? (
                            <ChevronUp className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      {/* Question Content */}
                      <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                        <h4 className="font-semibold mb-3 text-slate-900 flex items-center gap-2">
                          <HelpCircle className="h-4 w-4 text-purple-600" />
                          Câu hỏi:
                        </h4>
                        <div
                          className="prose max-w-none text-slate-700"
                          dangerouslySetInnerHTML={{
                            __html: question.text || "",
                          }}
                        />
                      </div>

                      {/* Answers */}
                      {question.answers && question.answers.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-4 text-slate-900 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            Đáp án:
                          </h4>

                          {isTextBasedQuestion(question.type) ? (
                            // Text-based question answers
                            <div className="space-y-4">
                              <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                                <h5 className="font-medium text-sm mb-2 text-green-800">
                                  Đáp án tham khảo:
                                </h5>
                                <div
                                  className="text-green-700"
                                  dangerouslySetInnerHTML={{
                                    __html: question.answers[0]?.text || "",
                                  }}
                                />
                              </div>

                              {question.answers[0]?.acceptedAnswers &&
                                question.answers[0].acceptedAnswers.length >
                                  0 && (
                                  <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                                    <h5 className="font-medium text-sm mb-2 text-blue-800">
                                      Các đáp án được chấp nhận:
                                    </h5>
                                    <div className="flex flex-wrap gap-2">
                                      {question.answers[0].acceptedAnswers.map(
                                        (accepted, idx) => (
                                          <Badge
                                            key={idx}
                                            variant="outline"
                                            className="bg-white text-blue-700 border-blue-300"
                                          >
                                            {accepted}
                                          </Badge>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 bg-slate-50 p-4 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                  <span>
                                    Phân biệt hoa/thường:{" "}
                                    <strong>
                                      {question.answers[0]?.caseSensitive
                                        ? "Có"
                                        : "Không"}
                                    </strong>
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-3 w-3 text-blue-500" />
                                  <span>
                                    So sánh chính xác:{" "}
                                    <strong>
                                      {question.answers[0]?.exactMatch
                                        ? "Có"
                                        : "Không"}
                                    </strong>
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="h-3 w-3 text-orange-500" />
                                  <span>
                                    Điểm số:{" "}
                                    <strong>
                                      {(
                                        (question.answers[0]?.points || 1.0) *
                                        100
                                      ).toFixed(0)}
                                      %
                                    </strong>
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            // Multiple choice answers
                            <div className="grid gap-3">
                              {question.answers.map(
                                (answer: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className={`p-4 border rounded-lg transition-colors ${
                                      answer.isCorrect
                                        ? "bg-green-50 border-green-200 shadow-sm"
                                        : "bg-slate-50 border-slate-200"
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div
                                        className={`rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold ${
                                          answer.isCorrect
                                            ? "bg-green-200 text-green-800"
                                            : "bg-slate-200 text-slate-600"
                                        }`}
                                      >
                                        {String.fromCharCode(65 + idx)}
                                      </div>
                                      <div
                                        className="flex-1"
                                        dangerouslySetInnerHTML={{
                                          __html: answer.text || "",
                                        }}
                                      />
                                      {answer.isCorrect && (
                                        <Badge className="bg-green-200 text-green-800 border-green-300">
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                          Đúng
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
