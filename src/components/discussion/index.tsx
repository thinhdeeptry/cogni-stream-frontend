"use client";

import { useEffect } from "react";

import { Loader2, MessageCircle, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { useDiscussionStore } from "../../stores/useDiscussion";
import { PostCard } from "./PostCard";
import UserInput from "./UserInput";
import { DiscussionType } from "./type";

export default function Discussion({
  threadId,
  userId,
  userName,
}: {
  threadId: string;
  userId: string;
  userName: string;
}) {
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

  useEffect(() => {
    setCurrentUserId(userId);
    setCurrentUserName(userName);
    setCurrentThreadId(threadId);
    initializeSocket();

    return () => {
      cleanupSocket();
    };
  }, [
    threadId,
    userId,
    userName,
    setCurrentUserId,
    setCurrentUserName,
    setCurrentThreadId,
    initializeSocket,
    cleanupSocket,
  ]);

  useEffect(() => {
    if (threadId) {
      fetchThread();
      fetchPosts();
    }
  }, [threadId, fetchThread, fetchPosts]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

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
      <div className="border-b pb-4 space-y-2">
        <h1 className="text-2xl font-semibold">{thread?.title}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageCircle className="h-4 w-4" />
          <span>{totalPosts} bình luận</span>
          <span className="text-gray-300">•</span>
          <Users className="h-4 w-4" />
          <span>{threadUsers.length} người đang xem</span>
          {isConnected && <span className="text-green-500">•</span>}
          {isReconnecting && (
            <span className="flex items-center gap-1 text-yellow-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              Đang kết nối
            </span>
          )}
        </div>
      </div>

      {thread?.type === DiscussionType.COURSE_REVIEW && hasReviewed ? (
        <div className="text-sm text-muted-foreground mb-2">
          Bạn đã đánh giá khóa học này. Bạn vẫn có thể tham gia thảo luận mà
          không cần thêm điểm đánh giá.
        </div>
      ) : null}

      <UserInput
        currentUserId={userId}
        thread={thread}
        parentId={undefined}
        placeholder={
          thread?.type === DiscussionType.COURSE_REVIEW && !hasReviewed
            ? "Đánh giá khóa học với tên của bạn..."
            : "Bình luận dưới tên của bạn..."
        }
        hideRating={hasReviewed}
        onSubmit={async (content, rating) => {
          if (
            thread?.type === DiscussionType.COURSE_REVIEW &&
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
