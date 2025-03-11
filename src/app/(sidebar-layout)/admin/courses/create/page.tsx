"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { CourseLevel } from "@/types/course/types";
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

export default function CreateCoursePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Course form state
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    categoryId: "",
    level: CourseLevel.BEGINNER,
    price: 0,
    currency: "VND",
    isPublished: false,
    isHasCertificate: false,
    tags: [],
    learningOutcomes: [""],
    requirements: [""],
    targetAudience: "",
  });

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setCourseData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setCourseData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setCourseData((prev) => ({ ...prev, [name]: checked }));
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real implementation, you would upload the file to a server
      // For now, we'll just create a local URL
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
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

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // In a real implementation, you would send the data to an API
    // For now, we'll just simulate a delay and redirect
    setTimeout(() => {
      setIsSubmitting(false);
      router.push("/admin/courses");
    }, 1000);
  };

  return (
    <div className="p-8">
      <div className="flex items-center mb-6">
        <Link href="/admin/courses" className="mr-4">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Tạo khoá học mới</h1>
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
              <Input id="tags" placeholder="Nhập tags cách nhau bởi dấu phẩy" />
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

      {/* This section would appear after course creation */}
      <div className="mt-12 border-t pt-8 hidden">
        <h2 className="text-xl font-semibold mb-6">
          Quản lý nội dung khoá học
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left column - Chapters list */}
          <div className="md:col-span-1 border rounded-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Danh sách chương</h3>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" /> Thêm chương
              </Button>
            </div>

            <div className="space-y-2">
              {/* This would be populated with actual chapters */}
              <div className="p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="font-medium">1. Giới thiệu khoá học</span>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost">
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-500"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">2 bài học</p>
              </div>
            </div>
          </div>

          {/* Right column - Lessons management */}
          <div className="md:col-span-2 border rounded-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">
                Bài học trong chương: Giới thiệu khoá học
              </h3>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" /> Thêm bài học
              </Button>
            </div>

            <div className="space-y-3">
              {/* This would be populated with actual lessons */}
              <div className="p-3 border rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">
                      1.1 Giới thiệu tổng quan
                    </span>
                    <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                      Đã xuất bản
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost">
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-500"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">Video • 10:30</p>
              </div>

              {/* Lesson form would appear here when adding/editing */}
              <div className="border rounded-md p-4 space-y-4">
                <h4 className="font-medium">Thêm bài học mới</h4>

                <div className="space-y-2">
                  <Label htmlFor="lessonTitle">Tiêu đề bài học *</Label>
                  <Input id="lessonTitle" placeholder="Nhập tiêu đề bài học" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lessonContent">Nội dung</Label>
                  <textarea
                    id="lessonContent"
                    placeholder="Nội dung bài học"
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lessonType">Loại bài học</Label>
                  <Select defaultValue="VIDEO">
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại bài học" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VIDEO">Video</SelectItem>
                      <SelectItem value="BLOG">Bài viết</SelectItem>
                      <SelectItem value="MIXED">Hỗn hợp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="videoUrl">URL Video</Label>
                  <Input
                    id="videoUrl"
                    placeholder="Nhập URL video (YouTube, Vimeo, ...)"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isFreePreview"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <Label htmlFor="isFreePreview">Cho phép xem thử</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isLessonPublished"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <Label htmlFor="isLessonPublished">Xuất bản ngay</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline">Huỷ</Button>
                  <Button>Lưu bài học</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
