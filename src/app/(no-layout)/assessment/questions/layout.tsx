"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { mockCourses } from "@/data/mock";

import { Tree } from "@/components/ui/tree";

function transformCoursesToTreeData(courses: typeof mockCourses) {
  return courses.map((course) => ({
    id: course.id,
    name: course.name,
    children: course.chapters.map((chapter) => ({
      id: chapter.id,
      name: chapter.name,
      children: chapter.lessons.map((lesson) => ({
        id: lesson.id,
        name: lesson.name,
      })),
    })),
  }));
}

export default function QuestionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("contextId") || "";

  const handleSelect = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("contextId", id);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-80 border-r flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Danh sách khóa học</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <Tree
            data={transformCoursesToTreeData(mockCourses)}
            onSelect={handleSelect}
            selectedId={selectedId}
          />
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
