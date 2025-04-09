"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { useToast } from "@/hooks/use-toast";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { ChevronLeft } from "lucide-react";

import { createLesson, getLessonById } from "@/actions/courseAction";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EditLessonPage({
  params,
}: {
  params: Promise<{ courseId: string; chapterId: string; lessonId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isFreePreview, setIsFreePreview] = useState(false);
  const { toast } = useToast();
  const editor = useCreateBlockNote();

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const data = await getLessonById(resolvedParams.lessonId);
        console.log(data);
        if (data) {
          setTitle(data.title);
          setVideoUrl(data.videoUrl);
          setIsFreePreview(data.isFreePreview);

          // Load the content into the editor
          const content = JSON.parse(data.content);
          editor.replaceBlocks(editor.topLevelBlocks, content);
        }
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin bài học",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLesson();
  }, [resolvedParams.lessonId]);

  const handleSubmit = async (e: React.FormEvent) => {
    //   e.preventDefault();
    //   setIsSubmitting(true);
    //   try {
    //     const content = JSON.stringify(editor.topLevelBlocks);
    //     // const response = await createLesson
    //     if (data) {
    //       toast({
    //         title: "Thành công",
    //         description: "Đã cập nhật bài học",
    //       });
    //       router.push(`/admin/courses/${resolvedParams.courseId}`);
    //     } else {
    //       throw new Error(data.message);
    //     }
    //   } catch (error) {
    //     toast({
    //       title: "Lỗi",
    //       description: "Không thể cập nhật bài học",
    //       variant: "destructive",
    //     });
    //   } finally {
    //     setIsSubmitting(false);
    //   }
  };

  if (isLoading) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/admin/courses/${resolvedParams.courseId}`}>
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Chỉnh sửa bài học</h1>
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
          <Label htmlFor="videoUrl">URL Video</Label>
          <Input
            id="videoUrl"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Nội dung bài học</Label>
          <div className="min-h-[500px] border rounded-lg p-4">
            <BlockNoteView editor={editor} theme="light" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isFreePreview"
            checked={isFreePreview}
            onChange={(e) => setIsFreePreview(e.target.checked)}
          />
          <Label htmlFor="isFreePreview">Cho phép xem thử</Label>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang cập nhật..." : "Cập nhật bài học"}
        </Button>
      </form>
    </div>
  );
}
