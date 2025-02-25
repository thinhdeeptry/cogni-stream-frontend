"use client";

import { useEffect, useState } from "react";
import type { ThreadWithPostCount } from "./type";
import { useDiscussionStore } from "./discussion.store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PostCard } from "./PostCard";
import { UserInput } from "./UserInput";
import { Loading } from "../loading";

interface DiscussionProps {
  threadId: string;
  currentUserId?: string;
  thread: ThreadWithPostCount;
}

export default function DiscussionSection({
  threadId,
  currentUserId,
}: Omit<DiscussionProps, "thread">) {
  const {
    thread,
    posts,
    error,
    fetchThread,
    fetchPosts,
    setCurrentUserId,
    setCurrentThreadId,
    currentPage,
    fetchReplies,
    repliesMap,
  } = useDiscussionStore();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>(
    {},
  );
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});

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

  const handleToggleReplies = async (postId: string) => {
    // If we're already showing replies, just toggle the state
    if (showReplies[postId]) {
      setShowReplies((prev) => ({ ...prev, [postId]: false }));
      return;
    }

    // Otherwise, show replies and load them if needed
    setShowReplies((prev) => ({ ...prev, [postId]: true }));

    // Load replies if they haven't been loaded before
    if (
      !repliesMap[postId] &&
      (posts.find((p) => p.id === postId)?._count?.replies ?? 0) > 0
    ) {
      setLoadingReplies((prev) => ({ ...prev, [postId]: true }));
      try {
        await fetchReplies(postId, 1);
      } catch (err) {
        toast.error("Failed to load replies: " + err);
        setShowReplies((prev) => ({ ...prev, [postId]: false }));
      } finally {
        setLoadingReplies((prev) => ({ ...prev, [postId]: false }));
      }
    }
  };

  const handleLoadMoreReplies = async (postId: string) => {
    if (loadingReplies[postId]) return;
    setLoadingReplies((prev) => ({ ...prev, [postId]: true }));
    try {
      const currentReplies = repliesMap[postId] || [];
      const nextPage = Math.ceil(currentReplies.length / 10) + 1;
      await fetchReplies(postId, nextPage);
    } catch (err) {
      toast.error("Failed to load more replies: " + err);
    } finally {
      setLoadingReplies((prev) => ({ ...prev, [postId]: false }));
    }
  };

  if (!thread) {
    return <div>Thread not found</div>;
  }

  const totalPosts = thread._count?.posts || 0;
  const hasMorePosts = totalPosts > posts.length;

  return (
    <div className="space-y-6">
      <UserInput currentUserId={currentUserId} thread={thread} />

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
                      <Loading />
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
