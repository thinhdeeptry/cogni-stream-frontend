"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { toast } from "@/hooks/use-toast";
import { ChevronLeft } from "lucide-react";

import { getChapterById, updateChapter } from "@/actions/courseAction";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ChapterData {
  id: string;
  title: string;
  description: string;
  isPublished: boolean;
}

export default function EditChapterPage({
  params,
}: {
  params: Promise<{ courseId: string; chapterId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chapterData, setChapterData] = useState<ChapterData | null>(null);

  useEffect(() => {
    const fetchChapter = async () => {
      try {
        const data = await getChapterById(resolvedParams.chapterId);
        setChapterData({
          id: data.id,
          title: data.title,
          description: data.description || "",
          isPublished: data.isPublished,
        });
      } catch (error) {
        console.error("Error fetching chapter:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin chương",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchChapter();
  }, [resolvedParams.chapterId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setChapterData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setChapterData((prev) => (prev ? { ...prev, [name]: checked } : null));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("+Data test: ", chapterData);
    if (!chapterData) return;

    setIsSubmitting(true);
    try {
      const result = await updateChapter(resolvedParams.chapterId, {
        title: chapterData.title,
        description: chapterData.description,
        isPublished: chapterData.isPublished,
      });

      if (result.success) {
        toast({
          title: "Thành công",
          description: "Đã cập nhật chương",
        });

        router.push(`/admin/courses/${resolvedParams.courseId}`);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error updating chapter:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật chương",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8">Đang tải...</div>;
  }

  if (!chapterData) {
    return <div className="p-8">Không tìm thấy thông tin chương</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/admin/courses/${resolvedParams.courseId}`}>
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Chỉnh sửa chương</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Tên chương</Label>
          <Input
            id="title"
            name="title"
            value={chapterData.title}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Mô tả</Label>
          <Textarea
            id="description"
            name="description"
            value={chapterData.description}
            onChange={handleInputChange}
            rows={5}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isPublished"
            checked={chapterData.isPublished}
            onCheckedChange={(checked) =>
              handleCheckboxChange("isPublished", checked as boolean)
            }
          />
          <Label htmlFor="isPublished">Xuất bản</Label>
        </div>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              router.push(`/admin/courses/${resolvedParams.courseId}`)
            }
          >
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </div>
  );
}
