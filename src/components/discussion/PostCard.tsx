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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Rating } from "@/components/rating";
import UserInput from "./UserInput";

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
  const { editPost, deletePost, addReaction, removeReaction, error, addReply } =
    useDiscussionStore();
  const MAX_REPLY_DEPTH = 1;

  // Get the effective parent ID for replies
  const getEffectiveParentId = () => {
    // Only allow replies to top-level posts
    if (level >= MAX_REPLY_DEPTH) {
      return undefined; // Return undefined to prevent replying
    }
    return post.id;
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleEditSuccess = async (content: string) => {
    if (!currentUserId) {
      toast.error("Please log in to edit");
      return;
    }

    await editPost(post.id, content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!currentUserId) {
      toast.error("Please log in to delete");
      return;
    }

    try {
      await toast.promise(deletePost(post.id), {
        loading: "Deleting post...",
        success: "Post deleted successfully",
        error: "Failed to delete post",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete post";
      toast.error(errorMessage);
    }
  };

  const getInitials = (id: string) => {
    return id ? id.slice(0, 2).toUpperCase() : "??";
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
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1 text-xs text-gray-500"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete your post
                            {post._count?.replies > 0 &&
                              ` and all its ${post._count.replies} replies`}
                            .
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
            {level < MAX_REPLY_DEPTH && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs p-0 h-6 flex items-center gap-1 hover:bg-transparent hover:text-blue-600"
                onClick={() => setIsReplying(!isReplying)}
              >
                Reply
              </Button>
            )}

            {post._count?.replies > 0 && level < MAX_REPLY_DEPTH && (
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
                      : `View ${post._count.replies} ${
                          post._count.replies === 1 ? "reply" : "replies"
                        }`}
                  </>
                )}
              </Button>
            )}
          </div>

          {isReplying && level < MAX_REPLY_DEPTH && (
            <div className="mt-2 ml-2">
              <UserInput
                currentUserId={currentUserId}
                thread={thread}
                parentId={getEffectiveParentId()}
                onSubmitSuccess={() => setIsReplying(false)}
                placeholder="Write a reply..."
                showAvatar={false}
                onSubmit={async (content) => {
                  await addReply(getEffectiveParentId() || null, content);
                }}
              />
            </div>
          )}

          {showReplies && replies.length > 0 && level < MAX_REPLY_DEPTH && (
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
                    replies={[]}
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
  onSubmitSuccess,
  showAvatar = false,
}: {
  currentUserId?: string;
  thread: Thread;
  initialContent: string;
  onSubmitSuccess: (content: string) => Promise<void>;
  showAvatar?: boolean;
}) {
  const [content, setContent] = useState(initialContent);

  return (
    <div className="flex-1">
      <UserInput
        currentUserId={currentUserId}
        thread={thread}
        initialContent={initialContent}
        onContentChange={setContent}
        onSubmitSuccess={() => onSubmitSuccess(content)}
        placeholder="Edit your comment..."
        showAvatar={showAvatar}
        submitButtonText="Save"
        onSubmit={async (content) => {
          await onSubmitSuccess(content);
        }}
      />
    </div>
  );
}
