"use client";

import type React from "react";
import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";
import type { Post } from "./type";
import { useDiscussionStore } from "./discussion.store";
import { ReactionButton } from "./ReactionButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import {
  MoreHorizontal,
  Trash2,
  Send,
  X,
  Save,
  Reply,
  Pencil,
  Smile,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

// Dynamically import EmojiPicker to avoid SSR issues
const EmojiPicker = dynamic(() => import("@emoji-mart/react"), { ssr: false });

interface DiscussionProps {
  threadId: string;
  currentUserId?: string;
}

interface EmojiData {
  native: string;
  id: string;
  unified: string;
  keywords: string[];
}

function PostCard({
  post,
  currentUserId,
  level = 0,
}: {
  post: Post;
  currentUserId?: string;
  level?: number;
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeletePopover, setShowDeletePopover] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [content, setContent] = useState(post.content);
  const { addReply, editPost, deletePost, addReaction, removeReaction, error } =
    useDiscussionStore();
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSubmitReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUserId) {
      toast.error("Please log in to reply");
      return;
    }
    const replyContent = replyInputRef.current?.value;
    if (replyContent) {
      await addReply(post.id, replyContent);
      setIsReplying(false);
      if (replyInputRef.current) replyInputRef.current.value = "";
    }
  };

  const handleSubmitEdit = async (event: React.FormEvent) => {
    event.preventDefault();
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
    await deletePost(post.id);
    setShowDeletePopover(false);
  };

  const handleEmojiSelect = (emoji: EmojiData) => {
    if (replyInputRef.current) {
      const start = replyInputRef.current.selectionStart;
      const end = replyInputRef.current.selectionEnd;
      const text = replyInputRef.current.value;
      const before = text.substring(0, start);
      const after = text.substring(end);

      replyInputRef.current.value = before + emoji.native + after;
      replyInputRef.current.selectionStart =
        replyInputRef.current.selectionEnd = start + emoji.native.length;
      replyInputRef.current.focus();
    }
    setShowEmojiPicker(false);
  };

  const getInitials = (id: string) => {
    return id ? id.slice(0, 2).toUpperCase() : "??";
  };

  return (
    <>
      <div className={`mb-4 w-fit ${level > 0 ? "ml-12" : ""}`}>
        <div className="flex items-start gap-2">
          <Avatar className="w-8 h-8">
            <AvatarImage
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}`}
            />
            <AvatarFallback>{getInitials(post.authorId)}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="bg-gray-100 rounded-2xl p-3">
              <div className="font-semibold text-xs">
                {post.authorId ? post.authorId.slice(0, 8) : "Anonymous"}
              </div>
              {isEditing ? (
                <form onSubmit={handleSubmitEdit} className="mt-2">
                  <div className="bg-white rounded-lg border">
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[100px] border-0 focus-visible:ring-0 resize-none rounded-t-lg"
                    />
                    <div className="flex items-center justify-between p-2 border-t bg-gray-50">
                      <div className="flex gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="submit"
                                size="sm"
                                variant="ghost"
                                className="p-2 h-auto"
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Save changes</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsEditing(false)}
                                className="p-2 h-auto text-red-500 hover:text-red-600"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Cancel editing</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <p className="mt-1 text-sm">{post.content}</p>
              )}
            </div>

            <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
              <ReactionButton
                postId={post.id}
                reactions={post.reactions}
                currentUserId={currentUserId || ""}
                onReact={(type) => addReaction(post.id, type)}
                onRemoveReaction={() =>
                  removeReaction(post.reactions?.[0]?.id || "")
                }
              />

              <Button
                variant="ghost"
                size="sm"
                className="text-xs p-0 h-auto"
                onClick={() => setIsReplying(!isReplying)}
              >
                <Reply className="h-4 w-4" />
              </Button>

              <span>
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                })}
                {post.isEdited && " (edited)"}
              </span>

              {currentUserId && post.authorId === currentUserId && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-0 h-auto">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setIsEditing(!isEditing)}
                      className="gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <Popover
                      open={showDeletePopover}
                      onOpenChange={setShowDeletePopover}
                    >
                      <PopoverTrigger asChild>
                        <DropdownMenuItem
                          className="text-red-600 gap-2"
                          onSelect={(e) => {
                            e.preventDefault();
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium leading-none">
                              Delete Comment
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Are you sure you want to delete this comment? This
                              action cannot be undone.
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
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {isReplying && (
              <form onSubmit={handleSubmitReply} className="mt-2">
                <div className="bg-white rounded-lg border">
                  <div className="relative">
                    <Textarea
                      ref={replyInputRef}
                      placeholder="Write a reply..."
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
                              className="h-7 w-7"
                            >
                              <Send className="h-4 w-4 text-primary" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Send reply</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {post.replies?.length > 0 && (
              <div className="mt-2">
                {post.replies.map((reply) => (
                  <PostCard
                    key={reply.id}
                    post={reply}
                    currentUserId={currentUserId}
                    level={level + 1}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function DiscussionSection({
  threadId,
  currentUserId,
}: DiscussionProps) {
  const { posts, isLoading, error, fetchPosts, addReply, setCurrentUserId } =
    useDiscussionStore();
  const [newPostContent, setNewPostContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const newPostInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (currentUserId) {
      setCurrentUserId(currentUserId);
    }
    fetchPosts(threadId);
  }, [threadId, currentUserId, fetchPosts, setCurrentUserId]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSubmitNewPost = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUserId) {
      toast.error("Please log in to post");
      return;
    }
    if (newPostContent.trim()) {
      await addReply(null, newPostContent);
      setNewPostContent("");
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

  if (isLoading) {
    return <div>Loading discussions...</div>;
  }

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
              <div className="relative">
                <Textarea
                  ref={newPostInputRef}
                  value={newPostContent}
                  onChange={handleTextareaChange}
                  placeholder="Write a comment..."
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
        {posts.map((post) => (
          <PostCard key={post.id} post={post} currentUserId={currentUserId} />
        ))}
      </div>
    </div>
  );
}
