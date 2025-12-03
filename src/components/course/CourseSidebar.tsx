"use client";

import { useRouter } from "next/navigation";
import React, { useCallback, useMemo } from "react";

import { toast } from "@/hooks/use-toast";
import { Course, SyllabusItem, SyllabusItemType } from "@/types/course/types";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  MessageCircle,
  Video,
  X,
} from "lucide-react";

import { GroupedSyllabusItem } from "@/actions/syllabusActions";

import ChatSidebarIcon from "@/components/class-chat/ChatSidebarIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CompletedItem {
  id: string;
  type: "syllabusItem";
  title: string;
  day: number;
  order: number;
  itemType: "LESSON" | "LIVE_SESSION";
  completedAt: string;
  lesson?: {
    id: string;
    title: string;
    type: string;
  } | null;
  classSession?: {
    id: string;
    topic: string;
    scheduledAt: string;
  } | null;
}

interface CourseSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  classInfo: any;
  progress: number;
  syllabusData: GroupedSyllabusItem[];
  isLoadingSyllabus: boolean;
  currentItem: SyllabusItem | null;
  completedItems?: CompletedItem[];
  allItems: SyllabusItem[];
  isItemCompleted: (item: SyllabusItem) => boolean;
  canNavigateToItem: (item: SyllabusItem) => boolean;
  getNextAvailableItem: () => SyllabusItem | null;
  onItemSelect: (item: SyllabusItem) => void;
}

