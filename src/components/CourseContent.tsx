"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { toast } from "@/hooks/use-toast";
import { Edit, GripVertical, Plus } from "lucide-react";

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
  const dragItem = useRef<any>(null);
  const dragOverItem = useRef<any>(null);
  const dragSource = useRef<string | null>(null);

  const handleDragStart = (
    e: React.DragEvent,
    sourceType: string,
    index: number,
  ) => {
    dragItem.current = index;
    dragSource.current = sourceType;
    e.currentTarget.classList.add("dragging");
  };

  const handleDragEnter = (
    e: React.DragEvent,
    targetType: string,
    index: number,
  ) => {
    dragOverItem.current = index;
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("drag-over");
  };

  const handleDrop = async (
    e: React.DragEvent,
    targetType: string,
    chapterId?: string,
  ) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");

    const draggedIndex = dragItem.current;
    const droppedIndex = dragOverItem.current;

    if (draggedIndex === droppedIndex && dragSource.current === targetType)
      return;

    try {
      if (targetType === "chapter") {
        // Reordering chapters
        const newChapters = [...items];
        const draggedChapter = newChapters[draggedIndex];
        newChapters.splice(draggedIndex, 1);
        newChapters.splice(droppedIndex, 0, draggedChapter);

        setItems(newChapters);

        const response = await fetch("/api/chapters/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chapters: newChapters.map((chapter, index) => ({
              id: chapter.id,
              order: index + 1,
            })),
          }),
        });

        if (!response.ok) throw new Error("Failed to update chapter order");
      } else if (targetType === "lesson" && chapterId) {
        // Reordering lessons within a chapter
        const chapter = items.find((c) => c.id === chapterId);
        if (!chapter) return;

        const newLessons = [...chapter.lessons];
        const draggedLesson = newLessons[draggedIndex];
        newLessons.splice(draggedIndex, 1);
        newLessons.splice(droppedIndex, 0, draggedLesson);

        const newItems = items.map((c) =>
          c.id === chapterId ? { ...c, lessons: newLessons } : c,
        );

        setItems(newItems);

        const response = await fetch("/api/lessons/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lessons: newLessons.map((lesson, index) => ({
              id: lesson.id,
              order: index + 1,
            })),
          }),
        });

        if (!response.ok) throw new Error("Failed to update lesson order");
      }

      onOrderUpdate();
    } catch (error) {
      toast({
        title: "Lỗi",
        description:
          targetType === "chapter"
            ? "Không thể cập nhật thứ tự chương"
            : "Không thể cập nhật thứ tự bài học",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {items.map((chapter, chapterIndex) => (
        <Card
          key={chapter.id}
          draggable
          onDragStart={(e) => handleDragStart(e, "chapter", chapterIndex)}
          onDragEnter={(e) => handleDragEnter(e, "chapter", chapterIndex)}
          onDragLeave={handleDragLeave}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, "chapter")}
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
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {chapter.lessons.map((lesson, lessonIndex) => (
                <div
                  key={lesson.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, "lesson", lessonIndex)}
                  onDragEnter={(e) => handleDragEnter(e, "lesson", lessonIndex)}
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
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
