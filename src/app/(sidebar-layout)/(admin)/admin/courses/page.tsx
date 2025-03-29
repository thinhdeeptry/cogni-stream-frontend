"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Course } from "@/types/course/types";
import { Edit, Eye, Plus, Trash } from "lucide-react";

import useUserStore from "@/stores/useUserStore";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const { user } = useUserStore();

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý khoá học</h1>
        <Link href="/admin/courses/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Thêm khoá học
          </Button>
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên khoá học</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="font-medium">{course.title}</TableCell>
                <TableCell>{course.category?.name}</TableCell>
                <TableCell>
                  {course.price === 0
                    ? "Miễn phí"
                    : `${course.price.toLocaleString()} ${course.currency}`}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${course.isPublished ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                  >
                    {course.isPublished ? "Đã xuất bản" : "Bản nháp"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/course/${course.id}`}>
                      <Button variant="outline" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/admin/courses/${course.id}`}>
                      <Button variant="outline" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-red-500"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
