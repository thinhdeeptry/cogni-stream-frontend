"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CourseLevel, LessonType } from "@/types/course/types";
import { ChevronLeft, Edit, Plus, Save, Trash, Upload } from "lucide-react";

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

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeChapter, setActiveChapter] = useState<string | null>(null);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);

  // Course form state
  const [courseData, setCourseData] = useState({
    id: "",
    title: "",
    description: "",
    categoryId: "",
    level: CourseLevel.BEGINNER,
    price: 0,
    currency: "VND",
    isPublished: false,
    isHasCertificate: false,
    tags: [] as string[],
    learningOutcomes: [""] as string[],
    requirements: [""] as string[],
    targetAudience: "",
    thumbnailUrl: "",
    chapters: [] as any[],
  });

  // Lesson form state
  const [lessonData, setLessonData] = useState({
    id: "",
    title: "",
    content: "",
    type: LessonType.VIDEO,
    videoUrl: "",
    order: 0,
    isPublished: true,
    isFreePreview: false,
  });

  // Fetch course data
  useEffect(() => {
    // In a real implementation, you would fetch the course data from an API
    // For now, we'll just simulate a delay and set some mock data
    setTimeout(() => {
      setCourseData({
        id: courseId,
        title: "React for Beginners",
        description: "Learn React from scratch with this comprehensive course.",
        categoryId: "cat1",
        level: CourseLevel.BEGINNER,
        price: 499000,
        currency: "VND",
        isPublished: true,
        isHasCertificate: true,
        tags: ["react", "javascript", "frontend"],
        learningOutcomes: [
          "Understand React fundamentals",
          "Build React applications",
        ],
        requirements: ["Basic JavaScript knowledge"],
        targetAudience: "Beginners who want to learn React",
        thumbnailUrl:
          "https://res.cloudinary.com/dxxsudprj/image/upload/v1740664494/Screenshot_2025-02-27_at_20.53.58_wgkc7i.png",
        chapters: [
          {
            id: "ch1",
            title: "Introduction to React",
            order: 1,
            isPublished: true,
            lessons: [
              {
                id: "l1",
                title: "What is React?",
                content: "An introduction to React and its core concepts.",
                type: LessonType.VIDEO,
                videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                order: 1,
                isPublished: true,
                isFreePreview: true,
              },
              {
                id: "l2",
                title: "Setting up your development environment",
                content:
                  "Learn how to set up your development environment for React.",
                type: LessonType.VIDEO,
                videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                order: 2,
                isPublished: true,
                isFreePreview: false,
              },
            ],
          },
          {
            id: "ch2",
            title: "React Components",
            order: 2,
            isPublished: true,
            lessons: [
              {
                id: "l3",
                title: "Functional Components",
                content: "Learn about functional components in React.",
                type: LessonType.VIDEO,
                videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                order: 1,
                isPublished: true,
                isFreePreview: false,
              },
            ],
          },
        ],
      });
      setSelectedImage(
        "https://res.cloudinary.com/dxxsudprj/image/upload/v1740664494/Screenshot_2025-02-27_at_20.53.58_wgkc7i.png",
      );
      setActiveChapter("ch1");
      setIsLoading(false);
    }, 500);
  }, [courseId]);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setCourseData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle lesson form input changes
  const handleLessonInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setLessonData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setCourseData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle lesson select changes
  const handleLessonSelectChange = (name: string, value: string) => {
    setLessonData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setCourseData((prev) => ({ ...prev, [name]: checked }));
  };

  // Handle lesson checkbox changes
  const handleLessonCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, checked } = e.target;
    setLessonData((prev) => ({ ...prev, [name]: checked }));
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real implementation, you would upload the file to a server
      // For now, we'll just create a local URL
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setCourseData((prev) => ({ ...prev, thumbnailUrl: imageUrl }));
    }
  };

  // Handle array field changes (learning outcomes, requirements)
  const handleArrayFieldChange = (
    field: string,
    index: number,
    value: string,
  ) => {
    setCourseData((prev) => {
      const newArray = [...(prev[field as keyof typeof prev] as string[])];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  // Add new item to array fields
  const addArrayItem = (field: string) => {
    setCourseData((prev) => {
      const newArray = [...(prev[field as keyof typeof prev] as string[]), ""];
      return { ...prev, [field]: newArray };
    });
  };

  // Remove item from array fields
  const removeArrayItem = (field: string, index: number) => {
    setCourseData((prev) => {
      const newArray = [...(prev[field as keyof typeof prev] as string[])];
      newArray.splice(index, 1);
      return { ...prev, [field]: newArray };
    });
  };

  // Add new chapter
  const handleAddChapter = () => {
    const newChapterId = `ch${Date.now()}`;
    const newChapter = {
      id: newChapterId,
      title: "New Chapter",
      order: courseData.chapters.length + 1,
      isPublished: false,
      lessons: [],
    };

    setCourseData((prev) => ({
      ...prev,
      chapters: [...prev.chapters, newChapter],
    }));

    setActiveChapter(newChapterId);
  };

  // Edit chapter
  const handleEditChapter = (chapterId: string, title: string) => {
    setCourseData((prev) => ({
      ...prev,
      chapters: prev.chapters.map((chapter) =>
        chapter.id === chapterId ? { ...chapter, title } : chapter,
      ),
    }));
  };

  // Delete chapter
  const handleDeleteChapter = (chapterId: string) => {
    setCourseData((prev) => ({
      ...prev,
      chapters: prev.chapters.filter((chapter) => chapter.id !== chapterId),
    }));

    if (activeChapter === chapterId) {
      setActiveChapter(courseData.chapters[0]?.id || null);
    }
  };

  // Add new lesson
  const handleAddLesson = () => {
    setLessonData({
      id: "",
      title: "",
      content: "",
      type: LessonType.VIDEO,
      videoUrl: "",
      order: getActiveChapterLessons().length + 1,
      isPublished: true,
      isFreePreview: false,
    });
    setEditingLesson(null);
    setShowLessonForm(true);
  };

  // Edit lesson
  const handleEditLesson = (lessonId: string) => {
    const lesson = getActiveChapterLessons().find(
      (lesson: { id: string }) => lesson.id === lessonId,
    );
    if (lesson) {
      setLessonData(lesson);
      setEditingLesson(lessonId);
      setShowLessonForm(true);
    }
  };

  // Save lesson
  const handleSaveLesson = () => {
    if (!activeChapter) return;

    const newLesson = {
      ...lessonData,
      id: editingLesson || `l${Date.now()}`,
    };

    setCourseData((prev) => ({
      ...prev,
      chapters: prev.chapters.map((chapter) => {
        if (chapter.id === activeChapter) {
          const lessons = editingLesson
            ? chapter.lessons.map((l: { id: string }) =>
                l.id === editingLesson ? newLesson : l,
              )
            : [...chapter.lessons, newLesson];

          return { ...chapter, lessons };
        }
        return chapter;
      }),
    }));

    setShowLessonForm(false);
    setEditingLesson(null);
  };

  // Delete lesson
  const handleDeleteLesson = (lessonId: string) => {
    setCourseData((prev) => ({
      ...prev,
      chapters: prev.chapters.map((chapter) => {
        if (chapter.id === activeChapter) {
          return {
            ...chapter,
            lessons: chapter.lessons.filter(
              (l: { id: string }) => l.id !== lessonId,
            ),
          };
        }
        return chapter;
      }),
    }));
  };

  // Get active chapter
  const getActiveChapter = () => {
    return courseData.chapters.find((chapter) => chapter.id === activeChapter);
  };

  // Get lessons for active chapter
  const getActiveChapterLessons = () => {
    return getActiveChapter()?.lessons || [];
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // In a real implementation, you would send the data to an API
    // For now, we'll just simulate a delay and redirect
    setTimeout(() => {
      setIsSubmitting(false);
      // Stay on the same page after saving
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <p>Loading course data...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center mb-6">
        <Link href="/admin/courses" className="mr-4">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Chỉnh sửa khoá học</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left column - Basic course information */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Tên khoá học *</Label>
              <Input
                id="title"
                name="title"
                value={courseData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả khoá học</Label>
              <textarea
                id="description"
                name="description"
                value={courseData.description}
                onChange={handleInputChange}
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Danh mục *</Label>
              <Select
                value={courseData.categoryId}
                onValueChange={(value) =>
                  handleSelectChange("categoryId", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cat1">Lập trình</SelectItem>
                  <SelectItem value="cat2">Thiết kế</SelectItem>
                  <SelectItem value="cat3">Marketing</SelectItem>
                  <SelectItem value="cat4">Kinh doanh</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Cấp độ</Label>
              <Select
                value={courseData.level}
                onValueChange={(value) => handleSelectChange("level", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn cấp độ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CourseLevel.BEGINNER}>
                    Người mới bắt đầu
                  </SelectItem>
                  <SelectItem value={CourseLevel.INTERMEDIATE}>
                    Trung cấp
                  </SelectItem>
                  <SelectItem value={CourseLevel.ADVANCED}>Nâng cao</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Giá (VND)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  value={courseData.price}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Tiền tệ</Label>
                <Select
                  value={courseData.currency}
                  onValueChange={(value) =>
                    handleSelectChange("currency", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn tiền tệ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VND">VND</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublished"
                name="isPublished"
                checked={courseData.isPublished}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <Label htmlFor="isPublished">Xuất bản ngay</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isHasCertificate"
                name="isHasCertificate"
                checked={courseData.isHasCertificate}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <Label htmlFor="isHasCertificate">Có chứng chỉ</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnailUpload">Ảnh thumbnail</Label>
              <div className="flex items-center gap-4">
                <div className="relative w-32 h-24 border-2 border-dashed rounded-md flex items-center justify-center bg-gray-50">
                  {selectedImage ? (
                    <img
                      src={selectedImage}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover rounded-md"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-6 w-6 text-gray-400" />
                      <span className="mt-1 text-xs text-gray-500">Upload</span>
                    </div>
                  )}
                </div>
                <Input
                  id="thumbnailUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="max-w-xs"
                />
              </div>
            </div>
          </div>

          {/* Right column - Additional course information */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Kết quả học tập</Label>
              {courseData.learningOutcomes.map((outcome, index) => (
                <div key={`outcome-${index}`} className="flex gap-2 mb-2">
                  <Input
                    value={outcome}
                    onChange={(e) =>
                      handleArrayFieldChange(
                        "learningOutcomes",
                        index,
                        e.target.value,
                      )
                    }
                    placeholder="Học viên sẽ học được gì?"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeArrayItem("learningOutcomes", index)}
                    disabled={courseData.learningOutcomes.length <= 1}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem("learningOutcomes")}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" /> Thêm kết quả học tập
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Yêu cầu</Label>
              {courseData.requirements.map((requirement, index) => (
                <div key={`requirement-${index}`} className="flex gap-2 mb-2">
                  <Input
                    value={requirement}
                    onChange={(e) =>
                      handleArrayFieldChange(
                        "requirements",
                        index,
                        e.target.value,
                      )
                    }
                    placeholder="Yêu cầu đối với học viên"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeArrayItem("requirements", index)}
                    disabled={courseData.requirements.length <= 1}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem("requirements")}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" /> Thêm yêu cầu
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAudience">Đối tượng mục tiêu</Label>
              <textarea
                id="targetAudience"
                name="targetAudience"
                value={courseData.targetAudience}
                onChange={handleInputChange}
                placeholder="Khoá học này phù hợp với ai?"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="Nhập tags cách nhau bởi dấu phẩy"
                value={courseData.tags.join(", ")}
                onChange={(e) => {
                  const tagsArray = e.target.value
                    .split(",")
                    .map((tag) => tag.trim());
                  setCourseData((prev) => ({ ...prev, tags: tagsArray }));
                }}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {courseData.tags
                  .filter((tag) => tag)
                  .map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/courses")}
            disabled={isSubmitting}
          >
            Huỷ
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : "Lưu khoá học"}
          </Button>
        </div>
      </form>

      {/* Chapter and Lesson Management */}
      <div className="mt-12 border-t pt-8">
        <h2 className="text-xl font-semibold mb-6">
          Quản lý nội dung khoá học
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left column - Chapters list */}
          <div className="md:col-span-1 border rounded-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Danh sách chương</h3>
              <Button size="sm" variant="outline" onClick={handleAddChapter}>
                <Plus className="h-4 w-4 mr-2" /> Thêm chương
              </Button>
            </div>

            <div className="space-y-2">
              {courseData.chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${activeChapter === chapter.id ? "bg-gray-50 border-primary" : ""}`}
                  onClick={() => setActiveChapter(chapter.id)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {chapter.order}. {chapter.title}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newTitle = prompt(
                            "Enter new chapter title:",
                            chapter.title,
                          );
                          if (newTitle) handleEditChapter(chapter.id, newTitle);
                        }}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            confirm(
                              "Are you sure you want to delete this chapter?",
                            )
                          ) {
                            handleDeleteChapter(chapter.id);
                          }
                        }}
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {chapter.lessons?.length || 0} bài học
                  </p>
                </div>
              ))}

              {courseData.chapters.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p>Chưa có chương nào</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleAddChapter}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Thêm chương đầu tiên
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right column - Lessons management */}
          <div className="md:col-span-2 border rounded-md p-4">
            {activeChapter ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">
                    Bài học trong chương: {getActiveChapter()?.title}
                  </h3>
                  <Button size="sm" variant="outline" onClick={handleAddLesson}>
                    <Plus className="h-4 w-4 mr-2" /> Thêm bài học
                  </Button>
                </div>

                {!showLessonForm && (
                  <div className="space-y-3">
                    {getActiveChapterLessons().map(
                      (lesson: {
                        id: string;
                        order: number;
                        title: string;
                        isFreePreview: boolean;
                        isPublished: boolean;
                        type: LessonType;
                        videoUrl?: string;
                      }) => (
                        <div key={lesson.id} className="p-3 border rounded-md">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">
                                {lesson.order}. {lesson.title}
                              </span>
                              {lesson.isFreePreview && (
                                <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                                  Xem thử
                                </span>
                              )}
                              <span
                                className={`ml-2 px-1.5 py-0.5 ${lesson.isPublished ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"} rounded text-xs`}
                              >
                                {lesson.isPublished
                                  ? "Đã xuất bản"
                                  : "Bản nháp"}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEditLesson(lesson.id)}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-red-500"
                                onClick={() => {
                                  if (
                                    confirm(
                                      "Are you sure you want to delete this lesson?",
                                    )
                                  ) {
                                    handleDeleteLesson(lesson.id);
                                  }
                                }}
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {lesson.type === LessonType.VIDEO
                              ? "Video"
                              : lesson.type === LessonType.BLOG
                                ? "Bài viết"
                                : "Hỗn hợp"}
                            {lesson.type === LessonType.VIDEO &&
                              lesson.videoUrl &&
                              " • URL: " +
                                lesson.videoUrl.substring(0, 30) +
                                "..."}
                          </p>
                        </div>
                      ),
                    )}

                    {getActiveChapterLessons().length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>Chưa có bài học nào trong chương này</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={handleAddLesson}
                        >
                          <Plus className="h-4 w-4 mr-2" /> Thêm bài học đầu
                          tiên
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Lesson form */}
                {showLessonForm && (
                  <div className="border rounded-md p-4 space-y-4">
                    <h4 className="font-medium">
                      {editingLesson ? "Chỉnh sửa bài học" : "Thêm bài học mới"}
                    </h4>

                    <div className="space-y-2">
                      <Label htmlFor="lessonTitle">Tiêu đề bài học *</Label>
                      <Input
                        id="lessonTitle"
                        name="title"
                        value={lessonData.title}
                        onChange={handleLessonInputChange}
                        placeholder="Nhập tiêu đề bài học"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lessonContent">Nội dung</Label>
                      <textarea
                        id="lessonContent"
                        name="content"
                        value={lessonData.content}
                        onChange={handleLessonInputChange}
                        placeholder="Nội dung bài học"
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lessonType">Loại bài học</Label>
                      <Select
                        value={lessonData.type}
                        onValueChange={(value) =>
                          handleLessonSelectChange("type", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại bài học" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={LessonType.VIDEO}>
                            Video
                          </SelectItem>
                          <SelectItem value={LessonType.BLOG}>
                            Bài viết
                          </SelectItem>
                          <SelectItem value={LessonType.MIXED}>
                            Hỗn hợp
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(lessonData.type === LessonType.VIDEO ||
                      lessonData.type === LessonType.MIXED) && (
                      <div className="space-y-2">
                        <Label htmlFor="videoUrl">URL Video</Label>
                        <Input
                          id="videoUrl"
                          name="videoUrl"
                          value={lessonData.videoUrl}
                          onChange={handleLessonInputChange}
                          placeholder="Nhập URL video (YouTube, Vimeo, ...)"
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isFreePreview"
                        name="isFreePreview"
                        checked={lessonData.isFreePreview}
                        onChange={handleLessonCheckboxChange}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <Label htmlFor="isFreePreview">Cho phép xem thử</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isLessonPublished"
                        name="isPublished"
                        checked={lessonData.isPublished}
                        onChange={handleLessonCheckboxChange}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <Label htmlFor="isLessonPublished">Xuất bản ngay</Label>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowLessonForm(false);
                          setEditingLesson(null);
                        }}
                      >
                        Huỷ
                      </Button>
                      <Button onClick={handleSaveLesson}>Lưu bài học</Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Vui lòng chọn một chương để quản lý bài học</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
