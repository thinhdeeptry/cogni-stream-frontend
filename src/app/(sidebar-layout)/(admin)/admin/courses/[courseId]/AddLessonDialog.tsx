import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";

interface AddLessonDialogProps {
  courseId: string;
  chapterId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddLessonDialog({
  courseId,
  chapterId,
  open,
  onOpenChange,
}: AddLessonDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lessonData, setLessonData] = useState({
    title: "",
    content: "",
    type: "BLOG",
    videoUrl: "",
    isPublished: false,
    isFreePreview: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Call API to create lesson
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm bài học mới</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tên bài học</Label>
            <Input
              id="title"
              value={lessonData.title}
              onChange={(e) =>
                setLessonData({ ...lessonData, title: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Loại bài học</Label>
            <Select
              value={lessonData.type}
              onValueChange={(value) =>
                setLessonData({ ...lessonData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại bài học" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BLOG">Bài viết</SelectItem>
                <SelectItem value="VIDEO">Video</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {lessonData.type === "VIDEO" && (
            <div className="space-y-2">
              <Label htmlFor="videoUrl">URL Video</Label>
              <Input
                id="videoUrl"
                value={lessonData.videoUrl}
                onChange={(e) =>
                  setLessonData({ ...lessonData, videoUrl: e.target.value })
                }
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="content">Nội dung</Label>
            <Textarea
              id="content"
              value={lessonData.content}
              onChange={(e) =>
                setLessonData({ ...lessonData, content: e.target.value })
              }
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPublished"
              checked={lessonData.isPublished}
              onCheckedChange={(checked) =>
                setLessonData({
                  ...lessonData,
                  isPublished: checked as boolean,
                })
              }
            />
            <Label htmlFor="isPublished">Xuất bản ngay</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isFreePreview"
              checked={lessonData.isFreePreview}
              onCheckedChange={(checked) =>
                setLessonData({
                  ...lessonData,
                  isFreePreview: checked as boolean,
                })
              }
            />
            <Label htmlFor="isFreePreview">Cho phép xem thử</Label>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang tạo..." : "Tạo bài học"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
