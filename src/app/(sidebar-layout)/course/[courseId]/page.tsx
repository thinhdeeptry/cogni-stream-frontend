"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Course } from "@/types/course/types";
import { Book, Crown, Plus, Users } from "lucide-react";

import { getCourseById } from "@/actions/courseAction";
import {
  createThread,
  getThreadByResourceId,
} from "@/actions/discussion.action";

import useUserStore from "@/stores/useUserStore";

import Discussion from "@/components/discussion";
import { DiscussionType } from "@/components/discussion/type";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function CourseDetail() {
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const params = useParams();
  const { user } = useUserStore();
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const data = await getCourseById(params.courseId as string);
        setCourse(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [params.courseId]);

  useEffect(() => {
    const fetchOrCreateThread = async () => {
      console.log("Course ID:", params.courseId);
      if (!params.courseId) return;

      try {
        console.log("Fetching thread for resource ID:", params.courseId);
        // First try to get the thread by resource ID
        let thread = await getThreadByResourceId(
          params.courseId as string,
          DiscussionType.COURSE_REVIEW,
        );
        console.log("Thread fetch result:", thread);

        // If the thread doesn't exist, create a new one
        if (!thread) {
          console.log("Thread not found, creating new thread");
          thread = await createThread(
            params.courseId as string,
            DiscussionType.COURSE_REVIEW,
            course?.title || `Course ${params.courseId}`,
            4.5, // Default overall rating
          );
          console.log("New thread created:", thread);
        }

        // Set the thread ID if we have a thread
        if (thread) {
          console.log("Setting thread ID:", thread.id);
          setThreadId(thread.id);
        } else {
          console.log("No thread available to set ID");
        }
      } catch (err) {
        console.error("Error fetching or creating thread:", err);
        // Don't set an error state here, as this is not critical for the page to function
        // The Discussion component just won't be rendered if threadId is null
      }
    };

    // Only try to fetch/create thread if we have a course ID and the user is logged in
    if (params.courseId && user) {
      fetchOrCreateThread();
    }
  }, [params.courseId, user?.id]);

  const handleEnrollClick = () => {
    if (course?.chapters && course.chapters.length > 0) {
      const firstChapter = course.chapters[0];
      if (firstChapter.lessons && firstChapter.lessons.length > 0) {
        const firstLesson = firstChapter.lessons[0];
        if (course.price === 0 || firstLesson.isFreePreview) {
          window.location.href = `/course/${course.id}/lesson/${firstLesson.id}`;
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        {error}
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Course not found
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex gap-8 justify-center min-h-screen p-5">
      {/* Left Column */}
      <div className="w-2/3 space-y-8">
        <div>
          <h1 className="text-3xl font-semibold mb-4">{course.title}</h1>
          <p className="text-gray-600">{course.description}</p>
        </div>

        {/* Learning Outcomes */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Bạn sẽ học được gì?</h2>
          <ul className="grid grid-cols-2 gap-4">
            {course.learningOutcomes.map((outcome, index) => (
              <li key={index} className="flex text-start gap-2 ">
                <div className="text-orange-500">✓</div>
                <span className="">{outcome}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">Nội dung khoá học</h2>
          <p className="text-gray-600 mb-4 text-xs">
            <span className="font-semibold">• Số chương: </span>
            {course.chapters?.length || 0}{" "}
            <span className="font-semibold ml-4">• Số bài: </span>
            {course.totalLessons}
          </p>
          <div className="space-y-4">
            {course.chapters?.map((chapter) => (
              <Collapsible key={chapter.id}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="text-gray-500" data-state="closed">
                      <Plus className="h-4 w-4 text-orange-500" />
                    </div>
                    <h3 className="font-semibold text-gray-700">
                      {chapter.title}
                    </h3>
                  </div>
                  <span className="text-sm text-gray-600">
                    {chapter.lessons?.length || 0} bài
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4">
                  <ul className="mt-2 space-y-2">
                    {chapter.lessons?.map((lesson) => (
                      <Link
                        href={
                          isEnrolled || lesson.isFreePreview
                            ? `/course/${course.id}/lesson/${lesson.id}`
                            : `#`
                        }
                        key={lesson.id}
                        className={`flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg ${isEnrolled || lesson.isFreePreview ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
                        onClick={(e) => {
                          if (!isEnrolled && !lesson.isFreePreview) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Book className="h-4 w-4" />
                          <span>{lesson.title}</span>
                        </div>
                        {lesson.isFreePreview && (
                          <span className="text-xs bg-gray-200 text-black px-2 py-1 rounded">
                            Preview
                          </span>
                        )}
                      </Link>
                    ))}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>

        {/* Requirements */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Yêu cầu</h2>
          <ul className="space-y-2">
            {course.requirements.map((requirement, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="">•</div>
                <span>{requirement}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="w-1/3">
        <div className="sticky top-8">
          <Card className="overflow-hidden">
            <div className="relative aspect-video w-full">
              <Image
                src={course.thumbnailUrl || "/placeholder-course.jpg"}
                alt={course.title}
                fill
                className="object-cover"
              />
              {course.price > 0 && (
                <div className="absolute top-2 right-2 rounded-lg px-1 py-1.5 bg-gray-500/35">
                  <Crown size={18} color={"gold"} />
                </div>
              )}
            </div>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Price */}
                <div className="flex items-center gap-2">
                  {course.price === 0 ? (
                    <p className="text-red-600 text-2xl font-semibold">
                      Miễn phí
                    </p>
                  ) : (
                    <div className="space-y-1">
                      <p
                        className={`font-semibold text-2xl ${course.promotionPrice ? "text-red-600" : "text-red-600"}`}
                      >
                        {course.promotionPrice
                          ? course.promotionPrice.toLocaleString()
                          : course.price.toLocaleString()}{" "}
                        {course.currency}
                      </p>
                      {course.promotionPrice && (
                        <p className="text-gray-500 line-through">
                          {course.price.toLocaleString()} {course.currency}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Course Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users size={18} />
                    <span>
                      Level:{" "}
                      <span className="font-semibold">{course.level}</span>{" "}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Book size={18} />
                    <span>{course.totalLessons} bài học</span>
                  </div>
                </div>

                {/* Target Audience */}
                {course.targetAudience && (
                  <div className="text-gray-600">
                    <h3 className="font-semibold mb-1">Đối tượng học viên:</h3>
                    <p>{course.targetAudience}</p>
                  </div>
                )}

                {/* Enroll Button */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleEnrollClick}
                  disabled={isEnrolled}
                >
                  <p className="text-md font-semibold">
                    {isEnrolled ? "Đã đăng ký" : "Đăng ký"}
                  </p>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Discussion Component */}
      {threadId && <Discussion threadId={threadId} />}
    </div>
  );
}
