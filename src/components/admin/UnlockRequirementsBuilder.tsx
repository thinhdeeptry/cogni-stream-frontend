"use client";

import { useEffect, useState } from "react";

import { UnlockRequirement, UnlockRequirementType } from "@/types/course/types";
import {
  AlertCircle,
  BookOpen,
  Brain,
  Clock,
  Eye,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  getLessonsForDropdown,
  getQuizLessonsForDropdown,
} from "@/actions/courseAction";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface UnlockRequirementsBuilderProps {
  requirements: UnlockRequirement[];
  onChange: (requirements: UnlockRequirement[]) => void;
  courseId: string;
  currentLessonId?: string;
  onValidationChange?: (isValid: boolean, errors: string[]) => void; // New callback for validation status
}

// Helper function to validate all requirements (can be used by parent components)
export const validateAllRequirements = (
  requirements: UnlockRequirement[],
): { isValid: boolean; errors: string[] } => {
  const allErrors: string[] = [];
  let isValid = true;

  requirements.forEach((requirement, index) => {
    const errors: string[] = [];

    if (!requirement.title.trim()) {
      errors.push("Tiêu đề là bắt buộc");
    }

    if (
      requirement.type === UnlockRequirementType.WATCH_LESSON &&
      !requirement.targetLessonId
    ) {
      errors.push("Cần chọn bài học mục tiêu");
    }

    if (
      requirement.type === UnlockRequirementType.COMPLETE_QUIZ &&
      !requirement.targetQuizId
    ) {
      errors.push("Cần chọn quiz mục tiêu");
    }

    if (
      requirement.type === UnlockRequirementType.WAIT_TIME &&
      (!requirement.waitTimeMinutes || requirement.waitTimeMinutes <= 0)
    ) {
      errors.push("Thời gian chờ phải lớn hơn 0");
    }

    if (errors.length > 0) {
      isValid = false;
      allErrors.push(`Điều kiện ${index + 1}: ${errors.join(", ")}`);
    }
  });

  return { isValid, errors: allErrors };
};

const requirementTypeOptions = [
  {
    value: UnlockRequirementType.WATCH_LESSON,
    label: "Xem bài học",
    icon: Eye,
    description: "Yêu cầu xem hoàn chỉnh một bài học cụ thể",
    color: "bg-blue-500",
  },
  //   {
  //     value: UnlockRequirementType.READ_ARTICLE,
  //     label: "Đọc tài liệu",
  //     icon: BookOpen,
  //     description: "Yêu cầu đọc tài liệu hoặc bài viết",
  //     color: "bg-green-500"
  //   },
  {
    value: UnlockRequirementType.COMPLETE_QUIZ,
    label: "Hoàn thành quiz",
    icon: Brain,
    description: "Yêu cầu hoàn thành một quiz khác",
    color: "bg-purple-500",
  },
  {
    value: UnlockRequirementType.WAIT_TIME,
    label: "Chờ thời gian",
    icon: Clock,
    description: "Yêu cầu chờ một khoảng thời gian",
    color: "bg-orange-500",
  },
];

