"use client";

import Link from "next/link";
import type React from "react";
import { useRef, useState } from "react";

import { toast } from "@/hooks/use-toast";
import { Edit, GripVertical, Plus, Trash } from "lucide-react";

import {
  deleteChapter,
  deleteLesson,
  moveLessonToChapter,
  reorderChapters,
  reorderLessons,
} from "@/actions/courseAction";

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

interface Lesson {
  id: string;
  title: string;
  order: number;
  type: string;
}

interface Chapter {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface CourseContentProps {
  courseId: string;
  chapters: Chapter[];
  onOrderUpdate: () => void;
}

export function CourseContent({
  courseId,
  chapters,
  onOrderUpdate,
}: CourseContentProps) {
  const [items, setItems] = useState(chapters);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingLesson, setIsDeletingLesson] = useState(false);
  const [draggedLessonData, setDraggedLessonData] = useState<{
    lesson: Lesson;
    sourceChapterId: string;
  } | null>(null);
  const dragItem = useRef<any>(null);
  const dragOverItem = useRef<any>(null);
  const dragSource = useRef<string | null>(null);

  const handleDragStart = (
    e: React.DragEvent,
    sourceType: string,
    index: number,
    chapterId?: string,
  ) => {
    e.stopPropagation();
    dragItem.current = index;
    dragSource.current = sourceType;
    e.currentTarget.classList.add("dragging");

    if (sourceType === "lesson" && chapterId) {
      const chapter = items.find((c) => c.id === chapterId);
      if (chapter && chapter.lessons[index]) {
        setDraggedLessonData({
          lesson: chapter.lessons[index],
          sourceChapterId: chapterId,
        });
      }
    }
  };

