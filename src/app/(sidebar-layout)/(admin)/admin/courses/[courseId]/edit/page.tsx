"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use } from "react";
import { useEffect, useState } from "react";

import { toast } from "@/hooks/use-toast";
import { Category, Course, CourseLevel } from "@/types/course/types";
import { ChevronLeft, Plus, Trash, Upload } from "lucide-react";

import {
  getAllCategories,
  getCourseById,
  updateCourse,
  uploadImage,
} from "@/actions/courseAction";

import useUserStore from "@/stores/useUserStore";

// import useUserStore from "@/stores/useUserStore";

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";

export default function EditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  // const [imageFile, setImageFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [courseData, setCourseData] = useState<Course | null>(null);

  const { user } = useUserStore();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [course, categoriesData] = await Promise.all([
          getCourseById(resolvedParams.courseId),
          getAllCategories(),
        ]);

        setCourseData(course);
        setSelectedImage(course.thumbnailUrl || null);
        setCategories(categoriesData);
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin khóa học",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchData();
  }, [resolvedParams.courseId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    // Handle numeric fields
    if (name === "price" || name === "promotionPrice") {
      // Parse as float to handle decimal values like 49.99
      const numValue = value === "" ? 0 : parseFloat(value);
      // Round to 2 decimal places to avoid floating point issues
      const roundedValue = Math.round(numValue * 100) / 100;
      setCourseData((prev) =>
        prev ? { ...prev, [name]: roundedValue } : null,
      );
    } else {
      setCourseData((prev) => (prev ? { ...prev, [name]: value } : null));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setCourseData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setCourseData((prev) => (prev ? { ...prev, [name]: checked } : null));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Hiển thị preview ngay lập tức
        const imageUrl = URL.createObjectURL(file);
        setSelectedImage(imageUrl);

        // Upload file lên server
        const response = await uploadImage(
          file,
          "courses",
          `course-thumbnails/${user?.id}`,
        );

        if (response.success) {
          // Cập nhật URL thật từ server
          setSelectedImage(response.url);
          toast({
            title: "Thành công",
            description: "Đã tải lên hình ảnh",
          });
        } else {
          toast({
            title: "Lỗi",
            description: response.message,
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
    field: keyof Pick<Course, "learningOutcomes" | "requirements" | "tags">,
    index: number,
    value: string,
  ) => {
    setCourseData((prev) => {
      if (!prev) return null;
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addArrayItem = (
    field: keyof Pick<Course, "learningOutcomes" | "requirements" | "tags">,
  ) => {
    setCourseData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [field]: [...prev[field], ""],
      };
    });
  };

  const removeArrayItem = (
    field: keyof Pick<Course, "learningOutcomes" | "requirements" | "tags">,
    index: number,
  ) => {
    setCourseData((prev) => {
      if (!prev) return null;
      const newArray = [...prev[field]];
      newArray.splice(index, 1);
      return { ...prev, [field]: newArray };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("+Data test: ", courseData);
    if (
      !courseData ||
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
      // Validate price and promotionPrice
      const price =
        typeof courseData.price === "number"
          ? courseData.price
          : parseFloat(String(courseData.price || 0));
      // Round to 2 decimal places
      const roundedPrice = Math.round(price * 100) / 100;

      let promotionPrice =
        typeof courseData.promotionPrice === "number"
          ? courseData.promotionPrice
          : parseFloat(String(courseData.promotionPrice || 0));
      // Round to 2 decimal places
      let roundedPromotionPrice = Math.round(promotionPrice * 100) / 100;

      // Ensure promotionPrice is not greater than price
      if (roundedPromotionPrice > roundedPrice) {
        roundedPromotionPrice = roundedPrice;
      }

      // If price is 0, promotionPrice should also be 0
      if (roundedPrice === 0) {
        roundedPromotionPrice = 0;
      }

      const result = await updateCourse(resolvedParams.courseId, {
        title: courseData.title,
        description: courseData.description || "",
        categoryId: courseData.categoryId,
        level: courseData.level || "BEGINNER",
        price: roundedPrice,
        promotionPrice: roundedPromotionPrice,
        currency: courseData.currency,
        isPublished: courseData.isPublished,
        isHasCertificate: courseData.isHasCertificate,
        tags: courseData.tags,
        learningOutcomes: courseData.learningOutcomes,
        requirements: courseData.requirements,
        targetAudience: courseData.targetAudience || "",
        thumbnailUrl: selectedImage || undefined,
      });

      if (result.success) {
        toast({
          title: "Thành công",
          description: "Cập nhật khóa học thành công",
        });
        router.push("/admin/courses");
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
        description: "Đã có lỗi xảy ra khi cập nhật khóa học",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!courseData) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/admin/courses/${resolvedParams.courseId}`}>
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Cập nhật khóa học</h1>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Tên khóa học *</Label>
              <Input
                id="title"
                name="title"
                value={courseData.title || ""}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả *</Label>
              <Textarea
                id="description"
                name="description"
                value={courseData.description || ""}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Danh mục *</Label>
              <Select
                value={courseData.categoryId}
                onValueChange={(value) =>
                  handleSelectChange("categoryId", value)
                }
                disabled={isLoadingCategories}
              >
                <SelectTrigger>
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
                  <SelectItem value={CourseLevel.BEGINNER}>Cơ bản</SelectItem>
                  <SelectItem value={CourseLevel.INTERMEDIATE}>
                    Trung cấp
                  </SelectItem>
                  <SelectItem value={CourseLevel.ADVANCED}>Nâng cao</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Giá gốc</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={courseData.price || 0}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promotionPrice">Giá khuyến mãi</Label>
                <Input
                  id="promotionPrice"
                  name="promotionPrice"
                  type="number"
                  min={0}
                  step="0.01"
                  max={courseData.price || 0}
                  value={courseData.promotionPrice || 0}
                  onChange={handleInputChange}
                  disabled={!courseData.price || courseData.price <= 0}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Đơn vị tiền tệ</Label>
              <Select
                value={courseData.currency || "VND"}
                onValueChange={(value) => handleSelectChange("currency", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn đơn vị tiền tệ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VND">VND</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPublished"
                checked={courseData.isPublished}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("isPublished", checked as boolean)
                }
              />
              <Label htmlFor="isPublished">Xuất bản</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isHasCertificate"
                checked={courseData.isHasCertificate}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("isHasCertificate", checked as boolean)
                }
              />
              <Label htmlFor="isHasCertificate">Có chứng chỉ</Label>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="pr-2.5">Kết quả học tập</Label>
            {courseData.learningOutcomes.map((outcome, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={outcome}
                  onChange={(e) =>
                    handleArrayFieldChange(
                      "learningOutcomes",
                      index,
                      e.target.value,
                    )
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeArrayItem("learningOutcomes", index)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => addArrayItem("learningOutcomes")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm kết quả học tập
            </Button>
          </div>

          <div className="space-y-4">
            <Label className="pr-2.5">Yêu cầu</Label>
            {courseData.requirements.map((requirement, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={requirement}
                  onChange={(e) =>
                    handleArrayFieldChange(
                      "requirements",
                      index,
                      e.target.value,
                    )
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeArrayItem("requirements", index)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => addArrayItem("requirements")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm yêu cầu
            </Button>
          </div>

          <div className="space-y-4">
            <Label>Tags</Label>
            {courseData.tags.map((tag, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={tag}
                  onChange={(e) =>
                    handleArrayFieldChange("tags", index, e.target.value)
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeArrayItem("tags", index)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => addArrayItem("tags")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm tag
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <Label>Ảnh thu nhỏ</Label>
            <div className="border rounded-lg p-4">
              {selectedImage && (
                <img
                  src={selectedImage}
                  alt="Course thumbnail"
                  className="w-full rounded-lg mb-4"
                />
              )}
              <div className="flex items-center justify-center">
                <label className="cursor-pointer">
                  <Input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Upload className="h-4 w-4" />
                    Tải ảnh lên
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-4">
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
  );
}
