"use client";

import { useEffect, useState } from "react";
import { useDiscussionStore } from "./discussion.store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PostCard } from "./PostCard";
import UserInput from "./UserInput";
import { Loader2, Users } from "lucide-react";
import { ConnectionStatus } from "./ConnectionStatus";
import { DiscussionType } from "./type";
import { checkUserReview } from "./discussion.action";

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
    typingUsers,
    threadUsers,
    isConnected,
    connectionError,
    isReconnecting,
    setCurrentUserId,
    setCurrentUserName,
    setCurrentThreadId,
    initializeSocket,
    cleanupSocket,
    fetchThread,
    fetchPosts,
    currentPage,
    fetchReplies,
    repliesMap,
    addReply,
  } = useDiscussionStore();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>(
    {},
  );
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});
  const [hasReviewed, setHasReviewed] = useState(false);

  // Add effect to watch repliesMap changes
  useEffect(() => {
    Object.keys(repliesMap).forEach((postId) => {
      if (repliesMap[postId]?.length > 0) {
        setShowReplies((prev) => ({
          ...prev,
          [postId]: true,
        }));
      }
    });
  }, [repliesMap]);

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

  // Check if user has already reviewed when thread loads
  useEffect(() => {
    const checkReviewStatus = async () => {
      if (thread?.type === DiscussionType.COURSE_REVIEW && userId) {
        try {
          const { hasReviewed: userHasReviewed } = await checkUserReview(
            thread.resourceId,
            userId,
          );
          setHasReviewed(userHasReviewed);
        } catch (err) {
          console.error("Failed to check review status:", err);
        }
      }
    };

    if (thread) {
      checkReviewStatus();
    }
  }, [thread, userId]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleToggleReplies = async (postId: string) => {
    setShowReplies((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));

    if (!repliesMap[postId]) {
      setLoadingReplies((prev) => ({
        ...prev,
        [postId]: true,
      }));
      try {
        await fetchReplies(postId);
      } finally {
        setLoadingReplies((prev) => ({
          ...prev,
          [postId]: false,
        }));
      }
    }
  };

  const handleLoadMoreReplies = async (postId: string) => {
    setLoadingReplies((prev) => ({
      ...prev,
      [postId]: true,
    }));
    try {
      await fetchReplies(postId, (repliesMap[postId]?.length || 0) / 3 + 1);
    } finally {
      setLoadingReplies((prev) => ({
        ...prev,
        [postId]: false,
      }));
    }
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      await fetchPosts(currentPage + 1);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Render typing indicator with improved UI
  const renderTypingIndicator = () => {
    const typingUsersExceptCurrent = typingUsers.filter(
      (user) => user.userId !== userId,
    );

    if (typingUsersExceptCurrent.length === 0) return null;

    const names = typingUsersExceptCurrent.map((user) => user.userName);
    let message = "";

    if (names.length === 1) {
      message = `${names[0]} is typing...`;
    } else if (names.length === 2) {
      message = `${names[0]} and ${names[1]} are typing...`;
    } else {
      message = `${names[0]} and ${names.length - 1} others are typing...`;
    }

    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
        <div className="flex gap-1">
          <span className="animate-bounce">•</span>
          <span className="animate-bounce delay-100">•</span>
          <span className="animate-bounce delay-200">•</span>
        </div>
        {message}
      </div>
    );
  };

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
    return <div>Thread not found</div>;
  }

  const hasMorePosts = thread._count.posts > posts.length;
  const totalPosts = thread._count.posts;

  return (
    <div className="space-y-4">
      <ConnectionStatus
        isConnected={isConnected}
        connectionError={connectionError}
        isReconnecting={isReconnecting}
        threadUsers={threadUsers}
        currentUserId={userId}
      />

      <div className="border-b pb-4 space-y-2">
        <h1 className="text-2xl font-semibold">{thread?.title}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{totalPosts} posts</span>
          <span className="text-gray-300">•</span>
          <span>{threadUsers.length} viewing</span>
          {isConnected && <span className="text-green-500">•</span>}
          {isReconnecting && (
            <span className="flex items-center gap-1 text-yellow-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              Reconnecting
            </span>
          )}
        </div>
      </div>

      {thread?.type === DiscussionType.COURSE_REVIEW && hasReviewed ? (
        <div className="text-sm text-muted-foreground mb-2">
          You have already reviewed this course. You can still participate in
          the discussion without adding a rating.
        </div>
      ) : null}

      <UserInput
        currentUserId={userId}
        thread={thread}
        parentId={undefined}
        placeholder={
          thread?.type === DiscussionType.COURSE_REVIEW && !hasReviewed
            ? "Write your course review (rating required)..."
            : "Start a discussion..."
        }
        hideRating={hasReviewed}
        onSubmit={async (content, rating) => {
          if (
            thread?.type === DiscussionType.COURSE_REVIEW &&
            !hasReviewed &&
            !rating
          ) {
            throw new Error(
              "You must provide a rating with your first course review",
            );
          }
          await addReply(null, content, rating);
          if (
            thread?.type === DiscussionType.COURSE_REVIEW &&
            rating !== undefined
          ) {
            setHasReviewed(true);
          }
        }}
      />

      {renderTypingIndicator()}

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={userId}
            thread={thread}
            replies={repliesMap[post.id] || []}
            onToggleReplies={handleToggleReplies}
            onLoadMoreReplies={handleLoadMoreReplies}
            isLoadingReplies={loadingReplies[post.id]}
            showReplies={showReplies[post.id]}
          />
        ))}
      </div>

      {hasMorePosts && (
        <div className="flex justify-center pt-4">
          <Button
            variant="link"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="w-full max-w-xs text-xs"
          >
            {isLoadingMore ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              `Show More (${totalPosts - posts.length} remaining)`
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