  const handleDragEnter = (
    e: React.DragEvent,
    targetType: string,
    index: number,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    dragOverItem.current = index;

    if (
      dragSource.current === targetType ||
      (dragSource.current === "lesson" && targetType === "chapter")
    ) {
      if (targetType === "lesson") {
        e.currentTarget.classList.add("drag-over-lesson");
      } else {
        e.currentTarget.classList.add("drag-over");
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    e.currentTarget.classList.remove("drag-over");
    e.currentTarget.classList.remove("drag-over-lesson");
  };

  const confirmDeleteLesson = async (lessonToDelete: string) => {
    if (!lessonToDelete) return;

    try {
      setIsDeletingLesson(true);
      const result = await deleteLesson(lessonToDelete);

      if (result.success) {
        const updatedItems = items.map((chapter) => ({
          ...chapter,
          lessons: chapter.lessons.filter(
            (lesson) => lesson.id !== lessonToDelete,
          ),
        }));

        setItems(updatedItems);

        toast({
          title: "Thành công",
          description: "Đã xóa bài học",
        });

        onOrderUpdate();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error deleting lesson:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa bài học",
        variant: "destructive",
      });
    } finally {
      setIsDeletingLesson(false);
    }
  };

  const confirmDeleteChapter = async (chapterToDelete: string) => {
    if (!chapterToDelete) return;

    try {
      setIsDeleting(true);
      await deleteChapter(chapterToDelete);

      setItems(items.filter((chapter) => chapter.id !== chapterToDelete));

      toast({
        title: "Thành công",
        description: "Đã xóa chương",
      });

      onOrderUpdate();
    } catch (error) {
      console.error("Error deleting chapter:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa chương",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDrop = async (
    e: React.DragEvent,
    targetType: string,
    targetChapterId?: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("drag-over");
    e.currentTarget.classList.remove("drag-over-lesson");

    const draggedIndex = dragItem.current;
    const droppedIndex = dragOverItem.current;

    if (dragSource.current === "chapter" && targetType === "lesson") {
      return;
    }

    if (
      draggedIndex === droppedIndex &&
      dragSource.current === targetType &&
      (!draggedLessonData ||
        draggedLessonData.sourceChapterId === targetChapterId)
    )
      return;

    try {
      if (targetType === "chapter" && dragSource.current === "chapter") {
        const newChapters = [...items];
        const draggedChapter = newChapters[draggedIndex];
        newChapters.splice(draggedIndex, 1);
        newChapters.splice(droppedIndex, 0, draggedChapter);

        setItems(newChapters);

        const result = await reorderChapters(
          courseId,
          newChapters.map((chapter, index) => ({
            id: chapter.id,
            order: index + 1,
          })),
        );

        if (!result.success) {
          throw new Error(result.message);
        }

        toast({
          title: "Thành công",
          description: "Đã cập nhật thứ tự chương",
        });
      } else if (
        (targetType === "lesson" || targetType === "chapter") &&
        dragSource.current === "lesson" &&
        targetChapterId
      ) {
        const isCrossChapterMove =
          draggedLessonData &&
          draggedLessonData.sourceChapterId !== targetChapterId;

        if (isCrossChapterMove && draggedLessonData) {
          const targetOrder = targetType === "lesson" ? droppedIndex + 1 : 1;

          const result = await moveLessonToChapter(
            draggedLessonData.lesson.id,
            targetChapterId,
            targetOrder,
          );

          if (!result.success) {
            throw new Error(result.message);
          }

          const newItems = items.map((chapter) => {
            if (chapter.id === draggedLessonData.sourceChapterId) {
              return {
                ...chapter,
                lessons: chapter.lessons.filter(
                  (l) => l.id !== draggedLessonData.lesson.id,
                ),
              };
            } else if (chapter.id === targetChapterId) {
              const newLessons = [...chapter.lessons];
              const insertIndex =
                targetType === "lesson" ? droppedIndex : newLessons.length;
              newLessons.splice(insertIndex, 0, {
                ...draggedLessonData.lesson,
                order: targetOrder,
              });
              return {
                ...chapter,
                lessons: newLessons.map((lesson, index) => ({
                  ...lesson,
                  order: index + 1,
                })),
              };
            }
            return chapter;
          });

          setItems(newItems);

          toast({
            title: "Thành công",
            description: "Đã di chuyển bài học sang chương khác",
          });
        } else if (
          targetType === "lesson" &&
          draggedLessonData?.sourceChapterId === targetChapterId
        ) {
          const chapter = items.find((c) => c.id === targetChapterId);
          if (!chapter) return;

          const newLessons = [...chapter.lessons];
          const draggedLesson = newLessons[draggedIndex];
          newLessons.splice(draggedIndex, 1);
          newLessons.splice(droppedIndex, 0, draggedLesson);

          const newItems = items.map((c) =>
            c.id === targetChapterId ? { ...c, lessons: newLessons } : c,
          );

          setItems(newItems);

          const result = await reorderLessons(
            newLessons.map((lesson, index) => ({
              id: lesson.id,
              order: index + 1,
              chapterId: targetChapterId,
            })),
          );

          if (!result.success) {
            throw new Error(result.message);
          }

          toast({
            title: "Thành công",
            description: "Đã cập nhật thứ tự bài học",
          });
        }
      }

      onOrderUpdate();
    } catch (error: any) {
      console.error("Error updating order:", error);
      toast({
        title: "Lỗi",
        description:
          error.message ||
          (targetType === "chapter"
            ? "Không thể cập nhật thứ tự chương"
            : "Không thể cập nhật thứ tự bài học"),
        variant: "destructive",
      });

      setItems(chapters);
    } finally {
      setDraggedLessonData(null);
      dragSource.current = null;
    }
  };

  return (
    <div className="space-y-4">
      <style jsx>{`
        .dragging {
          opacity: 0.5;
          transform: scale(0.95);
          transition: all 0.2s ease;
        }
        .drag-over {
          border: 2px dashed #3b82f6;
          background-color: rgba(59, 130, 246, 0.1);
          transition: all 0.2s ease;
        }
        .drag-over-lesson {
          border: 1px dashed #10b981;
          background-color: rgba(16, 185, 129, 0.1);
        }
      `}</style>
      {items.map((chapter, chapterIndex) => (
        <Card
          key={chapter.id}
          draggable
          onDragStart={(e) => handleDragStart(e, "chapter", chapterIndex)}
          onDragEnter={(e) => handleDragEnter(e, "chapter", chapterIndex)}
          onDragLeave={handleDragLeave}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, "chapter", chapter.id)}
          className="mb-4 cursor-move"
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="h-5 w-5 text-gray-500" />
                <CardTitle>{chapter.title}</CardTitle>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/courses/${courseId}/chapters/${chapter.id}/edit`}
                >
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
                <Link
                  href={`/admin/courses/${courseId}/chapters/${chapter.id}/lessons/create`}
                >
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 bg-transparent"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Xác nhận xóa chương</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bạn có chắc chắn muốn xóa chương "{chapter.title}"? Hành
                        động này không thể hoàn tác và sẽ xóa tất cả bài học
                        trong chương này.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>
                        Hủy
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          confirmDeleteChapter(chapter.id);
                        }}
                        disabled={isDeleting}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        {isDeleting ? "Đang xóa..." : "Xóa"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="space-y-2 min-h-[20px]"
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (dragSource.current === "lesson") {
                  e.currentTarget.classList.add("drag-over");
                }
              }}
              onDragLeave={(e) => {
                e.stopPropagation();
                e.currentTarget.classList.remove("drag-over");
              }}
              onDrop={(e) => {
                if (
                  dragSource.current === "lesson" &&
                  chapter.lessons.length === 0
                ) {
                  dragOverItem.current = 0;
                  handleDrop(e, "chapter", chapter.id);
                } else if (dragSource.current === "lesson") {
                  dragOverItem.current = chapter.lessons.length;
                  handleDrop(e, "chapter", chapter.id);
                }
              }}
            >
              {chapter.lessons.length === 0 ? (
                <div className="text-gray-500 text-sm italic p-4 text-center border-2 border-dashed border-gray-300 rounded-lg">
                  Chưa có bài học nào. Kéo bài học vào đây hoặc tạo mới.
                </div>
              ) : (
                chapter.lessons.map((lesson, lessonIndex) => (
                  <div
                    key={lesson.id}
                    draggable
                    onDragStart={(e) =>
                      handleDragStart(e, "lesson", lessonIndex, chapter.id)
                    }
                    onDragEnter={(e) =>
                      handleDragEnter(e, "lesson", lessonIndex)
                    }
                    onDragLeave={handleDragLeave}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, "lesson", chapter.id)}
                    className="flex items-center justify-between p-3 bg-secondary rounded-lg cursor-move"
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-gray-500" />
                      <span>{lesson.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/courses/${courseId}/chapters/${chapter.id}/lessons/${lesson.id}/edit`}
                      >
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Xác nhận xóa bài học
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc chắn muốn xóa bài học "{lesson.title}
                              "? Hành động này không thể hoàn tác.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeletingLesson}>
                              Hủy
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                confirmDeleteLesson(lesson.id);
                              }}
                              disabled={isDeletingLesson}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              {isDeletingLesson ? "Đang xóa..." : "Xóa"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
