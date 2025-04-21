"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useToast } from "@/hooks/use-toast";
import { Category, CourseLevel } from "@/types/course/types";
import { ChevronLeft, Edit, Plus, Save, Trash, Upload } from "lucide-react";

import { createCourse, getAllCategories } from "@/actions/courseAction";

import useUserStore from "@/stores/useUserStore";

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

interface CourseFormData {
  title: string;
  description: string;
  categoryId: string;
  level: CourseLevel;
  price: number;
  promotionPrice?: number;
  currency: string;
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [courseData, setCourseData] = useState<CourseFormData>({
    title: "",
    description: "",
    categoryId: "",
    level: CourseLevel.BEGINNER,
    price: 0,
    promotionPrice: 0,
    currency: "VND",
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
  }, []);
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setCourseData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setCourseData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setCourseData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
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
    console.log("+Data test: ", courseData);
    try {
      const result = await createCourse({
        ...courseData,
        ownerId: user?.id || "",
        thumbnailUrl: selectedImage || undefined,
      });

      if (result.success) {
        toast({
          title: "Thành công",
          description: "Tạo khóa học thành công",
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
        description: "Đã có lỗi xảy ra khi tạo khóa học",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-1 overflow-hidden ">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/courses">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Thêm khóa học mới</h1>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Tên khóa học *</Label>
              <Input
                id="title"
                name="title"
                value={courseData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả *</Label>
              <Textarea
                id="description"
                name="description"
                value={courseData.description}
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
              {categories.length === 0 && !isLoadingCategories && (
                <p className="text-sm text-red-500">
                  Không có danh mục nào. Vui lòng thêm danh mục trước.
                </p>
              )}
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

            <div className="space-y-2">
              <Label htmlFor="price">Giá gốc</Label>
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
              <Label htmlFor="promotionPrice">Giá khuyến mãi</Label>
              <Input
                id="promotionPrice"
                name="promotionPrice"
                type="number"
                min="0"
                max={courseData.price}
                value={courseData.promotionPrice}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Đơn vị tiền tệ</Label>
              <Select
                value={courseData.currency}
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

            <div className="space-y-2 items-center">
              {courseData.tags.map((tag, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={tag}
                    onChange={(e) =>
                      handleArrayFieldChange("tags", index, e.target.value)
                    }
                    placeholder="Nhập tag"
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

            <div className="space-y-2">
              <Label htmlFor="targetAudience">Đối tượng mục tiêu</Label>
              <Textarea
                id="targetAudience"
                name="targetAudience"
                value={courseData.targetAudience}
                onChange={handleInputChange}
                placeholder="Mô tả đối tượng học viên mục tiêu của khóa học"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPublished"
                checked={courseData.isPublished}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("isPublished", checked as boolean)
                }
              />
              <Label htmlFor="isPublished">Xuất bản ngay</Label>
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

            <div className="space-y-2">
              <Label>Kết quả học tập</Label>
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

            <div className="space-y-2">
              <Label>Yêu cầu</Label>
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
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ảnh bìa</Label>
              <div className="border rounded-lg p-4">
                {selectedImage ? (
                  <div className="relative aspect-video">
                    <img
                      src={selectedImage}
                      alt="Course thumbnail"
                      className="object-cover rounded-lg w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center border-2 border-dashed rounded-lg">
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">Tải ảnh lên</p>
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="thumbnail"
                />
                <Label
                  htmlFor="thumbnail"
                  className="block w-full text-center mt-4"
                >
                  <Button variant="outline" type="button">
                    Chọn ảnh
                  </Button>
                </Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            toast({
              title: "Scheduled: Catch up",
              description: "Friday, February 10, 2023 at 5:57 PM",
            });
            router.push("/admin/courses");
          }}
        >
          Hủy
        </Button>
        <Button variant="outline" type="submit" onClick={handleSubmit}>
          {isSubmitting ? "Đang tạo..." : "Tạo khóa học"}
        </Button>
      </div>
    </form>
  );
}
