"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils";
import {
  Lesson,
  LessonType,
  SyllabusItem,
  SyllabusItemType,
} from "@/types/course/types";
import { motion } from "framer-motion";
import {
  Book,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  HelpCircle,
  Loader2,
  Lock,
  MessageSquare,
  PlayCircle,
  Plus,
  Users,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import { GroupedSyllabusItem } from "@/actions/syllabusActions";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

interface SyllabusDisplayProps {
  syllabusData: GroupedSyllabusItem[];
  className?: string;
  isLoading?: boolean;
  selectedClassId?: string;
  courseId?: string;
  isEnrolled?: boolean;
}

const SyllabusDisplay = ({
  syllabusData,
  className,
  isLoading = false,
  selectedClassId,
  courseId,
  isEnrolled = false,
}: SyllabusDisplayProps) => {
  const router = useRouter();
  const [collapsedDays, setCollapsedDays] = useState<Record<number, boolean>>(
    {},
  );

  // Toggle collapse state for a specific day
  const toggleDayCollapse = (day: number) => {
    setCollapsedDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
  };

  // Handle lesson click
  const handleLessonClick = (lesson: {
    id: string;
    isFreePreview: boolean;
  }) => {
    if (!courseId) return;

    // If user is enrolled, allow access to all lessons
    if (isEnrolled) {
      router.push(`/course/${courseId}/lesson/${lesson.id}`);
      return;
    }

    // If user is not enrolled, only allow free preview lessons
    if (lesson.isFreePreview) {
      router.push(`/course/${courseId}/lesson/${lesson.id}`);
    } else {
      toast.error("Vui lòng đăng ký khóa học để xem bài học này");
    }
  };

  // Icon mapping cho lesson types
  const getLessonIcon = (lessonType: LessonType) => {
    switch (lessonType) {
      case LessonType.VIDEO:
        return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case LessonType.QUIZ:
        return <HelpCircle className="h-4 w-4 text-green-500" />;
      case LessonType.BLOG:
        return <FileText className="h-4 w-4 text-orange-500" />;
      case LessonType.MIXED:
        return <BookOpen className="h-4 w-4 text-purple-500" />;
      default:
        return <BookOpen className="h-4 w-4 text-gray-500" />;
    }
  };

  // Format thời gian
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} phút`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  // Format scheduled time cho live session
  const formatScheduledTime = (scheduledAt: string) => {
    const date = new Date(scheduledAt);
    return {
      date: date.toLocaleDateString("vi-VN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  if (isLoading) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          <span className="text-gray-600">Đang tải lộ trình học...</span>
        </div>
      </Card>
    );
  }

  if (!syllabusData || syllabusData.length === 0) {
    return (
      <Card className={cn("p-8 text-center", className)}>
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          Chưa có lộ trình học, syllabusData: {syllabusData.length}
        </h3>
        <p className="text-gray-500">
          Lộ trình học cho lớp này chưa được thiết lập hoặc chưa có sẵn.
        </p>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-orange-500" />
          Lộ trình học
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs py-1 px-2 bg-slate-50">
            <span className="font-semibold mr-1">Số ngày:</span>
            {syllabusData.length}
          </Badge>
          <Badge variant="outline" className="text-xs py-1 px-2 bg-slate-50">
            <span className="font-semibold mr-1">Tổng hoạt động:</span>
            {syllabusData.reduce((acc, day) => acc + day.items.length, 0)}
          </Badge>
        </div>
      </div>

      <motion.div
        className="space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {syllabusData.map((dayGroup) => (
          <motion.div key={dayGroup.day} variants={itemVariants}>
            <Collapsible
              open={!collapsedDays[dayGroup.day]}
              onOpenChange={() => toggleDayCollapse(dayGroup.day)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all duration-200">
                <div className="flex items-center gap-2">
                  <Plus
                    className={cn(
                      "h-4 w-4 text-orange-500 transition-transform duration-200",
                      !collapsedDays[dayGroup.day] && "rotate-45",
                    )}
                  />
                  <h3 className="font-semibold text-gray-700">
                    Ngày {dayGroup.day}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {dayGroup.items.length} hoạt động
                  </span>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4">
                <motion.ul
                  className="mt-2 space-y-2"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {dayGroup.items.map((item) => (
                    <motion.li key={item.id} variants={itemVariants}>
                      {item.itemType === SyllabusItemType.LIVE_SESSION &&
                      item.classSession ? (
                        <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-all duration-200 border-l-4 border-l-red-400">
                          <div className="flex items-center gap-2">
                            <Video className="h-4 w-4 text-red-500" />
                            <span className="text-gray-700">
                              {item.classSession.topic}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-red-100 text-red-700 text-xs">
                              Live Session
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatDuration(
                                item.classSession.durationMinutes,
                              )}
                            </span>
                          </div>
                        </div>
                      ) : item.itemType === SyllabusItemType.LESSON &&
                        item.lesson ? (
                        <div
                          className={`flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-all duration-200 border-l-4 border-l-blue-400 ${
                            isEnrolled || item.lesson.isFreePreview
                              ? "cursor-pointer"
                              : "cursor-not-allowed opacity-50"
                          }`}
                          onClick={() => {
                            if (item.lesson) {
                              handleLessonClick(item.lesson);
                            }
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {getLessonIcon(item.lesson.type)}
                            <span className="text-gray-700">
                              {item.lesson.title}
                            </span>
                            {!isEnrolled && !item.lesson.isFreePreview && (
                              <Lock className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {item.lesson.isFreePreview && (
                              <Badge
                                variant="secondary"
                                className="bg-orange-100 text-orange-600 hover:bg-orange-200"
                              >
                                Preview
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              {formatDuration(
                                item.lesson.estimatedDurationMinutes,
                              )}
                            </span>
                          </div>
                        </div>
                      ) : null}
                    </motion.li>
                  ))}
                </motion.ul>
              </CollapsibleContent>
            </Collapsible>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default SyllabusDisplay;
