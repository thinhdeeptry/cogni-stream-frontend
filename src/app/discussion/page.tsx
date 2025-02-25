"use client";

import DiscussionSection from "@/components/discussion";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const THREAD_IDS = {
  course: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11",
  lesson: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12",
};

export default function DiscussionTest() {
  const [currentThreadId, setCurrentThreadId] = useState(THREAD_IDS.course);

  const toggleThread = () => {
    setCurrentThreadId(
      currentThreadId === THREAD_IDS.course
        ? THREAD_IDS.lesson
        : THREAD_IDS.course,
    );
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">
          {currentThreadId === THREAD_IDS.course
            ? "Course Review"
            : "Lesson Discussion"}
        </h2>
        <Button onClick={toggleThread} variant="outline">
          Switch to{" "}
          {currentThreadId === THREAD_IDS.course
            ? "Lesson Discussion"
            : "Course Review"}
        </Button>
      </div>

      <div className="max-w-[500px] ml-auto">
        <DiscussionSection
          threadId={currentThreadId}
          currentUserId="97017806-520f-45ef-9fe9-90e7daf39e22"
        />
      </div>
    </div>
  );
}
