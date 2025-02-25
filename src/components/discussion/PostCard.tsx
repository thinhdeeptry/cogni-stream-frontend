"use client";

import { useEffect, useState } from "react";
import type { Thread, PostWithReplyCount } from "./type";
import { DiscussionType } from "./type";
import { useDiscussionStore } from "./discussion.store";
import { ReactionButton } from "./ReactionButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Trash2, Pencil } from "lucide-react";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { toast } from "sonner";
import { Rating } from "@/components/rating";
import { UserInput } from "./UserInput";

interface PostCardProps {
  post: PostWithReplyCount;
  currentUserId?: string;
  level?: number;
  thread: Thread;
  replies?: PostWithReplyCount[];
  onToggleReplies?: (postId: string) => void;
  onLoadMoreReplies?: (postId: string) => void;
  isLoadingReplies?: boolean;
  showReplies?: boolean;
}

export function PostCard({
  post,
  currentUserId,
  level = 0,
  thread,
  replies = [],
  onToggleReplies,
  onLoadMoreReplies,
  isLoadingReplies = false,
  showReplies = false,
}: PostCardProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeletePopover, setShowDeletePopover] = useState(false);
  const { editPost, deletePost, addReaction, removeReaction, error } =
    useDiscussionStore();
  const MAX_REPLY_DEPTH = 3;

  // Get the effective parent ID for replies
  // If we're at max depth - 1, use the parent's ID instead of this post's ID
  const getEffectiveParentId = () => {
    if (level >= MAX_REPLY_DEPTH - 1 && post.parentId) {
      return post.parentId; // Use grandparent ID for level 3 posts
    }
    return post.id; // Use this post's ID normally
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleEditSuccess = async (content: string, rating?: number) => {
    if (!currentUserId) {
      toast.error("Please log in to edit");
      return;
    }

    await editPost(
      post.id,
      content,
      thread.type === DiscussionType.COURSE_REVIEW ? rating : undefined,
    );

    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!currentUserId) {
      toast.error("Please log in to delete");
      return;
    }
    await deletePost(post.id);
    setShowDeletePopover(false);
  };

  const getInitials = (id: string) => {
    return id ? id.slice(0, 2).toUpperCase() : "??";
  };

  const handleReplySuccess = (parentId: string) => {
    setIsReplying(false);

    // Always ensure replies are shown after adding a new reply
    if (!showReplies && onToggleReplies) {
      onToggleReplies(parentId);
    }

    // If this is a level 3 post and we're using the parent's ID
    if (level >= MAX_REPLY_DEPTH - 1 && post.parentId) {
      // Make sure the parent's replies are visible
      if (onToggleReplies) {
        onToggleReplies(post.parentId);
      }
      // Show a notification to the user
      toast.success(
        "Your reply was added to the parent thread to maintain readability",
      );
    }
    // For normal nested replies
    else if (level > 0 && post.parentId && onToggleReplies) {
      onToggleReplies(post.parentId);
    }
  };

  // Helper function to render reaction summary in Facebook style
  const renderReactionSummary = () => {
    if (!post.reactionCounts || post.reactionCounts.total === 0) {
      return null;
    }

    // Get the top 2 reactions by count (excluding 0 counts)
    const topReactions = Object.entries(post.reactionCounts)
      .filter(([key, count]) => key !== "total" && count > 0)
      .sort(([, countA], [, countB]) => (countB as number) - (countA as number))
      .slice(0, 2);

    if (topReactions.length === 0) return null;

    // Map of reaction types to emojis
    const reactionEmojis: Record<string, string> = {
      LIKE: "👍",
      LOVE: "❤️",
      CARE: "🤗",
      HAHA: "😄",
      WOW: "😮",
      SAD: "😢",
      ANGRY: "😠",
    };

    return (
      <div className="flex items-center mr-2">
        <div className="flex -space-x-1 mr-1">
          {topReactions.map(([type]) => (
            <div
              key={type}
              className="w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-200"
            >
              <span className="text-[10px]">{reactionEmojis[type]}</span>
            </div>
          ))}
        </div>
        <span className="text-xs text-gray-500">
          {post.reactionCounts.total}
        </span>
      </div>
    );
  };

  return (
    <div className={`mb-3 w-full max-w-xl ${level > 0 ? "ml-6" : ""}`}>
      <div className="flex items-start gap-2">
        {level > 0 && (
          <div className="relative -ml-6 mr-1">
            <div className="absolute top-4 -left-6 w-6 h-6 border-l-2 border-b-2 border-gray-200 rounded-bl-xl" />
          </div>
        )}
        <Avatar className="w-8 h-8">
          <AvatarImage
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}`}
          />
          <AvatarFallback>{getInitials(post.authorId)}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          {isEditing ? (
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <div className="font-semibold text-xs flex items-center gap-1">
                  <span className="text-blue-600">Edit post</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1 text-xs text-gray-500"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
              <EditInput
                currentUserId={currentUserId}
                thread={thread}
                initialContent={post.content}
                initialRating={post.rating || 5}
                onSubmitSuccess={handleEditSuccess}
                showAvatar={false}
              />
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-xs flex items-center gap-1">
                  {post.authorId ? post.authorId.slice(0, 8) : "Anonymous"}
                  {post.authorId === currentUserId && (
                    <span className="text-[10px] text-blue-500">· You</span>
                  )}
                </div>
                {currentUserId && post.authorId === currentUserId && (
                  <div className="flex items-center gap-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1 text-xs text-gray-500"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1 text-xs text-gray-500"
                      onClick={() => setShowDeletePopover(true)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {thread.type === DiscussionType.COURSE_REVIEW &&
                !post.parentId &&
                post.rating && (
                  <div className="mt-1">
                    <Rating
                      value={post.rating}
                      disabled
                      className="mb-2"
                      size="sm"
                    />
                  </div>
                )}

              <p className="mt-1 text-sm break-all">{post.content}</p>

              <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                <ReactionButton
                  postId={post.id}
                  reactions={post.reactions}
                  reactionCounts={post.reactionCounts}
                  currentUserId={currentUserId || ""}
                  onReact={(type, existingReactionId) => {
                    addReaction(post.id, type, existingReactionId);
                  }}
                  onRemoveReaction={(reactionId, reactionType) =>
                    removeReaction(reactionId, reactionType)
                  }
                />
                <div className="flex items-center">
                  <span className="text-xs text-gray-400 mr-3">
                    {formatDistanceToNow(new Date(post.createdAt), {
                      addSuffix: true,
                    })}
                    {post.isEdited && " (edited)"}
                  </span>
                  {renderReactionSummary()}
                </div>
              </div>
            </div>
          )}

          <div className="mt-1 ml-2 flex items-center gap-3 text-xs text-gray-500">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs p-0 h-6 flex items-center gap-1 hover:bg-transparent hover:text-blue-600"
              onClick={() => setIsReplying(!isReplying)}
              disabled={level >= MAX_REPLY_DEPTH}
              title={
                level >= MAX_REPLY_DEPTH ? "Maximum reply depth reached" : ""
              }
            >
              Reply
            </Button>

            {post._count?.replies > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs p-0 h-6 flex items-center gap-1 hover:bg-transparent hover:text-blue-600"
                onClick={() => onToggleReplies?.(post.id)}
                disabled={isLoadingReplies}
              >
                {isLoadingReplies ? (
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Loading...
                  </div>
                ) : (
                  <>
                    {showReplies
                      ? "Hide"
                      : `View ${post._count.replies} ${post._count.replies === 1 ? "reply" : "replies"}`}
                  </>
                )}
              </Button>
            )}

            <Popover
              open={showDeletePopover}
              onOpenChange={setShowDeletePopover}
            >
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Delete Comment</h4>
                    <p className="text-sm text-muted-foreground">
                      Are you sure you want to delete this comment? This action
                      cannot be undone.
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeletePopover(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {isReplying && level < MAX_REPLY_DEPTH && (
            <div className="mt-2 ml-2">
              <UserInput
                currentUserId={currentUserId}
                thread={thread}
                parentId={getEffectiveParentId()}
                onSubmitSuccess={() =>
                  handleReplySuccess(getEffectiveParentId())
                }
                placeholder={
                  level >= MAX_REPLY_DEPTH - 1
                    ? "Write a reply (will be added to parent thread)..."
                    : "Write a reply..."
                }
                showAvatar={false}
              />
            </div>
          )}

          {showReplies && replies.length > 0 && (
            <div className="mt-2 ml-1 space-y-2">
              <div className="space-y-2">
                {replies.map((reply) => (
                  <PostCard
                    key={reply.id}
                    post={reply}
                    currentUserId={currentUserId}
                    level={level + 1}
                    thread={thread}
                    onToggleReplies={onToggleReplies}
                    onLoadMoreReplies={onLoadMoreReplies}
                    isLoadingReplies={isLoadingReplies}
                    showReplies={showReplies}
                    replies={reply.replies || []}
                  />
                ))}

                {post._count?.replies > replies.length && (
                  <div className="flex justify-start ml-7 mt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onLoadMoreReplies?.(post.id);
                      }}
                      disabled={isLoadingReplies}
                      className="text-xs flex items-center gap-1 text-blue-500 hover:bg-transparent"
                    >
                      {isLoadingReplies ? (
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          Loading replies...
                        </div>
                      ) : (
                        <>
                          Load {post._count?.replies - replies.length} more{" "}
                          {post._count?.replies - replies.length === 1
                            ? "reply"
                            : "replies"}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// A specialized version of UserInput specifically for editing posts
function EditInput({
  currentUserId,
  thread,
  initialContent,
  initialRating,
  onSubmitSuccess,
  showAvatar = false,
}: {
  currentUserId?: string;
  thread: Thread;
  initialContent: string;
  initialRating?: number;
  onSubmitSuccess: (content: string, rating?: number) => Promise<void>;
  showAvatar?: boolean;
}) {
  const [content, setContent] = useState(initialContent);
  const [rating, setRating] = useState(initialRating || 5);

  return (
    <div className="flex-1">
      {thread.type === DiscussionType.COURSE_REVIEW && (
        <div className="mb-2 ml-2">
          <Rating value={rating} onChange={setRating} size="sm" />
        </div>
      )}
      <UserInput
        currentUserId={currentUserId}
        thread={thread}
        initialContent={initialContent}
        onContentChange={setContent}
        onSubmitSuccess={() => onSubmitSuccess(content, rating)}
        placeholder="Edit your comment..."
        showAvatar={showAvatar}
        submitButtonText="Save"
      />
    </div>
  );
}