export const CourseSidebar: React.FC<CourseSidebarProps> = ({
  isOpen,
  onClose,
  course,
  classInfo,
  progress,
  syllabusData,
  isLoadingSyllabus,
  currentItem,
  completedItems = [],
  allItems,
  isItemCompleted,
  canNavigateToItem,
  getNextAvailableItem,
  onItemSelect,
}) => {
  const router = useRouter();
  // Memoized helper functions to prevent re-creation on every render
  // const isItemCompletedById = useCallback(
  //   (itemId: string): boolean => {
  //     return completedItems?.some((completed) => completed.id === itemId);
  //   },
  //   [completedItems],
  // );

  const getCompletedItemData = useCallback(
    (itemId: string): CompletedItem | null => {
      return (
        completedItems.find((completed) => completed.id === itemId) || null
      );
    },
    [completedItems],
  );
  const itemStatuses = useMemo(() => {
    const statuses = new Map();

    syllabusData.forEach((group) => {
      group.items.forEach((item) => {
        // Check completion status
        const isCompleted = completedItems?.some(
          (completed) => completed.id === item.id,
        );
        const isCurrent = currentItem?.id === item.id;

        // Calculate access permission inline to avoid function reference issues
        let canAccess = false;
        if (isCurrent) {
          canAccess = true; // Current item can always be accessed
        } else if (isCompleted) {
          canAccess = true; // Completed items can always be reviewed
        } else {
          canAccess = canNavigateToItem(item); // Use existing logic for other cases
        }

        const completedData =
          completedItems?.find((completed) => completed.id === item.id) || null;

        statuses.set(item.id, {
          isCompleted,
          isCurrent,
          canAccess,
          isReviewable: isCompleted && !isCurrent,
          isLocked: !canAccess && !isCompleted,
          completedAt: completedData?.completedAt,
        });
      });
    });

    return statuses;
  }, [syllabusData, completedItems, currentItem, canNavigateToItem]); // Add canNavigateToItem to dependencies
  // Helper function to get item status
  const getItemStatus = (item: SyllabusItem) => {
    return (
      itemStatuses.get(item.id) || {
        isCompleted: false,
        isCurrent: false,
        canAccess: false,
        isReviewable: false,
        isLocked: true,
        completedAt: undefined,
      }
    );
  };

  // Helper function to format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Helper function to format completed date
  const formatCompletedDate = (completedAt: string) => {
    return new Date(completedAt).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: isOpen ? 0 : "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 h-screen w-full sm:w-[230px] md:w-[250px] lg:w-[350px] xl:w-[400px] bg-white border-l shadow-2xl z-50 lg:z-30"
      style={{ height: "calc(100vh - 73px)", top: "73px" }}
    >
      <div className="h-full flex flex-col">
        {/* Compact Header - With Chat Icon */}
        <div className="flex-shrink-0 p-3 border-b border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-orange-100 rounded-lg">
                <BookOpen className="h-4 w-4 text-orange-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">
                Lộ trình học tập
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Syllabus Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3">
            {/* Compact Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">
                  Tiến độ học tập
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-600">
                    {!completedItems
                      ? 0
                      : `${completedItems.length}/${allItems.length}`}{" "}
                    bài
                  </span>
                  {completedItems?.length > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600 font-medium">
                        {
                          completedItems.filter(
                            (item) => item.itemType === "LESSON",
                          ).length
                        }{" "}
                        bài học
                      </span>
                      {completedItems.filter(
                        (item) => item.itemType === "LIVE_SESSION",
                      ).length > 0 && (
                        <>
                          <div className="w-1 h-1 bg-gray-400 rounded-full mx-1"></div>
                          <span className="text-xs text-red-600 font-medium">
                            {
                              completedItems.filter(
                                (item) => item.itemType === "LIVE_SESSION",
                              ).length
                            }{" "}
                            buổi học
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${allItems.length > 0 ? (!completedItems ? 0 : (completedItems.length / allItems.length) * 100) : 0}%`,
                  }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                  {completedItems && completedItems.length > 0
                    ? `${Math.round((completedItems.length / allItems.length) * 100)}% hoàn thành`
                    : "Chưa bắt đầu"}
                </span>
                {currentItem && (
                  <span className="text-xs text-orange-600 font-medium">
                    Đang học: Ngày{" "}
                    {
                      syllabusData.find((group) =>
                        group.items.some((item) => item.id === currentItem.id),
                      )?.day
                    }
                  </span>
                )}
              </div>
            </div>

            {/* Chat Icon */}
            {classInfo?.id && (
              <div className="mb-4">
                <ChatSidebarIcon
                  classId={classInfo.id}
                  className={classInfo.name}
                  unreadCount={0} // TODO: Implement unread count logic
                />
              </div>
            )}
            {isLoadingSyllabus ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i: number) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {syllabusData.map(
                  (group: GroupedSyllabusItem, groupIndex: number) => (
                    <motion.div
                      key={group.day}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: groupIndex * 0.1 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-2 pb-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-700">
                            {group.day}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-gray-700">
                          Ngày {group.day}
                        </div>
                        <div className="flex-1 h-px bg-gray-200"></div>
                      </div>

                      <div className="space-y-2 pl-4">
                        {group.items.map(
                          (item: SyllabusItem, itemIndex: number) => {
                            const itemStatus = getItemStatus(item); // ← Giờ đây safe
                            const canAccess = canNavigateToItem(item);
                            const {
                              isCompleted,
                              isCurrent,
                              isReviewable,
                              isLocked,
                              completedAt,
                            } = itemStatus;

                            // Debug log - chỉ log khi cần thiết
                            // console.log(`Item ${item.id} status:`, itemStatus);

                            return (
                              <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  delay:
                                    (groupIndex * group.items.length +
                                      itemIndex) *
                                    0.05,
                                }}
                              >
                                <Card
                                  className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                                    isCurrent && isCompleted
                                      ? "ring-2 ring-purple-400 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 shadow-md"
                                      : isCurrent
                                        ? "ring-2 ring-orange-400 bg-gradient-to-r from-orange-50 to-amber-50 shadow-md"
                                        : isReviewable
                                          ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:scale-[1.02] hover:shadow-md"
                                          : canAccess
                                            ? "hover:bg-gray-50 hover:scale-[1.02]"
                                            : "opacity-60 cursor-not-allowed"
                                  }`}
                                  onClick={() => {
                                    // Check if user can access this item
                                    if (!canAccess) {
                                      console.log(
                                        "Access denied for item:",
                                        item,
                                      );
                                      const nextAvailable =
                                        getNextAvailableItem();
                                      toast({
                                        title: "❌ Không thể bỏ qua bài học",
                                        description: nextAvailable
                                          ? `Bạnnn cần hoàn thành các bài học trước đó. Bài học tiếp theo: "${
                                              nextAvailable.itemType ===
                                              SyllabusItemType.LESSON
                                                ? nextAvailable.lesson?.title
                                                : nextAvailable.classSession
                                                    ?.topic
                                            }"`
                                          : "Bạn cần hoàn thành tất cả các bài học trước đó.",
                                        variant: "destructive",
                                      });
                                      return;
                                    }

                                    // Show different messages based on item status
                                    if (isCurrent && isCompleted) {
                                      const completedDate = completedAt
                                        ? formatCompletedDate(completedAt)
                                        : "";
                                      toast({
                                        title: "🔄 Ôn tập lại",
                                        description: `Đang ôn tập: "${
                                          item.itemType ===
                                          SyllabusItemType.LESSON
                                            ? item.lesson?.title
                                            : item.classSession?.topic
                                        }"${completedDate ? ` (Đã học: ${completedDate})` : ""}`,
                                        duration: 2500,
                                      });
                                    } else if (isReviewable) {
                                      const completedDate = completedAt
                                        ? formatCompletedDate(completedAt)
                                        : "";
                                      toast({
                                        title: "📚 Xem lại bài học",
                                        description: `Đang mở lại: "${
                                          item.itemType ===
                                          SyllabusItemType.LESSON
                                            ? item.lesson?.title
                                            : item.classSession?.topic
                                        }"${completedDate ? ` (Hoàn thành: ${completedDate})` : ""}`,
                                        duration: 2000,
                                      });
                                    } else if (isCurrent) {
                                      toast({
                                        title: "📖 Tiếp tục học",
                                        description: `Đang học: "${
                                          item.itemType ===
                                          SyllabusItemType.LESSON
                                            ? item.lesson?.title
                                            : item.classSession?.topic
                                        }"`,
                                        duration: 1500,
                                      });
                                    }

                                    onItemSelect(item);
                                  }}
                                >
                                  <CardContent className="p-3">
                                    <div className="space-y-2.5">
                                      {/* Title with inline icons */}
                                      <div className="flex items-center justify-between">
                                        <h4
                                          className={`text-sm font-semibold leading-tight ${
                                            isCurrent && isCompleted
                                              ? "text-purple-800"
                                              : isCompleted
                                                ? "text-green-800"
                                                : "text-gray-900"
                                          } flex items-center gap-2 flex-1 min-w-0`}
                                          title={
                                            isCompleted && completedAt
                                              ? `Hoàn thành vào: ${formatDate(completedAt)} lúc ${new Date(completedAt).toLocaleTimeString("vi-VN")}`
                                              : undefined
                                          }
                                        >
                                          {/* Type icon inline with title */}
                                          <span
                                            className={`flex items-center justify-center w-5 h-5 rounded flex-shrink-0 ${
                                              item.itemType ===
                                              SyllabusItemType.LESSON
                                                ? "bg-blue-100 text-blue-600"
                                                : "bg-red-100 text-red-600"
                                            }`}
                                          >
                                            {item.itemType ===
                                            SyllabusItemType.LESSON ? (
                                              <BookOpen className="h-3 w-3" />
                                            ) : (
                                              <Video className="h-3 w-3" />
                                            )}
                                          </span>

                                          <span className="flex-1 truncate">
                                            {item.itemType ===
                                            SyllabusItemType.LESSON
                                              ? item.lesson?.title
                                              : item.classSession?.topic}
                                          </span>
                                        </h4>

                                        {/* Completion status icon */}
                                        {isCompleted && (
                                          <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="flex-shrink-0"
                                          >
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                          </motion.div>
                                        )}
                                      </div>

                                      {/* Badges and info - more compact layout */}
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        {/* Status badges */}
                                        {isCurrent && isCompleted && (
                                          <Badge className="text-xs bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-2 py-0.5 animate-pulse">
                                            🔄 Đang ôn tập
                                          </Badge>
                                        )}

                                        {isCurrent && !isCompleted && (
                                          <Badge className="text-xs bg-orange-500 text-white px-2 py-0.5 animate-pulse">
                                            📚 Đang học
                                          </Badge>
                                        )}

                                        {!isCurrent && isCompleted && (
                                          <Badge className="text-xs bg-green-500 text-white px-2 py-0.5">
                                            ✓ Hoàn thành
                                          </Badge>
                                        )}

                                        {/* {!isCurrent && isReviewable && (
                                          <Badge className="text-xs bg-blue-500 text-white px-2 py-0.5">
                                            📚 Có thể xem lại
                                          </Badge>
                                        )} */}

                                        {isLocked && (
                                          <Badge className="text-xs bg-gray-400 text-gray-600 px-2 py-0.5">
                                            🔒 Chưa mở
                                          </Badge>
                                        )}

                                        {/* Completion date */}
                                        {completedAt && (
                                          <Badge className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5">
                                            📅{" "}
                                            {formatCompletedDate(completedAt)}
                                          </Badge>
                                        )}

                                        {/* Duration - always show on the right */}
                                        <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded ml-auto">
                                          <Clock className="h-3 w-3" />
                                          <span>
                                            {item.itemType ===
                                            SyllabusItemType.LESSON
                                              ? item.lesson
                                                  ?.estimatedDurationMinutes
                                              : item.classSession
                                                  ?.durationMinutes}{" "}
                                            phút
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            );
                          },
                        )}
                      </div>
                    </motion.div>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CourseSidebar;
