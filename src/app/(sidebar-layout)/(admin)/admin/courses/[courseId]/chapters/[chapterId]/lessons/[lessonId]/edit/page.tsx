"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { use, useEffect, useState } from "react";

import { useToast } from "@/hooks/use-toast";
import type { Question } from "@/types/assessment/types";
import { LessonType } from "@/types/course/types";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import {
  BookOpen,
  Brain,
  CheckCircle,
  ChevronLeft,
  Eye,
  FileText,
  Globe,
  Loader2,
  Save,
  Video,
} from "lucide-react";

import {
  getLessonById,
  updateLesson,
  uploadImage,
} from "@/actions/courseAction";

import { QuestionManager } from "@/components/lesson/QuestionManager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

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
  const [isPublished, setIsPublished] = useState(false);
  const [lessonType, setLessonType] = useState<string>(LessonType.BLOG);
  const [passPercent, setPassPercent] = useState<number>(80);
  const [questions, setQuestions] = useState<Question[]>([]);
  const { toast } = useToast();

  // Configure BlockNote editor with image upload
  const editor = useCreateBlockNote({
    uploadFile: async (file: File) => {
      try {
        const result = await uploadImage(
          file,
          "courses",
          `lessons/${resolvedParams.courseId}`,
        );
        if (result.success) {
          return result.url;
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải lên hình ảnh",
          variant: "destructive",
        });
        throw error;
      }
    },
  });

  const lessonTypeOptions = [
    {
      value: LessonType.BLOG,
      label: "Bài viết",
      icon: FileText,
      description: "Nội dung văn bản với hình ảnh và định dạng",
    },
    {
      value: LessonType.VIDEO,
      label: "Video",
      icon: Video,
      description: "Video học tập từ YouTube, Vimeo hoặc nguồn khác",
    },
    {
      value: LessonType.MIXED,
      label: "Kết hợp",
      icon: BookOpen,
      description: "Cả video và nội dung văn bản",
    },
    {
      value: LessonType.QUIZ,
      label: "Quiz",
      icon: Brain,
      description: "Bài kiểm tra với câu hỏi trắc nghiệm và tự luận",
    },
  ];

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const data = await getLessonById(resolvedParams.lessonId);
        console.log(data);
        if (data) {
          setTitle(data.title);
          setVideoUrl(data.videoUrl || "");
          setIsFreePreview(data.isFreePreview);
          setIsPublished(data.isPublished);
          setLessonType(data.type || LessonType.BLOG);
          setPassPercent(data.passPercent || 80);

          // Load the content into the editor if it exists
          if (data.content) {
            try {
              const content = JSON.parse(data.content);
              // Replace the content in the editor
              if (Array.isArray(content)) {
                editor.replaceBlocks(editor.document, content);
              }
            } catch (error) {
              console.error("Error parsing lesson content:", error);
            }
          }
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
      } else if (lessonType === LessonType.QUIZ) {
        type = LessonType.QUIZ;
      }

      const result = await updateLesson(resolvedParams.lessonId, {
        title,
        content: type === LessonType.QUIZ ? undefined : content,
        type,
        videoUrl: videoUrl || undefined,
        isPublished,
        isFreePreview,
        passPercent: type === LessonType.QUIZ ? passPercent : undefined,
      });

      if (result.success) {
        toast({
          title: "Thành công",
          description: "Đã cập nhật bài học",
        });
        router.push(`/admin/courses/${resolvedParams.courseId}`);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật bài học",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-6 space-y-8 max-w-5xl">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <div>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-96" />
                  </div>
                </div>
                <Skeleton className="h-10 w-32" />
              </div>
            </CardHeader>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-80" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-12 w-full" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-12 w-full" />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <p className="text-slate-600 font-medium">
                Đang tải thông tin bài học...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 space-y-8 max-w-5xl">
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href={`/admin/courses/${resolvedParams.courseId}`}>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-slate-200 hover:bg-slate-100 transition-colors bg-transparent"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    Chỉnh sửa bài học
                  </h1>
                  <p className="text-slate-600 mt-1">
                    Cập nhật và cải thiện nội dung bài học của bạn
                  </p>
                </div>
              </div>
              <Button
                type="submit"
                form="lesson-form"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg transition-all duration-200 px-8"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Cập nhật bài học
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
        </Card>

        <form id="lesson-form" onSubmit={handleSubmit} className="space-y-8">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5 text-orange-500" />
                Thông tin cơ bản
              </CardTitle>
              <CardDescription>
                Cập nhật thông tin chính cho bài học của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label
                  htmlFor="title"
                  className="text-sm font-semibold text-slate-900 flex items-center gap-2"
                >
                  Tiêu đề bài học
                  <Badge variant="secondary" className="text-xs">
                    Bắt buộc
                  </Badge>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="border-slate-200 focus:ring-orange-500 focus:border-orange-500 transition-colors h-12 text-base"
                  placeholder="Nhập tiêu đề hấp dẫn cho bài học"
                />
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="lessonType"
                  className="text-sm font-semibold text-slate-900 flex items-center gap-2"
                >
                  Loại bài học
                  <Badge variant="secondary" className="text-xs">
                    Bắt buộc
                  </Badge>
                </Label>
                <Select
                  value={lessonType}
                  onValueChange={(value) => setLessonType(value)}
                >
                  <SelectTrigger className="border-slate-200 focus:ring-orange-500 focus:border-orange-500 h-12 ">
                    <SelectValue placeholder="Chọn loại bài học" />
                  </SelectTrigger>
                  <SelectContent>
                    {lessonTypeOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="py-3"
                        >
                          <div className="flex items-start gap-3">
                            <Icon className="h-4 w-4 text-slate-600 mt-0.5" />
                            <div>
                              <div className="flex items-start font-medium">
                                {option.label}
                              </div>
                              <div className="text-xs text-slate-500">
                                {option.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {(lessonType === LessonType.VIDEO ||
            lessonType === LessonType.MIXED) && (
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Video className="h-5 w-5 text-red-500" />
                  Cấu hình Video
                </CardTitle>
                <CardDescription>
                  Cập nhật video học tập từ các nền tảng phổ biến
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Label
                    htmlFor="videoUrl"
                    className="text-sm font-semibold text-slate-900 flex items-center gap-2"
                  >
                    URL Video
                    {lessonType === LessonType.VIDEO && (
                      <Badge variant="secondary" className="text-xs">
                        Bắt buộc
                      </Badge>
                    )}
                  </Label>
                  <Input
                    id="videoUrl"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... hoặc https://vimeo.com/..."
                    required={lessonType === LessonType.VIDEO}
                    className="border-slate-200 focus:ring-orange-500 focus:border-orange-500 h-12"
                  />
                  <p className="text-xs text-slate-500">
                    Hỗ trợ YouTube, Vimeo và các nền tảng video phổ biến khác
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {(lessonType === LessonType.BLOG ||
            lessonType === LessonType.MIXED) && (
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  Nội dung bài học
                </CardTitle>
                <CardDescription>
                  Cập nhật nội dung phong phú với văn bản, hình ảnh và định dạng
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-slate-200 rounded-xl overflow-hidden hover:border-orange-300 transition-colors">
                  <BlockNoteView
                    editor={editor}
                    theme="light"
                    className="min-h-[500px] bg-white"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Sử dụng thanh công cụ để định dạng văn bản, thêm hình ảnh và
                  tạo danh sách
                </p>
              </CardContent>
            </Card>
          )}

          {lessonType === LessonType.QUIZ && (
            <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Brain className="h-6 w-6" />
                  Quản lý Quiz
                </CardTitle>
                <CardDescription className="text-purple-100">
                  Cập nhật cấu hình và quản lý câu hỏi cho bài quiz
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Pass Percent Setting with visual indicator */}
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <Label
                    htmlFor="passPercent"
                    className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3"
                  >
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Điểm đậu (%)
                    <Badge variant="outline" className="text-xs">
                      Hiện tại: {passPercent}%
                    </Badge>
                  </Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="passPercent"
                      type="number"
                      min="1"
                      max="100"
                      value={passPercent}
                      onChange={(e) =>
                        setPassPercent(Number.parseInt(e.target.value) || 80)
                      }
                      className="border-slate-200 focus:ring-purple-500 focus:border-purple-500 w-24 h-10"
                    />
                    <div className="flex-1">
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${passPercent}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Học viên cần đạt ít nhất {passPercent}% để vượt qua quiz
                      </p>
                    </div>
                  </div>
                </div>

                {/* Question Manager with enhanced styling */}
                <div className="bg-white rounded-xl border-2 border-purple-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-4 border-b border-purple-200">
                    <h3 className="font-semibold text-purple-900 flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      Quản lý câu hỏi
                    </h3>
                    <p className="text-sm text-purple-700 mt-1">
                      Thêm, chỉnh sửa và quản lý các câu hỏi cho bài quiz
                    </p>
                  </div>
                  <div className="p-6">
                    <QuestionManager
                      lessonId={resolvedParams.lessonId}
                      courseId={resolvedParams.courseId}
                      chapterId={resolvedParams.chapterId}
                      onQuestionsChange={setQuestions}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Globe className="h-5 w-5 text-green-500" />
                Cài đặt xuất bản
              </CardTitle>
              <CardDescription>
                Kiểm soát quyền truy cập và trạng thái xuất bản của bài học
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label
                        htmlFor="isFreePreview"
                        className="text-sm font-semibold text-slate-900 flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4 text-blue-500" />
                        Cho phép xem thử
                      </Label>
                      <p className="text-sm text-slate-600">
                        Học viên có thể xem bài học này mà không cần mua khóa
                        học
                      </p>
                    </div>
                    <Switch
                      id="isFreePreview"
                      checked={isFreePreview}
                      onCheckedChange={setIsFreePreview}
                      className="data-[state=checked]:bg-blue-500"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label
                        htmlFor="isPublished"
                        className="text-sm font-semibold text-slate-900 flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Xuất bản
                      </Label>
                      <p className="text-sm text-slate-600">
                        Bài học sẽ được hiển thị cho học viên
                      </p>
                    </div>
                    <Switch
                      id="isPublished"
                      checked={isPublished}
                      onCheckedChange={setIsPublished}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
