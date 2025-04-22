"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";

import { useToast } from "@/hooks/use-toast";
import { LessonType } from "@/types/course/types";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { ChevronLeft } from "lucide-react";

import { createLesson } from "@/actions/courseAction";

import { Button } from "@/components/ui/button";
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

export default function CreateLessonPage({
  params,
}: {
  params: Promise<{ courseId: string; chapterId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isFreePreview, setIsFreePreview] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [lessonType, setLessonType] = useState<string>(LessonType.BLOG);
  const editor = useCreateBlockNote();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Get the content from the editor
      const blocks = editor.document;
      const content = JSON.stringify(blocks);

      // Determine the lesson type based on inputs
      let type = lessonType;
      if (lessonType === LessonType.MIXED && !videoUrl) {
        type = LessonType.BLOG;
      } else if (lessonType === LessonType.VIDEO && !content) {
        type = LessonType.VIDEO;
      } else if (videoUrl && blocks.length > 0) {
        type = LessonType.MIXED;
      }

      const result = await createLesson(
        resolvedParams.courseId,
        resolvedParams.chapterId,
        {
          title,
          content,
          type,
          videoUrl: videoUrl || undefined,
          isPublished,
          isFreePreview,
        },
      );

      if (result.success) {
        toast({
          title: "Thành công",
          description: "Đã tạo bài học mới",
        });
        router.push(`/admin/courses/${resolvedParams.courseId}`);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tạo bài học",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/admin/courses/${resolvedParams.courseId}`}>
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Tạo bài học mới</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        <div className="space-y-2">
          <Label htmlFor="title">Tiêu đề bài học</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lessonType">Loại bài học</Label>
          <Select
            value={lessonType}
            onValueChange={(value) => setLessonType(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn loại bài học" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={LessonType.BLOG}>Bài viết</SelectItem>
              <SelectItem value={LessonType.VIDEO}>Video</SelectItem>
              <SelectItem value={LessonType.MIXED}>Cả hai</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(lessonType === LessonType.VIDEO ||
          lessonType === LessonType.MIXED) && (
          <div className="space-y-2">
            <Label htmlFor="videoUrl">URL Video</Label>
            <Input
              id="videoUrl"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Nhập URL video từ YouTube, Vimeo, ..."
              required={lessonType === LessonType.VIDEO}
            />
          </div>
        )}

        {(lessonType === LessonType.BLOG ||
          lessonType === LessonType.MIXED) && (
          <div className="space-y-2">
            <Label>Nội dung bài học</Label>
            <div className="min-h-[500px] border rounded-lg p-4">
              <BlockNoteView editor={editor} theme="light" />
            </div>
          </div>
        )}

        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="isFreePreview"
              checked={isFreePreview}
              onCheckedChange={setIsFreePreview}
            />
            <Label htmlFor="isFreePreview">Cho phép xem thử</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isPublished"
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
            <Label htmlFor="isPublished">Xuất bản ngay</Label>
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang tạo..." : "Tạo bài học"}
        </Button>
      </form>
    </div>
  );
}
