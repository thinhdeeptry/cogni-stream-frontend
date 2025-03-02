"use client";

import { useEffect, useState } from "react";

import { Loader2, MessageCircle, Users, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { useDiscussionStore } from "../../stores/useDiscussion";
import { PostCard } from "./PostCard";
import UserInput from "./UserInput";
import { DiscussionType } from "./type";

// Content component that handles the scrollable content area
function DiscussionContent({
  threadId,
  userId,
  userName,
  thread,
  posts,
  isLoading,
  error,
  threadUsers,
  isConnected,
  isReconnecting,
  showReplies,
  isLoadingMore,
  loadingReplies,
  repliesMap,
  toggleReplies,
  loadMoreReplies,
  loadMorePosts,
}: {
  threadId: string;
  userId: string;
  userName: string;
  thread: any;
  posts: any[];
  isLoading: boolean;
  error: string | null;
  threadUsers: any[];
  isConnected: boolean;
  isReconnecting: boolean;
  showReplies: Record<string, boolean>;
  isLoadingMore: boolean;
  loadingReplies: Record<string, boolean>;
  repliesMap: Record<string, any[]>;
  toggleReplies: (postId: string) => void;
  loadMoreReplies: (postId: string) => void;
  loadMorePosts: () => void;
}) {
  if (isLoading && !posts.length) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!thread) {
    return <div>Không tìm thấy bài viết</div>;
  }

  const hasMorePosts = thread._count.posts > posts.length;
  const totalPosts = thread._count.posts;

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={userId}
            thread={thread}
            replies={repliesMap[post.id] || []}
            onToggleReplies={() => toggleReplies(post.id)}
            onLoadMoreReplies={() => loadMoreReplies(post.id)}
            isLoadingReplies={loadingReplies[post.id]}
            showReplies={showReplies[post.id]}
          />
        ))}
      </div>

      {hasMorePosts && (
        <div className="flex justify-center pt-4">
          <Button
            variant="link"
            onClick={loadMorePosts}
            disabled={isLoadingMore}
            className="w-full max-w-xs text-xs"
          >
            {isLoadingMore ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              `Hiển thị thêm (${totalPosts - posts.length} bình luận còn lại)`
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// Main wrapper component with Sheet
export default function Discussion({
  threadId,
  userId,
  userName,
}: {
  threadId: string;
  userId: string;
  userName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    posts,
    thread,
    isLoading,
    error,
    threadUsers,
    isConnected,
    isReconnecting,
    showReplies,
    isLoadingMore,
    loadingReplies,
    hasReviewed,
    repliesMap,
    setCurrentUserId,
    setCurrentUserName,
    setCurrentThreadId,
    initializeSocket,
    cleanupSocket,
    fetchThread,
    fetchPosts,
    addReply,
    toggleReplies,
    loadMoreReplies,
    loadMorePosts,
  } = useDiscussionStore();

  // Only set user info once, regardless of sheet open state
  useEffect(() => {
    setCurrentUserId(userId);
    setCurrentUserName(userName);
    setCurrentThreadId(threadId);
  }, [
    threadId,
    userId,
    userName,
    setCurrentUserId,
    setCurrentUserName,
    setCurrentThreadId,
  ]);

  // Only initialize socket and fetch data when sheet is open
  useEffect(() => {
    // Skip if sheet is not open
    if (!isOpen) return;

    // Initialize socket when sheet opens
    initializeSocket();

    // Fetch thread and posts
    fetchThread();
    fetchPosts();

    // Clean up socket when sheet closes or component unmounts
    return () => {
      cleanupSocket();
    };
  }, [
    isOpen, // Add isOpen as dependency so effect runs when sheet opens
    threadId,
    fetchThread,
    fetchPosts,
    initializeSocket,
    cleanupSocket,
  ]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const totalPosts = thread?._count?.posts || 0;

  return (
    <>
      {/* Floating MessageCircle button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full h-12 w-12 shadow-lg"
        aria-label="Open discussion"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Sheet component */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="flex flex-col p-0 w-full sm:max-w-md md:max-w-lg lg:max-w-2xl">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-background border-b">
            <SheetHeader className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <SheetTitle>
                    {thread?.type === DiscussionType.COURSE_REVIEW
                      ? "Đánh giá khóa học"
                      : "Thảo luận"}
                  </SheetTitle>

                  {/* Thread info */}
                  {thread && (
                    <div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{totalPosts} bình luận</span>
                        <span>Hiện {threadUsers.length} người đang xem</span>
                        {isConnected && (
                          <span className="text-green-500">•</span>
                        )}
                        {isReconnecting && (
                          <span className="flex items-center gap-1 text-yellow-500">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Đang kết nối
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <SheetClose className="rounded-full p-1.5 hover:bg-muted">
                  <X className="h-4 w-4" />
                </SheetClose>
              </div>

              {thread?.type === DiscussionType.COURSE_REVIEW && hasReviewed && (
                <div className="text-xs text-muted-foreground mt-2">
                  Bạn đã đánh giá khóa học này. Bạn vẫn có thể tham gia thảo
                  luận mà không cần thêm điểm đánh giá.
                </div>
              )}
            </SheetHeader>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-4 px-12">
            {isOpen && (
              <DiscussionContent
                threadId={threadId}
                userId={userId}
                userName={userName}
                thread={thread}
                posts={posts}
                isLoading={isLoading}
                error={error}
                threadUsers={threadUsers}
                isConnected={isConnected}
                isReconnecting={isReconnecting}
                showReplies={showReplies}
                isLoadingMore={isLoadingMore}
                loadingReplies={loadingReplies}
                repliesMap={repliesMap}
                toggleReplies={toggleReplies}
                loadMoreReplies={loadMoreReplies}
                loadMorePosts={loadMorePosts}
              />
            )}
          </div>

          {/* Sticky Footer with UserInput */}
          <div className="sticky bottom-0 bg-background border-t p-2">
            {isOpen && thread && (
              <UserInput
                currentUserId={userId}
                thread={thread}
                parentId={undefined}
                placeholder={
                  thread.type === DiscussionType.COURSE_REVIEW && !hasReviewed
                    ? "Đánh giá khóa học với tên của bạn..."
                    : "Bình luận dưới tên của bạn..."
                }
                hideRating={hasReviewed}
                onSubmit={async (content, rating) => {
                  if (
                    thread.type === DiscussionType.COURSE_REVIEW &&
                    !hasReviewed &&
                    !rating
                  ) {
                    throw new Error(
                      "Bạn phải cung cấp điểm đánh giá với bình luận đầu tiên của bạn",
                    );
                  }
                  await addReply(null, content, rating);
                }}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
