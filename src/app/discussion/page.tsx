"use client";

import { useEffect, useState } from "react";

import { getAllThreads } from "@/actions/discussion.action";

import useUserStore from "@/stores/useUserStore";

import DiscussionSection from "@/components/discussion";
import type { ThreadWithPostCount } from "@/components/discussion/type";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DiscussionTest() {
  const [threads, setThreads] = useState<ThreadWithPostCount[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const user = useUserStore((state) => state.user);

  console.log(user);

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const data = await getAllThreads();
        setThreads(data);
        if (data.length > 0) {
          setCurrentThreadId(data[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch threads:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchThreads();
  }, []);

  if (!user) {
    return (
      <div className="p-4">
        <p className="text-center text-muted-foreground">
          Please log in to participate in discussions.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <p className="text-center text-muted-foreground">Loading threads...</p>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="p-4">
        <p className="text-center text-muted-foreground">
          No discussion threads found.
        </p>
      </div>
    );
  }

  const currentThread = threads.find((thread) => thread.id === currentThreadId);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">Discussion Threads</h2>
          <Select value={currentThreadId} onValueChange={setCurrentThreadId}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a thread" />
            </SelectTrigger>
            <SelectContent>
              {threads.map((thread) => (
                <SelectItem key={thread.id} value={thread.id}>
                  {thread.title || `Thread ${thread.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {currentThread && (
        <div className="max-w-[500px] ml-auto">
          <DiscussionSection threadId={currentThread.id} />
        </div>
      )}
    </div>
  );
}
