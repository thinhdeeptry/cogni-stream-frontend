"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useToast } from "@/hooks/use-toast";
import { AxiosFactory } from "@/lib/axios";
import {
  LessonType,
  SyllabusItem,
  SyllabusItemType,
} from "@/types/course/types";
import {
  BookOpen,
  Calendar,
  Clock,
  Edit,
  GripVertical,
  HelpCircle,
  Plus,
  Trash2,
  Users,
  Video,
} from "lucide-react";

import { getCourseById } from "@/actions/courseAction";
import {
  createSyllabusItem,
  deleteSyllabusItem,
  updateSyllabusItem,
  updateSyllabusOrder,
} from "@/actions/syllabusActions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SyllabusManagerProps {
  classId: string;
  courseId: string;
  syllabusItems: SyllabusItem[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
}

export default function SyllabusManager({
  classId,
  courseId,
  syllabusItems,
  isLoading,
  onRefresh,
}: SyllabusManagerProps) {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SyllabusItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lessons, setLessons] = useState<any[]>([]);
  const [classSessions, setClassSessions] = useState<any[]>([]);
  const [items, setItems] = useState(syllabusItems);

  // Drag and drop refs
  const dragItem = useRef<any>(null);
  const dragOverItem = useRef<any>(null);

  // Update items when syllabusItems prop changes
  useEffect(() => {
    setItems(syllabusItems);
  }, [syllabusItems]);

  // Form data for add/edit
  const [formData, setFormData] = useState({
    day: 1,
    order: 1,
    itemType: SyllabusItemType.LESSON,
    lessonId: "",
    classSessionId: "",
  });

  // Load course lessons when dialog opens
  const loadCourseLessons = async () => {
    try {
      const courseData = await getCourseById(courseId);
      const allLessons =
        courseData.chapters?.flatMap(
          (chapter) =>
            chapter.lessons?.map((lesson) => ({
              ...lesson,
              chapterTitle: chapter.title,
            })) || [],
        ) || [];
      setLessons(allLessons);
    } catch (error) {
      console.error("Error loading lessons:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách bài học",
        variant: "destructive",
      });
    }
  };

  // Load class sessions for the current class
  const loadClassSessions = async () => {
    try {
      const syllabusApi = await AxiosFactory.getApiInstance("courses");

      const response = await syllabusApi.get(`/sessions/by-class/${classId}`);

      setClassSessions(response.data);
    } catch (error) {
      console.error("Error loading class sessions:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách buổi học",
        variant: "destructive",
      });
    }
  };

  // Load both lessons and sessions when dialog opens
  const loadDialogData = async () => {
    await Promise.all([loadCourseLessons(), loadClassSessions()]);
  };

  // Group syllabus items by day
  const groupedItems = useMemo(() => {
    const grouped: { [key: number]: SyllabusItem[] } = {};
    items.forEach((item) => {
      if (!grouped[item.day]) {
        grouped[item.day] = [];
      }
      grouped[item.day].push(item);
    });

    // Sort items within each day by order
    Object.keys(grouped).forEach((day) => {
      grouped[parseInt(day)].sort((a, b) => a.order - b.order);
    });

    return grouped;
  }, [items]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validation
    if (formData.itemType === SyllabusItemType.LESSON && !formData.lessonId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn bài học",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (
      formData.itemType === SyllabusItemType.LIVE_SESSION &&
      !formData.classSessionId
    ) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn buổi học",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const submitData: any = {
        day: formData.day,
        order: formData.order,
        itemType: formData.itemType,
        classId,
      };

      // Only include lessonId for LESSON type
      if (formData.itemType === SyllabusItemType.LESSON) {
        submitData.lessonId = formData.lessonId;
      }

      // Only include classSessionId for LIVE_SESSION type
      if (formData.itemType === SyllabusItemType.LIVE_SESSION) {
        submitData.classSessionId = formData.classSessionId;
      }

      const result = await createSyllabusItem(submitData);

      if (result.success) {
        toast({
          title: "Thành công",
          description: result.message,
        });
        setIsAddDialogOpen(false);
        setFormData({
          day: 1,
          order: 1,
          itemType: SyllabusItemType.LESSON,
          lessonId: "",
          classSessionId: "",
        });
        await onRefresh();
      } else {
        toast({
          title: "Lỗi",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi thêm mục lộ trình",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsSubmitting(true);

    // Validation
    if (formData.itemType === SyllabusItemType.LESSON && !formData.lessonId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn bài học",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (
      formData.itemType === SyllabusItemType.LIVE_SESSION &&
      !formData.classSessionId
    ) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn buổi học",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const submitData: any = {
        day: formData.day,
        order: formData.order,
        itemType: formData.itemType,
      };

      // Only include lessonId for LESSON type
      if (formData.itemType === SyllabusItemType.LESSON) {
        submitData.lessonId = formData.lessonId;
      }

      // Only include classSessionId for LIVE_SESSION type
      if (formData.itemType === SyllabusItemType.LIVE_SESSION) {
        submitData.classSessionId = formData.classSessionId;
      }

      const result = await updateSyllabusItem(editingItem.id, submitData);

      if (result.success) {
        toast({
          title: "Thành công",
          description: result.message,
        });
        setIsEditDialogOpen(false);
        setEditingItem(null);
        await onRefresh();
      } else {
        toast({
          title: "Lỗi",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi cập nhật mục lộ trình",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (item: SyllabusItem) => {
    if (!confirm("Bạn có chắc chắn muốn xóa mục lộ trình này?")) return;

    try {
      const result = await deleteSyllabusItem(item.id);

      if (result.success) {
        toast({
          title: "Thành công",
          description: result.message,
        });
        await onRefresh();
      } else {
        toast({
          title: "Lỗi",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi xóa mục lộ trình",
        variant: "destructive",
      });
    }
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (
    e: React.DragEvent,
    item: SyllabusItem,
    index: number,
    day: number,
  ) => {
    dragItem.current = { item, index, day };
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.classList.add("dragging");
  };

  const handleDragEnter = (e: React.DragEvent, index: number, day: number) => {
    dragOverItem.current = { index, day };
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("drag-over");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (
    e: React.DragEvent,
    targetDay: number,
    targetIndex: number,
  ) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");

    const draggedData = dragItem.current;
    if (!draggedData) return;

    const {
      item: draggedItem,
      day: sourceDay,
      index: sourceIndex,
    } = draggedData;

    // Don't do anything if dropped in the same position
    if (sourceDay === targetDay && sourceIndex === targetIndex) return;

    try {
      // Create a clean copy of all items, excluding the dragged item
      const allItemsExceptDragged = items.filter(
        (item) => item.id !== draggedItem.id,
      );

      // Update orders and collect update data
      const updateData: Array<{ id: string; day: number; order: number }> = [];

      if (sourceDay === targetDay) {
        // Same day reordering
        const dayItems = allItemsExceptDragged.filter(
          (item) => item.day === targetDay,
        );

        // Create updated dragged item
        const updatedDraggedItem = { ...draggedItem, day: targetDay };

        // Insert at target position
        dayItems.splice(targetIndex, 0, updatedDraggedItem);

        // Update orders for this day only
        dayItems.forEach((item, index) => {
          item.order = index + 1;
          updateData.push({ id: item.id, day: item.day, order: item.order });
        });

        // Combine with other days' items
        const otherItems = allItemsExceptDragged.filter(
          (item) => item.day !== targetDay,
        );
        const finalItems = [...dayItems, ...otherItems];
        setItems(finalItems);
      } else {
        // Moving between different days
        const sourceItems = allItemsExceptDragged.filter(
          (item) => item.day === sourceDay,
        );
        const targetItems = allItemsExceptDragged.filter(
          (item) => item.day === targetDay,
        );
        const otherItems = allItemsExceptDragged.filter(
          (item) => item.day !== sourceDay && item.day !== targetDay,
        );

        // Create updated dragged item with new day
        const updatedDraggedItem = { ...draggedItem, day: targetDay };

        // Insert dragged item at target position
        targetItems.splice(targetIndex, 0, updatedDraggedItem);

        // Update source day orders
        sourceItems.forEach((item, index) => {
          item.order = index + 1;
          updateData.push({ id: item.id, day: item.day, order: item.order });
        });

        // Update target day orders
        targetItems.forEach((item, index) => {
          item.order = index + 1;
          updateData.push({ id: item.id, day: item.day, order: item.order });
        });

        // Combine all items into final array
        const finalItems = [...sourceItems, ...targetItems, ...otherItems];
        setItems(finalItems);
      }

      // Update backend
      const result = await updateSyllabusOrder(updateData);
      if (result.success) {
        await onRefresh();
        toast({
          title: "Thành công",
          description: "Đã cập nhật thứ tự lộ trình",
        });
      } else {
        // Revert on error
        setItems(syllabusItems);
        toast({
          title: "Lỗi",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      // Revert on error
      setItems(syllabusItems);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi cập nhật thứ tự",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (item: SyllabusItem) => {
    setEditingItem(item);
    setFormData({
      day: item.day,
      order: item.order,
      itemType: item.itemType,
      lessonId: item.lessonId || "",
      classSessionId: item.classSessionId || "",
    });
    setIsEditDialogOpen(true);
    loadDialogData();
  };

  const renderSyllabusItem = (
    item: SyllabusItem,
    index: number,
    day: number,
  ) => (
    <div key={`container-${item.id}`}>
      {/* Drop zone before this item */}
      <div
        className="h-2 transition-all duration-200 hover:bg-orange-100 rounded"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, day, index)}
        onDragEnter={(e) => handleDragEnter(e, index, day)}
        onDragLeave={handleDragLeave}
      />

      {/* The actual item */}
      <div
        key={item.id}
        draggable
        onDragStart={(e) => handleDragStart(e, item, index, day)}
        className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm transition-all hover:shadow-md cursor-move drag-item"
        style={{
          opacity: dragItem.current?.item?.id === item.id ? 0.5 : 1,
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-1 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {item.itemType === SyllabusItemType.LESSON ? (
                  <>
                    {item.lesson?.type === LessonType.VIDEO && (
                      <Video className="h-4 w-4 text-blue-500" />
                    )}
                    {item.lesson?.type === LessonType.BLOG && (
                      <BookOpen className="h-4 w-4 text-green-500" />
                    )}
                    {item.lesson?.type === LessonType.MIXED && (
                      <BookOpen className="h-4 w-4 text-purple-500" />
                    )}
                    {item.lesson?.type === LessonType.QUIZ && (
                      <HelpCircle className="h-4 w-4 text-orange-500" />
                    )}
                    {!item.lesson?.type && (
                      <BookOpen className="h-4 w-4 text-blue-500" />
                    )}
                  </>
                ) : (
                  <Video className="h-4 w-4 text-red-500" />
                )}
                <Badge variant="outline" className="text-xs">
                  {item.itemType === SyllabusItemType.LESSON
                    ? item.lesson?.type === LessonType.QUIZ
                      ? "Quiz"
                      : item.lesson?.type === LessonType.VIDEO
                        ? "Video"
                        : item.lesson?.type === LessonType.BLOG
                          ? "Bài đọc"
                          : item.lesson?.type === LessonType.MIXED
                            ? "Hỗn hợp"
                            : "Bài học"
                    : "Buổi live"}
                </Badge>
                <span className="text-xs text-slate-500">#{item.order}</span>
              </div>

              {item.lesson && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-1">
                    {item.lesson.title}
                  </h4>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    {item.lesson.type !== LessonType.QUIZ && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{item.lesson.estimatedDurationMinutes} phút</span>
                      </div>
                    )}
                    {item.lesson.type === LessonType.QUIZ && (
                      <div className="flex items-center gap-1">
                        <HelpCircle className="h-3 w-3" />
                        <span>Bài kiểm tra</span>
                      </div>
                    )}
                    <Badge
                      variant={
                        item.lesson.isFreePreview ? "secondary" : "outline"
                      }
                      className="text-xs"
                    >
                      {item.lesson.isFreePreview ? "Miễn phí" : "Trả phí"}
                    </Badge>
                  </div>
                </div>
              )}

              {item.classSession && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-1">
                    {item.classSession.topic}
                  </h4>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(
                          item.classSession.scheduledAt,
                        ).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{item.classSession.durationMinutes} phút</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditDialog(item)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteItem(item)}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const dayCount = Math.max(...Object.keys(groupedItems).map(Number), 0);

  return (
    <div className="space-y-6">
      <style jsx>{`
        .drag-item.dragging {
          opacity: 0.5;
          transform: scale(1.02);
        }
        .drag-over {
          background-color: rgb(255 247 237) !important;
          border: 2px dashed rgb(251 146 60) !important;
          height: 40px !important;
        }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Quản lý lộ trình học
          </h3>
          <p className="text-sm text-slate-600">
            Kéo thả để sắp xếp lộ trình học theo ngày và thứ tự mong muốn
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
              onClick={loadDialogData}
            >
              <Plus className="h-4 w-4" />
              Thêm mục lộ trình
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Thêm mục lộ trình mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="day">Ngày học</Label>
                  <Input
                    id="day"
                    type="number"
                    min="1"
                    value={formData.day}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        day: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="order">Thứ tự</Label>
                  <Input
                    id="order"
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        order: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="itemType">Loại</Label>
                <Select
                  value={formData.itemType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      itemType: value as SyllabusItemType,
                      lessonId: "", // Clear lesson selection when changing type
                      classSessionId: "", // Clear session selection when changing type
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SyllabusItemType.LESSON}>
                      Bài học tự học
                    </SelectItem>
                    <SelectItem value={SyllabusItemType.LIVE_SESSION}>
                      Buổi học trực tiếp
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.itemType === SyllabusItemType.LESSON && (
                <div>
                  <Label htmlFor="lessonId">Chọn bài học</Label>
                  <Select
                    value={formData.lessonId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, lessonId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn bài học..." />
                    </SelectTrigger>
                    <SelectContent>
                      {lessons.map((lesson) => (
                        <SelectItem key={lesson.id} value={lesson.id}>
                          <div className="flex flex-col">
                            <span>{lesson.title}</span>
                            <span className="text-xs text-slate-500">
                              {lesson.chapterTitle}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.itemType === SyllabusItemType.LIVE_SESSION && (
                <div>
                  <Label htmlFor="classSessionId">Chọn buổi học</Label>
                  <Select
                    value={formData.classSessionId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        classSessionId: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn buổi học..." />
                    </SelectTrigger>
                    <SelectContent>
                      {classSessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          <div className="flex flex-col">
                            <span>{session.topic}</span>
                            <span className="text-xs text-slate-500">
                              {new Date(session.scheduledAt).toLocaleDateString(
                                "vi-VN",
                              )}{" "}
                              - {session.durationMinutes} phút
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Đang thêm..." : "Thêm"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Syllabus Content */}
      <div className="space-y-6">
        {dayCount === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium mb-2">Chưa có lộ trình học</h3>
            <p className="text-sm mb-4">
              Thêm các bài học và buổi live để tạo lộ trình học cho lớp này
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from({ length: Math.max(dayCount, 1) }, (_, index) => {
              const day = index + 1;
              const dayItems = groupedItems[day] || [];

              return (
                <Card key={day} className="border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Ngày {day}
                      <Badge variant="outline" className="ml-2">
                        {dayItems.length} mục
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="min-h-[100px] space-y-1">
                      {dayItems.length === 0 ? (
                        <div
                          className="flex items-center justify-center h-20 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg transition-all"
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, day, 0)}
                          onDragEnter={(e) => handleDragEnter(e, 0, day)}
                          onDragLeave={handleDragLeave}
                        >
                          Kéo thả mục lộ trình vào đây hoặc thêm mục mới
                        </div>
                      ) : (
                        <>
                          {dayItems.map((item, index) =>
                            renderSyllabusItem(item, index, day),
                          )}
                          {/* Drop zone at the end */}
                          <div
                            className="h-2 transition-all duration-200 hover:bg-orange-100 rounded"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, day, dayItems.length)}
                            onDragEnter={(e) =>
                              handleDragEnter(e, dayItems.length, day)
                            }
                            onDragLeave={handleDragLeave}
                          />
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa mục lộ trình</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditItem} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-day">Ngày học</Label>
                <Input
                  id="edit-day"
                  type="number"
                  min="1"
                  value={formData.day}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      day: parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-order">Thứ tự</Label>
                <Input
                  id="edit-order"
                  type="number"
                  min="1"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      order: parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-itemType">Loại</Label>
              <Select
                value={formData.itemType}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    itemType: value as SyllabusItemType,
                    lessonId: "", // Clear lesson selection when changing type
                    classSessionId: "", // Clear session selection when changing type
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SyllabusItemType.LESSON}>
                    Bài học tự học
                  </SelectItem>
                  <SelectItem value={SyllabusItemType.LIVE_SESSION}>
                    Buổi học trực tiếp
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.itemType === SyllabusItemType.LESSON && (
              <div>
                <Label htmlFor="edit-lessonId">Chọn bài học</Label>
                <Select
                  value={formData.lessonId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, lessonId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn bài học..." />
                  </SelectTrigger>
                  <SelectContent>
                    {lessons.map((lesson) => (
                      <SelectItem key={lesson.id} value={lesson.id}>
                        <div className="flex flex-col">
                          <span>{lesson.title}</span>
                          <span className="text-xs text-slate-500">
                            {lesson.chapterTitle}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.itemType === SyllabusItemType.LIVE_SESSION && (
              <div>
                <Label htmlFor="edit-classSessionId">Chọn buổi học</Label>
                <Select
                  value={formData.classSessionId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, classSessionId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn buổi học..." />
                  </SelectTrigger>
                  <SelectContent>
                    {classSessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        <div className="flex flex-col">
                          <span>{session.topic}</span>
                          <span className="text-xs text-slate-500">
                            {new Date(session.scheduledAt).toLocaleDateString(
                              "vi-VN",
                            )}{" "}
                            - {session.durationMinutes} phút
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
