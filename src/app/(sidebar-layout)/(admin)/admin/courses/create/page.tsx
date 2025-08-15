"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useToast } from "@/hooks/use-toast";
import { Category, CourseLevel, CourseType } from "@/types/course/types";
import { motion } from "framer-motion";
import { ChevronLeft, Plus, Trash, Upload } from "lucide-react";

import {
  createCourse,
  getAllCategories,
  uploadImage,
} from "@/actions/courseAction";

import useUserStore from "@/stores/useUserStore";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

interface CourseFormData {
  title: string;
  description: string;
  categoryId: string;
  level: CourseLevel;
  courseType: CourseType; // Thêm loại khóa học
  price: number;
  isPublished: boolean;
  isHasCertificate: boolean;
  tags: string[];
  learningOutcomes: string[];
  requirements: string[];
  targetAudience: string;
}

export default function CreateCoursePage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUserStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  // const [imageFile, setImageFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [courseData, setCourseData] = useState<CourseFormData>({
    title: "",
    description: "",
    categoryId: "",
    level: CourseLevel.BEGINNER,
    courseType: CourseType.SELF_PACED, // Mặc định là tự học
    price: 0,
    isPublished: false,
    isHasCertificate: false,
    tags: [],
    learningOutcomes: [""],
    requirements: [""],
    targetAudience: "",
  });
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getAllCategories();
        setCategories(data);
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách danh mục",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [toast]);
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    // Handle numeric fields
    if (name === "price") {
      const numValue = value === "" ? 0 : parseFloat(value);

      // Validate input
      if (isNaN(numValue) || numValue < 0) {
        return; // Don't update if invalid
      }

      // Round to 2 decimal places to avoid floating point issues
      const roundedValue = Math.round(numValue * 100) / 100;
      setCourseData((prev) => ({ ...prev, [name]: roundedValue }));
    } else {
      setCourseData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setCourseData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setCourseData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Hiển thị preview ngay lập tức
        const imageUrl = URL.createObjectURL(file);
        setSelectedImage(imageUrl);

        // Upload file lên server
        const result = await uploadImage(
          file,
          "courses",
          `course-thumbnails/${user?.id}`,
        );

        if (result.success) {
          // Cập nhật URL thật từ server
          setSelectedImage(result.url);
          toast({
            title: "Thành công",
            description: "Đã tải lên hình ảnh",
          });
        } else {
          toast({
            title: "Lỗi",
            description: result.message,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải lên hình ảnh",
          variant: "destructive",
        });
      }
    }
  };

  const handleArrayFieldChange = (
    field: keyof Pick<
      CourseFormData,
      "learningOutcomes" | "requirements" | "tags"
    >,
    index: number,
    value: string,
  ) => {
    setCourseData((prev) => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addArrayItem = (
    field: keyof Pick<
      CourseFormData,
      "learningOutcomes" | "requirements" | "tags"
    >,
  ) => {
    setCourseData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const removeArrayItem = (
    field: keyof Pick<
      CourseFormData,
      "learningOutcomes" | "requirements" | "tags"
    >,
    index: number,
  ) => {
    setCourseData((prev) => {
      const newArray = [...prev[field]];
      newArray.splice(index, 1);
      return { ...prev, [field]: newArray };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !courseData.title ||
      !courseData.description ||
      !courseData.categoryId
    ) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const courseDataToSubmit = {
        ...courseData,
        ownerId: user?.id || "",
        thumbnailUrl: selectedImage, // Sử dụng URL hình ảnh đã upload
      };

      // Create course with price included
      const result = await createCourse({
        ...courseDataToSubmit,
        thumbnailUrl: courseDataToSubmit.thumbnailUrl || undefined,
        price: courseData.price,
      });

      if (result.success) {
        // TODO: Set pricing using pricing API if price > 0
        // if (courseData.price > 0) {
        //   await createPricing({
        //     courseId: result.data.id,
        //     name: "Base Price",
        //     price: courseData.price,
        //     type: "BASE_PRICE"
        //   });
        // }

        toast({
          title: "Thành công",
          description: "Tạo khóa học thành công",
        });

        // Nếu là LIVE course, chuyển đến trang tạo Class
        if (courseData.courseType === CourseType.LIVE) {
          router.push(`/admin/courses/${result.data.id}/classes/create`);
        } else {
          router.push("/admin/courses");
        }
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
        description: "Đã có lỗi xảy ra khi tạo khóa học",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className=" w-full h-full mx-auto py-6"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <Link href="/admin/courses">
              <Button variant="outline" size="icon" className="rounded-full">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Thêm khóa học mới</h1>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/courses")}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang tạo..." : "Tạo khóa học"}
            </Button>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Info Card */}
            <Card className="shadow-sm border-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold text-gray-800">
                  Thông tin cơ bản
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <Label htmlFor="title" className="text-gray-700">
                    Tên khóa học <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={courseData.title}
                    onChange={handleInputChange}
                    required
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    placeholder="Nhập tên khóa học"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="description" className="text-gray-700">
                    Mô tả <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={courseData.description}
                    onChange={handleInputChange}
                    required
                    className="min-h-[120px] border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    placeholder="Mô tả chi tiết về khóa học"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <Label htmlFor="category" className="text-gray-700">
                      Danh mục <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={courseData.categoryId}
                      onValueChange={(value) =>
                        handleSelectChange("categoryId", value)
                      }
                      disabled={isLoadingCategories}
                    >
                      <SelectTrigger className="border-gray-300 focus:ring-orange-500">
                        <SelectValue
                          placeholder={
                            isLoadingCategories
                              ? "Đang tải danh mục..."
                              : "Chọn danh mục"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {categories.length === 0 && !isLoadingCategories && (
                      <p className="text-sm text-red-500">
                        Không có danh mục nào. Vui lòng thêm danh mục trước.
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="level" className="text-gray-700">
                      Cấp độ
                    </Label>
                    <Select
                      value={courseData.level}
                      onValueChange={(value) =>
                        handleSelectChange("level", value)
                      }
                    >
                      <SelectTrigger className="border-gray-300 focus:ring-orange-500">
                        <SelectValue placeholder="Chọn cấp độ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={CourseLevel.BEGINNER}>
                          Cơ bản
                        </SelectItem>
                        <SelectItem value={CourseLevel.INTERMEDIATE}>
                          Trung cấp
                        </SelectItem>
                        <SelectItem value={CourseLevel.ADVANCED}>
                          Nâng cao
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="courseType" className="text-gray-700">
                    Loại khóa học <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={courseData.courseType}
                    onValueChange={(value) =>
                      handleSelectChange("courseType", value)
                    }
                  >
                    <SelectTrigger className="border-gray-300 focus:ring-orange-500">
                      <SelectValue placeholder="Chọn loại khóa học" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CourseType.SELF_PACED}>
                        🎥 Khóa học Tự học - Nội dung video đã quay sẵn, học
                        theo tiến độ của bạn
                      </SelectItem>
                      <SelectItem value={CourseType.LIVE}>
                        📹 Lớp học Trực tuyến - Học theo lịch với giảng viên qua
                        video call
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {courseData.courseType === CourseType.SELF_PACED
                      ? "Học viên có thể học bất cứ lúc nào với nội dung đã được chuẩn bị sẵn"
                      : "Học viên tham gia các buổi học trực tuyến theo lịch đã định"}
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="targetAudience" className="text-gray-700">
                    Đối tượng mục tiêu
                  </Label>
                  <Textarea
                    id="targetAudience"
                    name="targetAudience"
                    value={courseData.targetAudience}
                    onChange={handleInputChange}
                    placeholder="Mô tả đối tượng học viên mục tiêu của khóa học"
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pricing Card */}
            <Card className="shadow-sm border-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold text-gray-800">
                  Thông tin giá
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <Label htmlFor="price" className="text-gray-700">
                    Giá khóa học
                  </Label>
                  <div className="relative">
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={courseData.price || 0}
                      onChange={handleInputChange}
                      className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 pl-10"
                      placeholder="0"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-500">₫</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Để trống hoặc 0 để khóa học miễn phí
                  </p>
                </div>

                {/* Pricing Preview */}
                {courseData.price > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Xem trước giá
                    </h4>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-gray-900">
                        {courseData.price.toLocaleString()} VND
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Settings Card */}
            <Card className="shadow-sm border-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold text-gray-800">
                  Cài đặt khóa học
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="isPublished"
                    checked={courseData.isPublished}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange("isPublished", checked as boolean)
                    }
                    className="text-orange-500 border-gray-300 focus:ring-orange-500"
                  />
                  <Label htmlFor="isPublished" className="text-gray-700">
                    Xuất bản ngay
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isHasCertificate"
                    checked={courseData.isHasCertificate}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange(
                        "isHasCertificate",
                        checked as boolean,
                      )
                    }
                    className="text-orange-500 border-gray-300 focus:ring-orange-500"
                  />
                  <Label htmlFor="isHasCertificate" className="text-gray-700">
                    Có chứng chỉ
                  </Label>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    💡 Lưu ý về quản lý giá
                  </h4>
                  <p className="text-sm text-blue-700">
                    Sau khi tạo khóa học, bạn có thể thiết lập chương trình
                    khuyến mãi và quản lý giá nâng cao trong phần quản lý giá
                    của khóa học.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Learning Outcomes Card */}
            <Card className="shadow-sm border-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold text-gray-800">
                  Kết quả đạt được
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {courseData.learningOutcomes.map((outcome, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center">
                      {index + 1}
                    </div>
                    <Input
                      value={outcome}
                      onChange={(e) =>
                        handleArrayFieldChange(
                          "learningOutcomes",
                          index,
                          e.target.value,
                        )
                      }
                      className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      placeholder="Học viên sẽ có được gì sau khóa học?"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeArrayItem("learningOutcomes", index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addArrayItem("learningOutcomes")}
                  className="mt-2 border-dashed border-gray-300 hover:border-orange-500 hover:text-orange-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm kết quả đạt được
                </Button>
              </CardContent>
            </Card>

            {/* Requirements Card */}
            <Card className="shadow-sm border-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold text-gray-800">
                  Yêu cầu khi học
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {courseData.requirements.map((requirement, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center">
                      {index + 1}
                    </div>
                    <Input
                      value={requirement}
                      onChange={(e) =>
                        handleArrayFieldChange(
                          "requirements",
                          index,
                          e.target.value,
                        )
                      }
                      className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      placeholder="Yêu cầu kiến thức hoặc công cụ cần thiết"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeArrayItem("requirements", index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addArrayItem("requirements")}
                  className="mt-2 border-dashed border-gray-300 hover:border-orange-500 hover:text-orange-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm yêu cầu khi học
                </Button>
              </CardContent>
            </Card>

            {/* Tags Card */}
            <Card className="shadow-sm border-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold text-gray-800">
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {courseData.tags.map((tag, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-gray-100 rounded-full pl-3 pr-1 py-1"
                    >
                      <span className="text-sm">{tag}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 rounded-full p-0 hover:bg-gray-200"
                        onClick={() => removeArrayItem("tags", index)}
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Nhập tag và nhấn thêm"
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    onChange={(e) => {
                      if (courseData.tags.length === 0) {
                        handleArrayFieldChange("tags", 0, e.target.value);
                      } else {
                        const lastIndex = courseData.tags.length - 1;
                        handleArrayFieldChange(
                          "tags",
                          lastIndex,
                          e.target.value,
                        );
                      }
                    }}
                    value={
                      courseData.tags.length > 0
                        ? courseData.tags[courseData.tags.length - 1]
                        : ""
                    }
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (
                        courseData.tags.length === 0 ||
                        courseData.tags[courseData.tags.length - 1] !== ""
                      ) {
                        addArrayItem("tags");
                      }
                    }}
                    className="bg-orange-500 text-white hover:bg-orange-600"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar column */}
          <div className="space-y-8">
            <Card className="shadow-sm border-none sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold text-gray-800">
                  Ảnh bìa khóa học
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedImage ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={selectedImage}
                        alt="Course thumbnail"
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          type="button"
                          className="bg-red-500 text-white hover:bg-red-600"
                          size="sm"
                          onClick={() => setSelectedImage(null)}
                        >
                          <Trash className="h-4 w-4 mr-2" /> Xóa ảnh
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor="thumbnail"
                      className="aspect-video flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-center p-6">
                        <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                          <Upload className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                          Tải ảnh lên
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG (Tối đa 5MB)
                        </p>
                      </div>
                    </label>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="thumbnail"
                  />
                </div>

                <div className="mt-6 bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-orange-800 mb-2">
                    Hướng dẫn
                  </h3>
                  <ul className="text-xs text-orange-700 space-y-1 list-disc pl-4">
                    <li>Sử dụng hình ảnh chất lượng cao, tỉ lệ 16:9</li>
                    <li>Kích thước tối thiểu 1280x720 pixels</li>
                    <li>Tránh sử dụng quá nhiều chữ trong hình ảnh</li>
                    <li>Hình ảnh phải liên quan đến nội dung khóa học</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
