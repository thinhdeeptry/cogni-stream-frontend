"use client";

import { useEffect, useState } from "react";

import { Answer, Question, QuestionType } from "@/types/assessment/types";
import { Editor } from "@tinymce/tinymce-react";
import { ChevronDown, ChevronUp, Edit, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
import { Switch } from "@/components/ui/switch";
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
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set(),
  );

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
      toast.error("Không thể tải danh sách câu hỏi");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      text: "",
      type: QuestionType.SINGLE_CHOICE,
      answers: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
    });
  };

  const getDefaultAnswersForType = (type: QuestionType): Answer[] => {
    switch (type) {
      case QuestionType.SINGLE_CHOICE:
      case QuestionType.MULTIPLE_CHOICE:
        return [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
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
            points: 1.0,
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
      toast.error("Vui lòng nhập nội dung câu hỏi");
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
        toast.error("Vui lòng nhập đáp án hoặc các đáp án được chấp nhận");
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
        toast.error("Câu hỏi một lựa chọn phải có đúng một đáp án đúng");
        return false;
      }

      if (
        formData.type === QuestionType.MULTIPLE_CHOICE &&
        correctAnswers.length === 0
      ) {
        toast.error("Câu hỏi nhiều lựa chọn phải có ít nhất một đáp án đúng");
        return false;
      }

      // Check if all answers have content
      const emptyAnswers = formData.answers.filter(
        (answer) => !answer.text?.trim(),
      );
      if (emptyAnswers.length > 0) {
        toast.error("Vui lòng nhập nội dung cho tất cả các đáp án");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!lessonId) {
      toast.error("Vui lòng lưu bài học trước khi thêm câu hỏi");
      return;
    }

    setIsLoading(true);
    try {
      // Prepare data according to API documentation
      const questionData = {
        text: formData.text,
        type: formData.type,
        lessonId,
        answers: formData.answers.map((answer) => ({
          text: answer.text || "",
          isCorrect: answer.isCorrect,
          acceptedAnswers: answer.acceptedAnswers,
          caseSensitive: answer.caseSensitive,
          exactMatch: answer.exactMatch,
          points: answer.points,
        })),
        order: questions.length + 1,
      };

      let result;
      if (editingQuestion) {
        result = await updateQuestion(editingQuestion, questionData);
      } else {
        result = await createQuestion(questionData);
      }

      if (result.success) {
        toast.success(
          editingQuestion
            ? "Cập nhật câu hỏi thành công"
            : "Tạo câu hỏi thành công",
        );
        resetForm();
        setEditingQuestion(null);
        setShowAddForm(false);
        await loadQuestions();
      } else {
        toast.error(result.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi lưu câu hỏi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (question: Question) => {
    setFormData({
      id: question.id,
      text: question.text,
      type: question.type,
      answers: question.answers || getDefaultAnswersForType(question.type),
    });
    setEditingQuestion(question.id || "");
    setShowAddForm(true);
  };

  const handleDelete = async (questionId: string) => {
    setIsLoading(true);
    try {
      const result = await deleteQuestion(questionId);
      if (result.success) {
        toast.success("Xóa câu hỏi thành công");
        await loadQuestions();
      } else {
        toast.error(result.message || "Không thể xóa câu hỏi");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi xóa câu hỏi");
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Quản lý câu hỏi Quiz</h3>
        <Button
          type="button"
          onClick={() => {
            resetForm();
            setEditingQuestion(null);
            setShowAddForm(!showAddForm);
          }}
          disabled={isLoading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm câu hỏi
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingQuestion ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Question Content */}
            <div>
              <Label>Nội dung câu hỏi</Label>
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

            {/* Question Type */}
            <div>
              <Label>Loại câu hỏi</Label>
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={QuestionType.SINGLE_CHOICE}>
                    Một lựa chọn
                  </SelectItem>
                  <SelectItem value={QuestionType.MULTIPLE_CHOICE}>
                    Nhiều lựa chọn
                  </SelectItem>
                  <SelectItem value={QuestionType.SHORT_ANSWER}>
                    Trả lời ngắn
                  </SelectItem>
                  <SelectItem value={QuestionType.ESSAY}>Tự luận</SelectItem>
                  <SelectItem value={QuestionType.FILL_IN_BLANK}>
                    Điền từ
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Multiple Choice Answers */}
            {!isTextBasedQuestion(formData.type) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Các đáp án</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddAnswer}
                  >
                    Thêm đáp án
                  </Button>
                </div>

                {formData.answers.map((answer, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="flex-1">
                      <Editor
                        apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                        init={{ ...editorConfig, height: 150 }}
                        value={answer.text}
                        onEditorChange={(content) => {
                          handleAnswerChange(index, "text", content);
                        }}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-2 pt-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={answer.isCorrect}
                          onCheckedChange={(checked) => {
                            handleAnswerChange(index, "isCorrect", checked);
                          }}
                        />
                        <Label className="text-sm">Đúng</Label>
                      </div>
                      {formData.answers.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleRemoveAnswer(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Text-based Questions */}
            {isTextBasedQuestion(formData.type) && (
              <div className="space-y-4">
                {/* Reference Answer */}
                <div>
                  <Label>Đáp án tham khảo</Label>
                  <Editor
                    apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                    init={editorConfig}
                    value={formData.answers[0]?.text || ""}
                    onEditorChange={(content) => {
                      handleAnswerChange(0, "text", content);
                    }}
                  />
                </div>

                {/* Accepted Answers */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Các đáp án được chấp nhận</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddAnswer}
                    >
                      Thêm đáp án
                    </Button>
                  </div>

                  {(formData.answers[0]?.acceptedAnswers || []).map(
                    (accepted, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Input
                          value={accepted}
                          onChange={(e) =>
                            handleAcceptedAnswerChange(index, e.target.value)
                          }
                          placeholder="Nhập đáp án được chấp nhận"
                        />
                        {(formData.answers[0]?.acceptedAnswers || []).length >
                          1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleRemoveAnswer(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ),
                  )}
                </div>

                {/* Auto-grading Options */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="caseSensitive"
                      checked={formData.answers[0]?.caseSensitive || false}
                      onCheckedChange={(checked) => {
                        handleAnswerChange(0, "caseSensitive", checked);
                      }}
                    />
                    <Label htmlFor="caseSensitive" className="text-sm">
                      Phân biệt hoa/thường
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="exactMatch"
                      checked={formData.answers[0]?.exactMatch || false}
                      onCheckedChange={(checked) => {
                        handleAnswerChange(0, "exactMatch", checked);
                      }}
                    />
                    <Label htmlFor="exactMatch" className="text-sm">
                      So sánh chính xác
                    </Label>
                  </div>
                </div>

                {/* Points */}
                <div>
                  <Label htmlFor="points">Điểm số (0.0 - 1.0)</Label>
                  <Input
                    id="points"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.answers[0]?.points || 1.0}
                    onChange={(e) => {
                      const points = parseFloat(e.target.value) || 1.0;
                      handleAnswerChange(
                        0,
                        "points",
                        Math.min(Math.max(points, 0), 1),
                      );
                    }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingQuestion(null);
                  resetForm();
                }}
              >
                Hủy
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={isLoading}>
                {isLoading
                  ? "Đang lưu..."
                  : editingQuestion
                    ? "Cập nhật"
                    : "Tạo câu hỏi"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions List */}
      <div className="space-y-3">
        {isLoading && questions.length === 0 ? (
          <div className="text-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">
              Đang tải câu hỏi...
            </p>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Chưa có câu hỏi nào. Hãy thêm câu hỏi đầu tiên!</p>
          </div>
        ) : (
          questions.map((question, index) => (
            <Card key={question.id}>
              <Collapsible
                open={expandedQuestions.has(question.id || "")}
                onOpenChange={() => toggleExpanded(question.id || "")}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Câu {index + 1}</span>
                        <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {getQuestionTypeLabel(question.type)}
                        </span>
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
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc chắn muốn xóa câu hỏi này? Hành động
                                này không thể hoàn tác.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(question.id || "")}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Xóa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        {expandedQuestions.has(question.id || "") ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    {/* Question Content */}
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Câu hỏi:</h4>
                      <div
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: question.text || "",
                        }}
                      />
                    </div>

                    {/* Answers */}
                    {question.answers && question.answers.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Đáp án:</h4>

                        {isTextBasedQuestion(question.type) ? (
                          // Text-based question answers
                          <div className="space-y-2">
                            <div className="p-3 border rounded bg-green-50 border-green-200">
                              <h5 className="font-medium text-sm mb-1">
                                Đáp án tham khảo:
                              </h5>
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: question.answers[0]?.text || "",
                                }}
                              />
                            </div>

                            {question.answers[0]?.acceptedAnswers &&
                              question.answers[0].acceptedAnswers.length >
                                0 && (
                                <div className="p-3 border rounded bg-blue-50 border-blue-200">
                                  <h5 className="font-medium text-sm mb-1">
                                    Các đáp án được chấp nhận:
                                  </h5>
                                  <ul className="list-disc list-inside text-sm">
                                    {question.answers[0].acceptedAnswers.map(
                                      (accepted, idx) => (
                                        <li key={idx}>{accepted}</li>
                                      ),
                                    )}
                                  </ul>
                                </div>
                              )}

                            <div className="text-xs text-gray-500 space-y-1">
                              <p>
                                • Phân biệt hoa/thường:{" "}
                                {question.answers[0]?.caseSensitive
                                  ? "Có"
                                  : "Không"}
                              </p>
                              <p>
                                • So sánh chính xác:{" "}
                                {question.answers[0]?.exactMatch
                                  ? "Có"
                                  : "Không"}
                              </p>
                              <p>
                                • Điểm số: {question.answers[0]?.points || 1.0}
                              </p>
                            </div>
                          </div>
                        ) : (
                          // Multiple choice answers
                          <div className="space-y-2">
                            {question.answers.map(
                              (answer: any, idx: number) => (
                                <div
                                  key={idx}
                                  className={`p-3 border rounded ${
                                    answer.isCorrect
                                      ? "bg-green-50 border-green-200"
                                      : "bg-gray-50"
                                  }`}
                                >
                                  <div className="flex items-start gap-2">
                                    <span className="font-semibold">
                                      {String.fromCharCode(65 + idx)}.
                                    </span>
                                    <div
                                      className="flex-1"
                                      dangerouslySetInnerHTML={{
                                        __html: answer.text || "",
                                      }}
                                    />
                                    {answer.isCorrect && (
                                      <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                                        ✓ Đúng
                                      </span>
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
          ))
        )}
      </div>
    </div>
  );
}
