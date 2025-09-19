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
  Clock,
  Eye,
  FileText,
  Globe,
  Loader2,
  RotateCcw,
  Save,
  Timer,
  Video,
} from "lucide-react";

import {
  getLessonById,
  updateLesson,
  uploadImage,
} from "@/actions/courseAction";

import UnlockRequirementsBuilder from "@/components/admin/UnlockRequirementsBuilder";
import LessonReviewSidebar from "@/components/lesson/LessonReviewSidebar";
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
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [maxAttempts, setMaxAttempts] = useState<number | null>(null);
  const [retryDelay, setRetryDelay] = useState<number | null>(null);
  const [blockDuration, setBlockDuration] = useState<number | null>(null);
  const [unlockRequirements, setUnlockRequirements] = useState<any[]>([]);
  const [deleteUnlockRequirements, setDeleteUnlockRequirements] = useState<
    string[]
  >([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showQuizConfig, setShowQuizConfig] = useState(false);
  const [showUnlockRequirements, setShowUnlockRequirements] = useState(false);
  const [showQuestionManager, setShowQuestionManager] = useState(false);
  const { toast } = useToast();

  const handleUnlockRequirementsChange = (newRequirements: any[]) => {
    const currentIds = unlockRequirements
      .map((req) => req.id)
      .filter((id) => id && !id.startsWith("temp-"));
    const newIds = newRequirements
      .map((req) => req.id)
      .filter((id) => id && !id.startsWith("temp-"));

    // Find deleted requirements (existing IDs that are no longer in new requirements)
    const deletedIds = currentIds.filter((id) => !newIds.includes(id));
    if (deletedIds.length > 0) {
      setDeleteUnlockRequirements((prev) => [...prev, ...deletedIds]);
    }

    setUnlockRequirements(newRequirements);
  };

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
          setTimeLimit(data.timeLimit || null);
          setMaxAttempts(data.maxAttempts || null);
          setRetryDelay(data.retryDelay || null);
          setBlockDuration(data.blockDuration || null);
          setUnlockRequirements(data.unlockRequirements || []);

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

      const updateData: any = {
        title,
        content: type === LessonType.QUIZ ? undefined : content,
        type,
        videoUrl: videoUrl || undefined,
        isPublished,
        isFreePreview,
        passPercent: type === LessonType.QUIZ ? passPercent : undefined,
        timeLimit: type === LessonType.QUIZ ? timeLimit : undefined,
        maxAttempts: type === LessonType.QUIZ ? maxAttempts : undefined,
        retryDelay: type === LessonType.QUIZ ? retryDelay : undefined,
        blockDuration: type === LessonType.QUIZ ? blockDuration : undefined,
        requireUnlockAction: type === LessonType.QUIZ ? true : undefined,
        unlockRequirements:
          type === LessonType.QUIZ ? unlockRequirements : undefined,
        deleteUnlockRequirements:
          type === LessonType.QUIZ && deleteUnlockRequirements.length > 0
            ? deleteUnlockRequirements
            : undefined,
      };

      const result = await updateLesson(resolvedParams.lessonId, updateData);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      {/* Main content area */}
      <div className="flex-1 overflow-auto pr-6">
        <div className="container mx-auto p-4 space-y-6 max-w-5xl">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
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
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                      {lessonType === LessonType.QUIZ
                        ? "Chỉnh sửa quiz"
                        : "Chỉnh sửa bài học"}
                    </h1>
                    <p className="text-slate-600 text-sm mt-1">
                      {lessonType === LessonType.QUIZ
                        ? "Cập nhật và cải thiện nội dung quiz của bạn"
                        : "Cập nhật và cải thiện nội dung bài học của bạn"}
                    </p>
                  </div>
                </div>
                <Button
                  type="submit"
                  form="lesson-form"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg transition-all duration-200 px-6"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Đang cập nhật...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {lessonType === LessonType.QUIZ
                        ? "Cập nhật quiz"
                        : "Cập nhật bài học"}
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
          </Card>

          <form id="lesson-form" onSubmit={handleSubmit} className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-orange-500" />
                  Thông tin cơ bản
                </CardTitle>
                <CardDescription>
                  {lessonType === LessonType.QUIZ
                    ? "Cập nhật thông tin chính cho quiz của bạn"
                    : "Cập nhật thông tin chính cho bài học của bạn"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="title"
                    className="text-sm font-semibold text-slate-900 flex items-center gap-2"
                  >
                    {lessonType === LessonType.QUIZ
                      ? "Tiêu đề quiz"
                      : "Tiêu đề bài học"}
                    <Badge variant="secondary" className="text-xs">
                      Bắt buộc
                    </Badge>
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="border-slate-200 focus:ring-orange-500 focus:border-orange-500 transition-colors h-10 text-base"
                    placeholder={
                      lessonType === LessonType.QUIZ
                        ? "Nhập tiêu đề cho quiz"
                        : "Nhập tiêu đề hấp dẫn cho bài học"
                    }
                  />
                </div>

                <div className="space-y-2 p-1">
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
                    <SelectTrigger className="border-slate-200 focus:ring-orange-500 focus:border-orange-500 h-10">
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
                              <Icon className="h-4 w-4 text-slate-600 mt-3" />
                              <div>
                                <div className="font-semibold text-base text-left">
                                  {option.label}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
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
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Video className="h-5 w-5 text-red-500" />
                    Cấu hình Video
                  </CardTitle>
                  <CardDescription>
                    Cập nhật video học tập từ các nền tảng phổ biến
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
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
                      className="border-slate-200 focus:ring-orange-500 focus:border-orange-500 h-10"
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
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    Nội dung bài học
                  </CardTitle>
                  <CardDescription>
                    Cập nhật nội dung phong phú với văn bản, hình ảnh và định
                    dạng
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl overflow-hidden hover:border-orange-300 transition-colors">
                    <BlockNoteView
                      editor={editor}
                      theme="light"
                      className="min-h-[400px] bg-white"
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
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Brain className="h-5 w-5" />
                        Quản lý Quiz
                      </CardTitle>
                      <CardDescription className="text-purple-100">
                        Cập nhật cấu hình và quản lý câu hỏi cho bài quiz
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowQuizConfig(!showQuizConfig)}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                    >
                      {showQuizConfig ? "Ẩn cấu hình" : "Hiện cấu hình"}
                    </Button>
                  </div>
                </CardHeader>
                {showQuizConfig && (
                  <CardContent className="p-4 space-y-4">
                    {/* Pass Percent Setting with visual indicator */}
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <Label
                        htmlFor="passPercent"
                        className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-2"
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
                            setPassPercent(
                              Number.parseInt(e.target.value) || 80,
                            )
                          }
                          className="border-slate-200 focus:ring-purple-500 focus:border-purple-500 w-20 h-8"
                        />
                        <div className="flex-1">
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${passPercent}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-600 mt-1">
                            Học viên cần đạt ít nhất {passPercent}% để vượt qua
                            quiz
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-purple-200">
                        <Label
                          htmlFor="timeLimit"
                          className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-2"
                        >
                          <Clock className="h-4 w-4 text-blue-500" />
                          Thời gian (phút)
                        </Label>
                        <Input
                          id="timeLimit"
                          type="number"
                          min="1"
                          placeholder="∞"
                          value={timeLimit || ""}
                          onChange={(e) =>
                            setTimeLimit(
                              e.target.value
                                ? Number.parseInt(e.target.value) || null
                                : null,
                            )
                          }
                          className="border-slate-200 focus:ring-purple-500 focus:border-purple-500 h-8"
                        />
                        <p className="text-xs text-slate-600 mt-1">
                          Thời gian tối đa để hoàn thành quiz. Để trống = không
                          giới hạn thời gian
                        </p>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-purple-200">
                        <Label
                          htmlFor="maxAttempts"
                          className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-2"
                        >
                          <RotateCcw className="h-4 w-4 text-orange-500" />
                          Số lần làm
                        </Label>
                        <Input
                          id="maxAttempts"
                          type="number"
                          min="1"
                          placeholder="∞"
                          value={maxAttempts || ""}
                          onChange={(e) =>
                            setMaxAttempts(
                              e.target.value
                                ? Number.parseInt(e.target.value) || null
                                : null,
                            )
                          }
                          className="border-slate-200 focus:ring-purple-500 focus:border-purple-500 h-8"
                        />
                        <p className="text-xs text-slate-600 mt-1">
                          Số lần thử tối đa cho phép. Để trống = không giới hạn
                          số lần làm
                        </p>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-purple-200">
                        <Label
                          htmlFor="retryDelay"
                          className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-2"
                        >
                          <Timer className="h-4 w-4 text-red-500" />
                          Chờ (phút)
                        </Label>
                        <Input
                          id="retryDelay"
                          type="number"
                          min="0"
                          placeholder="0"
                          value={retryDelay || ""}
                          onChange={(e) =>
                            setRetryDelay(
                              e.target.value
                                ? Number.parseInt(e.target.value) || null
                                : null,
                            )
                          }
                          className="border-slate-200 focus:ring-purple-500 focus:border-purple-500 h-8"
                        />
                        <p className="text-xs text-slate-600 mt-1">
                          Thời gian chờ giữa các lần làm lại. 0 = có thể làm lại
                          ngay lập tức
                        </p>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-purple-200">
                        <Label
                          htmlFor="blockDuration"
                          className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-2"
                        >
                          <Timer className="h-4 w-4 text-red-500" />
                          Khóa (phút)
                        </Label>
                        <Input
                          id="blockDuration"
                          type="number"
                          min="1"
                          placeholder="0"
                          value={blockDuration || ""}
                          onChange={(e) =>
                            setBlockDuration(
                              e.target.value
                                ? Number.parseInt(e.target.value) || null
                                : null,
                            )
                          }
                          className="border-slate-200 focus:ring-purple-500 focus:border-purple-500 h-8"
                        />
                        <p className="text-xs text-slate-600 mt-1">
                          Thời gian khóa quiz khi không đạt điểm. Để trống =
                          khóa vĩnh viễn và chỉ mở khi hoàn thành điều kiện bên
                          dưới
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border-2 border-blue-200 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-3 border-b border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-blue-900 flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4" />
                              Điều kiện mở khóa Quiz
                            </h3>
                            <p className="text-xs text-blue-700 mt-1">
                              Quản lý điều kiện cần hoàn thành để làm lại quiz
                              khi không đạt
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setShowUnlockRequirements(!showUnlockRequirements)
                            }
                            className="bg-white/50 border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800 text-xs"
                          >
                            {showUnlockRequirements ? "Ẩn" : "Hiện"}
                          </Button>
                        </div>
                      </div>
                      {showUnlockRequirements && (
                        <div className="p-4">
                          <UnlockRequirementsBuilder
                            requirements={unlockRequirements}
                            onChange={handleUnlockRequirementsChange}
                            courseId={resolvedParams.courseId}
                            currentLessonId={resolvedParams.lessonId}
                          />
                        </div>
                      )}
                    </div>

                    {/* Question Manager with enhanced styling */}
                    <div className="bg-white rounded-xl border-2 border-purple-200 overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-3 border-b border-purple-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-purple-900 flex items-center gap-2 text-sm">
                              <Brain className="h-4 w-4" />
                              Quản lý câu hỏi
                            </h3>
                            <p className="text-xs text-purple-700 mt-1">
                              Thêm, chỉnh sửa và quản lý các câu hỏi cho bài
                              quiz
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setShowQuestionManager(!showQuestionManager)
                            }
                            className="bg-white/50 border-purple-300 text-purple-700 hover:bg-purple-50 hover:text-purple-800 text-xs"
                          >
                            {showQuestionManager ? "Ẩn" : "Hiện"}
                          </Button>
                        </div>
                      </div>
                      {showQuestionManager && (
                        <div className="p-4">
                          <QuestionManager
                            lessonId={resolvedParams.lessonId}
                            courseId={resolvedParams.courseId}
                            chapterId={resolvedParams.chapterId}
                            onQuestionsChange={setQuestions}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Globe className="h-5 w-5 text-green-500" />
                  Cài đặt xuất bản
                </CardTitle>
                <CardDescription>
                  Kiểm soát quyền truy cập và trạng thái xuất bản của bài học
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-3 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label
                          htmlFor="isFreePreview"
                          className="text-sm font-semibold text-slate-900 flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4 text-blue-500" />
                          Cho phép xem thử
                        </Label>
                        <p className="text-xs text-slate-600">
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

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label
                          htmlFor="isPublished"
                          className="text-sm font-semibold text-slate-900 flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Xuất bản
                        </Label>
                        <p className="text-xs text-slate-600">
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

      {/* Sidebar area */}
      <div className="w-96 flex-shrink-0 pl-2">
        <LessonReviewSidebar
          title={title}
          lessonType={lessonType}
          videoUrl={videoUrl}
          isFreePreview={isFreePreview}
          isPublished={isPublished}
          passPercent={passPercent}
          timeLimit={timeLimit}
          maxAttempts={maxAttempts}
          retryDelay={retryDelay}
          blockDuration={blockDuration}
          unlockRequirements={unlockRequirements}
          questions={questions}
          hasContent={editor.document.length > 1}
        />
      </div>
    </div>
  );
}