export default function UnlockRequirementsBuilder({
  requirements,
  onChange,
  courseId,
  currentLessonId,
  onValidationChange,
}: UnlockRequirementsBuilderProps) {
  const [expandedRequirement, setExpandedRequirement] = useState<string | null>(
    null,
  );
  const [lessons, setLessons] = useState<any[]>([]);
  const [quizLessons, setQuizLessons] = useState<any[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  // Validate all requirements and notify parent component
  useEffect(() => {
    if (onValidationChange) {
      const allErrors: string[] = [];
      let isValid = true;

      requirements.forEach((requirement, index) => {
        const errors = validateRequirement(requirement);
        if (errors.length > 0) {
          isValid = false;
          allErrors.push(`Điều kiện ${index + 1}: ${errors.join(", ")}`);
        }
      });

      onValidationChange(isValid, allErrors);
    }
  }, [requirements, onValidationChange]);

  // Load lessons for dropdown
  useEffect(() => {
    const loadLessons = async () => {
      setLoadingLessons(true);
      try {
        const result = await getLessonsForDropdown(courseId);
        if (result.success) {
          // Filter out current lesson if editing
          const filteredLessons = result.data.lessons.filter(
            (lesson: any) => lesson.id !== currentLessonId,
          );
          setLessons(filteredLessons);
          console.log("data result: ", result.data);
          console.log("filteredLessons: ", filteredLessons);
        } else {
          toast.error("Không thể tải danh sách bài học");
        }
      } catch (error) {
        toast.error("Lỗi khi tải danh sách bài học");
      } finally {
        setLoadingLessons(false);
      }
    };

    const loadQuizLessons = async () => {
      setLoadingQuizzes(true);
      try {
        const result = await getQuizLessonsForDropdown(courseId);
        if (result.success) {
          // Filter out current lesson if editing
          const filteredQuizzes = result.data.filter(
            (lesson: any) => lesson.id !== currentLessonId,
          );
          setQuizLessons(filteredQuizzes);
        } else {
          toast.error("Không thể tải danh sách quiz");
        }
      } catch (error) {
        toast.error("Lỗi khi tải danh sách quiz");
      } finally {
        setLoadingQuizzes(false);
      }
    };

    if (courseId) {
      loadLessons();
      loadQuizLessons();
    }
  }, [courseId, currentLessonId]);

  const addRequirement = () => {
    const newRequirement: UnlockRequirement = {
      id: `temp-${Date.now()}`, // Temporary ID
      type: UnlockRequirementType.WATCH_LESSON,
      title: "",
      description: "",
      isRequired: true,
      order: requirements.length,
    };

    onChange([...requirements, newRequirement]);
    setExpandedRequirement(newRequirement.id!);
  };

  const updateRequirement = (
    id: string,
    updates: Partial<UnlockRequirement>,
  ) => {
    const updated = requirements.map((req) =>
      req.id === id ? { ...req, ...updates } : req,
    );
    onChange(updated);
  };

  const deleteRequirement = (id: string) => {
    const filtered = requirements.filter((req) => req.id !== id);
    // Update order for remaining requirements
    const reordered = filtered.map((req, index) => ({
      ...req,
      order: index,
    }));
    onChange(reordered);

    if (expandedRequirement === id) {
      setExpandedRequirement(null);
    }
  };

  const moveRequirement = (id: string, direction: "up" | "down") => {
    const currentIndex = requirements.findIndex((req) => req.id === id);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === requirements.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const newRequirements = [...requirements];

    // Swap elements
    [newRequirements[currentIndex], newRequirements[newIndex]] = [
      newRequirements[newIndex],
      newRequirements[currentIndex],
    ];

    // Update order
    const reordered = newRequirements.map((req, index) => ({
      ...req,
      order: index,
    }));

    onChange(reordered);
  };

  const getTypeIcon = (type: UnlockRequirementType) => {
    const option = requirementTypeOptions.find((opt) => opt.value === type);
    return option ? option.icon : AlertCircle;
  };

  const getTypeColor = (type: UnlockRequirementType) => {
    const option = requirementTypeOptions.find((opt) => opt.value === type);
    return option ? option.color : "bg-gray-500";
  };

  const validateRequirement = (requirement: UnlockRequirement): string[] => {
    const errors: string[] = [];

    if (!requirement.title.trim()) {
      errors.push("Tiêu đề là bắt buộc");
    }

    if (
      requirement.type === UnlockRequirementType.WATCH_LESSON &&
      !requirement.targetLessonId
    ) {
      errors.push("Cần chọn bài học mục tiêu");
    }

    if (
      requirement.type === UnlockRequirementType.COMPLETE_QUIZ &&
      !requirement.targetQuizId
    ) {
      errors.push("Cần chọn quiz mục tiêu");
    }

    if (
      requirement.type === UnlockRequirementType.WAIT_TIME &&
      (!requirement.waitTimeMinutes || requirement.waitTimeMinutes <= 0)
    ) {
      errors.push("Thời gian chờ phải lớn hơn 0");
    }

    return errors;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-blue-100 to-indigo-100 p-3 border-b border-blue-200">
        <div>
          <p className="text-sm text-indigo-700 mt-1">
            {requirements.length > 0
              ? `Đã có ${requirements.length} điều kiện trong quiz này`
              : "Chưa có điều kiện nào. Hãy thêm điều kiện đầu tiên!"}
          </p>
        </div>
        <Button
          type="button"
          onClick={addRequirement}
          size="sm"
          className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold shadow-md hover:from-blue-600 hover:to-indigo-600 transition-colors duration-200 rounded-lg px-4 py-2 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Thêm điều kiện
        </Button>
      </div>
      {requirements.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Chưa có điều kiện mở khóa nào. Click "Thêm điều kiện" để bắt
                đầu.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requirements
            .sort((a, b) => a.order - b.order)
            .map((requirement, index) => {
              const Icon = getTypeIcon(requirement.type);
              const errors = validateRequirement(requirement);
              const isExpanded = expandedRequirement === requirement.id;

              return (
                <Card
                  key={requirement.id}
                  className={`${errors.length > 0 ? "border-red-200" : ""}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                          <div
                            className={`p-2 rounded-lg ${getTypeColor(requirement.type)} text-white`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">
                              {requirement.title || `Điều kiện ${index + 1}`}
                            </h4>
                            {requirement.isRequired ? (
                              <Badge variant="destructive" className="text-xs">
                                Bắt buộc
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Tùy chọn
                              </Badge>
                            )}
                            {errors.length > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {errors.length} lỗi
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {
                              requirementTypeOptions.find(
                                (opt) => opt.value === requirement.type,
                              )?.label
                            }
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveRequirement(requirement.id!, "up")}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            moveRequirement(requirement.id!, "down")
                          }
                          disabled={index === requirements.length - 1}
                        >
                          ↓
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRequirement(requirement.id!)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedRequirement(
                              isExpanded ? null : requirement.id!,
                            )
                          }
                        >
                          {isExpanded ? "−" : "+"}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-0 space-y-4">
                      {errors.length > 0 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <h5 className="text-sm font-medium text-red-800 mb-2">
                            Lỗi cần sửa:
                          </h5>
                          <ul className="text-sm text-red-700 space-y-1">
                            {errors.map((error, idx) => (
                              <li key={idx}>• {error}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor={`req-type-${requirement.id}`}>
                              Loại điều kiện
                            </Label>
                            <Select
                              value={requirement.type}
                              onValueChange={(value) =>
                                updateRequirement(requirement.id!, {
                                  type: value as UnlockRequirementType,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {requirementTypeOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    <div className="flex items-center gap-2">
                                      <option.icon className="h-4 w-4" />
                                      {option.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label
                              htmlFor={`req-title-${requirement.id}`}
                              className="flex items-center gap-1"
                            >
                              Tiêu đề
                              <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id={`req-title-${requirement.id}`}
                              value={requirement.title}
                              onChange={(e) =>
                                updateRequirement(requirement.id!, {
                                  title: e.target.value,
                                })
                              }
                              placeholder="Nhập tiêu đề cho điều kiện"
                              className={`${
                                !requirement.title.trim()
                                  ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                  : "border-green-300 focus:border-green-500 focus:ring-green-200"
                              }`}
                              required
                            />
                            {!requirement.title.trim() && (
                              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Tiêu đề là bắt buộc
                              </p>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`req-required-${requirement.id}`}
                              checked={requirement.isRequired}
                              onCheckedChange={(checked) =>
                                updateRequirement(requirement.id!, {
                                  isRequired: checked,
                                })
                              }
                            />
                            <Label htmlFor={`req-required-${requirement.id}`}>
                              Bắt buộc
                            </Label>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <Label
                              htmlFor={`req-description-${requirement.id}`}
                            >
                              Mô tả
                            </Label>
                            <Textarea
                              id={`req-description-${requirement.id}`}
                              value={requirement.description || ""}
                              onChange={(e) =>
                                updateRequirement(requirement.id!, {
                                  description: e.target.value,
                                })
                              }
                              placeholder="Mô tả chi tiết cho điều kiện này"
                              rows={3}
                            />
                          </div>

                          {/* Specific fields based on requirement type */}
                          {requirement.type ===
                            UnlockRequirementType.WAIT_TIME && (
                            <div>
                              <Label htmlFor={`req-wait-${requirement.id}`}>
                                Thời gian chờ (phút)
                              </Label>
                              <Input
                                id={`req-wait-${requirement.id}`}
                                type="number"
                                min="1"
                                value={requirement.waitTimeMinutes || ""}
                                onChange={(e) =>
                                  updateRequirement(requirement.id!, {
                                    waitTimeMinutes:
                                      parseInt(e.target.value) || undefined,
                                  })
                                }
                                placeholder="Ví dụ: 1440 (24 giờ)"
                              />
                            </div>
                          )}

                          {requirement.type ===
                            UnlockRequirementType.WATCH_LESSON && (
                            <div>
                              <Label htmlFor={`req-lesson-${requirement.id}`}>
                                Bài học mục tiêu
                              </Label>
                              <Select
                                value={requirement.targetLessonId || ""}
                                onValueChange={(value) => {
                                  // Ignore disabled placeholder values
                                  if (
                                    value === "__loading__" ||
                                    value === "__empty__"
                                  )
                                    return;
                                  updateRequirement(requirement.id!, {
                                    targetLessonId: value,
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={
                                      loadingLessons
                                        ? "Đang tải..."
                                        : "Chọn bài học"
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {loadingLessons ? (
                                    <SelectItem value="__loading__" disabled>
                                      Đang tải danh sách bài học...
                                    </SelectItem>
                                  ) : lessons.length === 0 ? (
                                    <SelectItem value="__empty__" disabled>
                                      Không có bài học nào
                                    </SelectItem>
                                  ) : (
                                    lessons.map((lesson) => (
                                      <SelectItem
                                        key={lesson.id}
                                        value={lesson.id}
                                      >
                                        <div className="flex items-center gap-2">
                                          <Eye className="h-4 w-4" />
                                          <span>{lesson.title}</span>
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {lesson.type}
                                          </Badge>
                                        </div>
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground mt-1">
                                Học viên cần xem hoàn chỉnh bài học này
                              </p>
                            </div>
                          )}

                          {requirement.type ===
                            UnlockRequirementType.COMPLETE_QUIZ && (
                            <div>
                              <Label htmlFor={`req-quiz-${requirement.id}`}>
                                Quiz mục tiêu
                              </Label>
                              <Select
                                value={requirement.targetQuizId || ""}
                                onValueChange={(value) => {
                                  // Ignore disabled placeholder values
                                  if (
                                    value === "__loading__" ||
                                    value === "__empty__"
                                  )
                                    return;
                                  updateRequirement(requirement.id!, {
                                    targetQuizId: value,
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={
                                      loadingQuizzes
                                        ? "Đang tải..."
                                        : "Chọn quiz"
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {loadingQuizzes ? (
                                    <SelectItem value="__loading__" disabled>
                                      Đang tải danh sách quiz...
                                    </SelectItem>
                                  ) : quizLessons.length === 0 ? (
                                    <SelectItem value="__empty__" disabled>
                                      Không có quiz nào
                                    </SelectItem>
                                  ) : (
                                    quizLessons.map((quiz) => (
                                      <SelectItem key={quiz.id} value={quiz.id}>
                                        <div className="flex items-center gap-2">
                                          <Brain className="h-4 w-4" />
                                          <span>{quiz.title}</span>
                                        </div>
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground mt-1">
                                Học viên cần hoàn thành quiz này với điểm đạt
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
        </div>
      )}

      {requirements.length > 0 && (
        <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
          <p className="font-medium mb-1">💡 Lưu ý:</p>
          <ul className="space-y-1 text-xs">
            <li>
              • Học viên sẽ cần hoàn thành tất cả điều kiện "Bắt buộc" để mở
              khóa quiz
            </li>
            <li>
              • Điều kiện "Tùy chọn" sẽ giúp tăng điểm hoặc có lợi ích khác
            </li>
            <li>
              • Thứ tự các điều kiện sẽ được hiển thị theo thứ tự này cho học
              viên
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
