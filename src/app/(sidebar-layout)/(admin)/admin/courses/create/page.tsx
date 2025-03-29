"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { CourseLevel } from "@/types/course/types";
import { ChevronLeft, Edit, Plus, Save, Trash, Upload } from "lucide-react";

import useUserStore from "@/stores/useUserStore";

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
  const { user } = useUserStore();
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
    tags: [] as string[],
    learningOutcomes: [""] as string[],
    requirements: [""] as string[],
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

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/courses">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Thêm khoá học mới</h1>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Tên khoá học</Label>
              <Input
                id="title"
                name="title"
                value={courseData.title}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Input
                id="description"
                name="description"
                value={courseData.description}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Danh mục</Label>
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
                  <SelectItem value="cat1">Lập trình web</SelectItem>
                  <SelectItem value="cat2">Lập trình mobile</SelectItem>
                  <SelectItem value="cat3">Lập trình game</SelectItem>
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

            <div className="space-y-2">
              <Label htmlFor="price">Giá (VND)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={courseData.price}
                onChange={handleInputChange}
              />
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
    </div>
  );
}
