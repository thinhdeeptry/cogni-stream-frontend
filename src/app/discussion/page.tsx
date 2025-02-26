"use client";

import DiscussionSection from "@/components/discussion";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const THREAD_IDS = {
  course: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11",
  lesson: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12",
};

interface TestUser {
  id: string;
  name: string;
}

const TEST_USERS: TestUser[] = [
  { id: "97017806-520f-45ef-9fe9-90e7daf39e22", name: "John Doe" },
  { id: "97017806-520f-45ef-9fe9-90e7daf39e23", name: "Jane Smith" },
  { id: "97017806-520f-45ef-9fe9-90e7daf39e24", name: "Bob Johnson" },
];

export default function DiscussionTest() {
  const [currentThreadId, setCurrentThreadId] = useState(THREAD_IDS.course);
  const [currentUser, setCurrentUser] = useState<TestUser>(TEST_USERS[0]);

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
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">
            {currentThreadId === THREAD_IDS.course
              ? "Course Review"
              : "Lesson Discussion"}
          </h2>
          <Select
            value={currentUser.id}
            onValueChange={(value: string) => {
              const user = TEST_USERS.find((u) => u.id === value);
              if (user) setCurrentUser(user);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {TEST_USERS.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
          userId={currentUser.id}
          userName={currentUser.name}
        />
      </div>
    </div>
  );
}
