"use client";
import { useParams } from "next/navigation";
export default function CourseDetail() {
  const params = useParams();
  const courseId = params.courseId;
  return (
    <div className="flex-1 flex items-start justify-center min-h-screen p-8">
      <div className="max-w-3xl w-full">
        <h1 className="text-3xl font-semibold mb-4">Course Detail</h1>
        <p>Course ID: {courseId}</p>
      </div>
    </div>
  );
}
