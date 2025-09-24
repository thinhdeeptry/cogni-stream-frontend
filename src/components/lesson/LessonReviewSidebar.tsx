"use client";

import { useState } from "react";

import type { Question } from "@/types/assessment/types";
import { LessonType } from "@/types/course/types";
import {
  AlertCircle,
  BookOpen,
  Brain,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Globe,
  RotateCcw,
  Timer,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface LessonReviewSidebarProps {
  title: string;
  lessonType: string;
  videoUrl?: string;
  estimatedDurationMinutes?: number | null;
  isFreePreview: boolean;
  isPublished: boolean;
  passPercent?: number;
  timeLimit?: number | null;
  maxAttempts?: number | null;
  retryDelay?: number | null;
  blockDuration?: number | null;
  unlockRequirements?: any[];
  questions?: Question[];
  hasContent?: boolean;
}

export default function LessonReviewSidebar({
  title,
  lessonType,
  videoUrl,
  estimatedDurationMinutes,
  isFreePreview,
  isPublished,
  passPercent,
  timeLimit,
  maxAttempts,
  retryDelay,
  blockDuration,
  unlockRequirements = [],
  questions = [],
  hasContent = false,
}: LessonReviewSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "basic",
    "quiz",
  ]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  };

  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case LessonType.VIDEO:
        return <Video className="h-4 w-4 text-red-500" />;
      case LessonType.BLOG:
        return <FileText className="h-4 w-4 text-blue-500" />;
      case LessonType.MIXED:
        return <BookOpen className="h-4 w-4 text-green-500" />;
      case LessonType.QUIZ:
        return <Brain className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLessonTypeLabel = (type: string) => {
    switch (type) {
      case LessonType.VIDEO:
        return "Video";
      case LessonType.BLOG:
        return "Bài viết";
      case LessonType.MIXED:
        return "Kết hợp";
      case LessonType.QUIZ:
        return "Quiz";
      default:
        return "Không xác định";
    }
  };

  const getCompletionStatus = () => {
    const issues = [];

    if (!title.trim()) issues.push("Thiếu tiêu đề");

    if (lessonType === LessonType.VIDEO && !videoUrl) {
      issues.push("Thiếu URL video");
    }

    if (lessonType === LessonType.QUIZ && questions.length === 0) {
      issues.push("Chưa có câu hỏi");
    }

    if (
      (lessonType === LessonType.BLOG || lessonType === LessonType.MIXED) &&
      !hasContent
    ) {
      issues.push("Chưa có nội dung");
    }

    return issues;
  };

  const issues = getCompletionStatus();
  const isComplete = issues.length === 0;

  return (
    <div className="w-full border-0 shadow-lg rounded-xl bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-4 space-y-6">
        {/* <div className="w-full h-screen overflow-hidden fixed top-0 right-0">
      <div className="p-4 space-y-6 h-full overflow-y-auto"> */}
        {/* Header Card */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              <h3 className="font-semibold text-gray-900">Xem trước bài học</h3>
            </div>
            <p className="text-sm text-gray-600">
              Tổng quan về nội dung bài học
            </p>
          </CardHeader>
        </Card>

        {/* Completion Status */}
        <Card
          className={`shadow-lg border-0 ${isComplete ? "bg-green-50/80 backdrop-blur-sm" : "bg-orange-50/80 backdrop-blur-sm"}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              {isComplete ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-orange-600" />
              )}
              <span
                className={`text-sm font-medium ${isComplete ? "text-green-800" : "text-orange-800"}`}
              >
                {isComplete ? "Sẵn sàng xuất bản" : "Cần hoàn thiện"}
              </span>
            </div>
            {!isComplete && (
              <ul className="text-xs text-orange-700 space-y-1">
                {issues.map((issue, index) => (
                  <li key={index}>• {issue}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Basic Info Section */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader
            className="pb-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
            onClick={() => toggleSection("basic")}
          >
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Thông tin cơ bản
              </div>
              {expandedSections.includes("basic") ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </CardTitle>
          </CardHeader>
          {expandedSections.includes("basic") && (
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Tiêu đề</p>
                <p className="text-sm font-medium text-gray-900">
                  {title || "Chưa có tiêu đề"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Loại bài học</p>
                <div className="flex items-center gap-2">
                  {getLessonTypeIcon(lessonType)}
                  <span className="text-sm">
                    {getLessonTypeLabel(lessonType)}
                  </span>
                </div>
              </div>

              {videoUrl && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Video URL</p>
                  <p className="text-xs text-gray-700 truncate">{videoUrl}</p>
                </div>
              )}

              {estimatedDurationMinutes && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Thời lượng ước tính
                  </p>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-blue-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {estimatedDurationMinutes} phút
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Badge
                  variant={isFreePreview ? "default" : "secondary"}
                  className="text-xs"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  {isFreePreview ? "Xem thử" : "Trả phí"}
                </Badge>
                <Badge
                  variant={isPublished ? "default" : "secondary"}
                  className="text-xs"
                >
                  <Globe className="h-3 w-3 mr-1" />
                  {isPublished ? "Đã xuất bản" : "Nháp"}
                </Badge>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Quiz Settings Section */}
        {lessonType === LessonType.QUIZ && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader
              className="pb-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
              onClick={() => toggleSection("quiz")}
            >
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  Cài đặt Quiz
                </div>
                {expandedSections.includes("quiz") ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>
            {expandedSections.includes("quiz") && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Điểm đậu</p>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="text-sm font-medium">
                        {passPercent}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Thời gian</p>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-blue-500" />
                      <span className="text-sm">
                        {timeLimit ? `${timeLimit}p` : "∞"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Số lần làm</p>
                    <div className="flex items-center gap-1">
                      <RotateCcw className="h-3 w-3 text-orange-500" />
                      <span className="text-sm">{maxAttempts || "∞"}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Thời gian chờ</p>
                    <div className="flex items-center gap-1">
                      <Timer className="h-3 w-3 text-red-500" />
                      <span className="text-sm">
                        {retryDelay ? `${retryDelay}p` : "0p"}
                      </span>
                    </div>
                  </div>
                </div>

                {blockDuration && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs text-red-700">
                      <Timer className="h-3 w-3 inline mr-1" />
                      Khóa {blockDuration} phút khi hết lượt
                    </p>
                  </div>
                )}

                <Separator />

                <div>
                  <p className="text-xs text-gray-500 mb-2">
                    Câu hỏi ({questions.length})
                  </p>
                  {questions.length > 0 ? (
                    <div className="space-y-2">
                      {questions.slice(0, 3).map((question, index) => (
                        <div
                          key={index}
                          className="text-xs bg-gray-50 rounded p-2"
                        >
                          <span className="font-medium">Q{index + 1}:</span>{" "}
                          {question.text.substring(0, 30)}...
                        </div>
                      ))}
                      {questions.length > 3 && (
                        <p className="text-xs text-gray-500">
                          +{questions.length - 3} câu hỏi khác
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">
                      Chưa có câu hỏi nào
                    </p>
                  )}
                </div>

                {unlockRequirements.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-gray-500 mb-2">
                        Điều kiện mở khóa ({unlockRequirements.length})
                      </p>
                      <div className="space-y-2">
                        {unlockRequirements.slice(0, 2).map((req, index) => (
                          <div
                            key={index}
                            className="text-xs bg-blue-50 rounded p-2"
                          >
                            <span className="font-medium">{req.title}</span>
                            {req.isRequired && (
                              <Badge
                                variant="destructive"
                                className="ml-1 text-xs"
                              >
                                Bắt buộc
                              </Badge>
                            )}
                          </div>
                        ))}
                        {unlockRequirements.length > 2 && (
                          <p className="text-xs text-gray-500">
                            +{unlockRequirements.length - 2} điều kiện khác
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
