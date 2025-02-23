"use client";

import type React from "react";
import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";
import type { ThreadWithPostCount } from "./type";
import { DiscussionType } from "./type";
import { useDiscussionStore } from "./discussion.store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Smile } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import data from "@emoji-mart/data";
import { Rating } from "@/components/ui/rating";
import { PostCard } from "./PostCard";

// Dynamically import EmojiPicker to avoid SSR issues
const EmojiPicker = dynamic(() => import("@emoji-mart/react"), { ssr: false });

interface DiscussionProps {
  threadId: string;
  currentUserId?: string;
  thread: ThreadWithPostCount;
}

interface EmojiData {
  native: string;
  id: string;
  unified: string;
  keywords: string[];
}

function RatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  return <Rating value={value} onChange={onChange} className="mb-2" />;
}

export default function DiscussionSection({
  threadId,
  currentUserId,
}: Omit<DiscussionProps, "thread">) {
  const {
    thread,
    posts,
    isLoading,
    error,
    fetchThread,
    fetchPosts,
    addReply,
    setCurrentUserId,
    setCurrentThreadId,
    currentPage,
  } = useDiscussionStore();
  const [newPostContent, setNewPostContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [rating, setRating] = useState(5);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const newPostInputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize thread
  useEffect(() => {
    setCurrentThreadId(threadId);
    fetchThread();
  }, [threadId, setCurrentThreadId, fetchThread]);

  // Set currentUserId when it changes
  useEffect(() => {
    if (currentUserId) {
      setCurrentUserId(currentUserId);
    }
  }, [currentUserId, setCurrentUserId]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleLoadMore = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      await fetchPosts(currentPage + 1);
    } catch (err) {
      toast.error("Failed to load more posts: " + err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSubmitNewPost = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUserId) {
      toast.error("Please log in to post");
      return;
    }
    if (!thread) {
      toast.error("Thread not found");
      return;
    }
    if (newPostContent.trim()) {
      const postRating =
        thread.type === DiscussionType.COURSE_REVIEW ? rating : undefined;
      await addReply(null, newPostContent, postRating);
      setNewPostContent("");
      setRating(5);
      if (newPostInputRef.current) {
        newPostInputRef.current.style.height = "auto";
      }
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewPostContent(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleEmojiSelect = (emoji: EmojiData) => {
    const start = newPostInputRef.current?.selectionStart || 0;
    const end = newPostInputRef.current?.selectionEnd || 0;
    const newContent =
      newPostContent.substring(0, start) +
      emoji.native +
      newPostContent.substring(end);
    setNewPostContent(newContent);
  };

  if (isLoading && !isLoadingMore) {
    return <div>Loading discussions...</div>;
  }

  if (!thread) {
    return <div>Thread not found</div>;
  }

  const totalPosts = thread._count?.posts || 0;
  const hasMorePosts = totalPosts > posts.length;

  return (
    <div className="space-y-6">
      {currentUserId ? (
        <form
          onSubmit={handleSubmitNewPost}
          className="mb-8 flex items-start gap-2"
        >
          <Avatar className="w-8 h-8">
            <AvatarImage
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUserId}`}
            />
            <AvatarFallback>
              {currentUserId.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="bg-white rounded-lg border">
              <div className="relative p-2">
                {thread.type === DiscussionType.COURSE_REVIEW &&
                  posts.length === 0 && (
                    <RatingInput value={rating} onChange={setRating} />
                  )}
                <Textarea
                  ref={newPostInputRef}
                  value={newPostContent}
                  onChange={handleTextareaChange}
                  placeholder={
                    thread.type === DiscussionType.COURSE_REVIEW
                      ? "Write your course review..."
                      : "Write a comment..."
                  }
                  className="min-h-[45px] max-h-[200px] border-0 focus-visible:ring-0 resize-none rounded-lg pr-24 py-2.5 text-sm"
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-0.5">
                  <Popover
                    open={showEmojiPicker}
                    onOpenChange={setShowEmojiPicker}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                      >
                        <Smile className="h-4 w-4 text-gray-500" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="end">
                      <EmojiPicker
                        data={data}
                        onEmojiSelect={handleEmojiSelect}
                        theme="light"
                        previewPosition="none"
                        skinTonePosition="none"
                      />
                    </PopoverContent>
                  </Popover>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="submit"
                          size="icon"
                          variant="ghost"
                          disabled={!newPostContent.trim()}
                          className="h-7 w-7"
                        >
                          <Send className="h-4 w-4 text-primary" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Post comment</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="text-center text-gray-500">
          Please log in to post comments
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Discussion ({totalPosts} {totalPosts === 1 ? "post" : "posts"})
          </h2>
        </div>

        {posts.length > 0 ? (
          <>
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUserId}
                  thread={thread}
                />
              ))}
            </div>

            {hasMorePosts && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="w-full max-w-xs"
                >
                  {isLoadingMore ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading...
                    </div>
                  ) : (
                    `Show More (${totalPosts - posts.length} remaining)`
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No posts yet. Be the first to start the discussion!
          </div>
        )}
      </div>
    </div>
  );
}
