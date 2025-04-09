"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";

import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const editor = useCreateBlockNote();

  const handleSubmit = async (e: React.FormEvent) => {
    // e.preventDefault();
    // setIsSubmitting(true);
    // try {
    //   // Get the content from the editor
    //   const content = JSON.stringify(editor.topLevelBlocks);
    //   const response = await fetch("/api/lessons", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       title,
    //       content,
    //       videoUrl,
    //       isFreePreview,
    //       chapterId: resolvedParams.chapterId,
    //       courseId: resolvedParams.courseId,
    //     }),
    //   });
    //   const data = await response.json();
    //   if (data.success) {
    //     toast({
    //       title: "Thành công",
    //       description: "Đã tạo bài học mới",
    //     });
    //     router.push(`/admin/courses/${resolvedParams.courseId}`);
    //   } else {
    //     throw new Error(data.message);
    //   }
    // } catch (error) {
    //   toast({
    //     title: "Lỗi",
    //     description: "Không thể tạo bài học",
    //     variant: "destructive",
    //   });
    // } finally {
    //   setIsSubmitting(false);
    // }
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
          {isSubmitting ? "Đang tạo..." : "Tạo bài học"}
        </Button>
      </form>
    </div>
  );
}
