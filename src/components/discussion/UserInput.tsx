import { useRef, useState, useEffect } from "react";
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
import dynamic from "next/dynamic";
import { Rating } from "@/components/rating";
import { DiscussionType, Thread } from "./type";
import { useDiscussionStore } from "./discussion.store";
import data from "@emoji-mart/data";

// Dynamically import EmojiPicker to avoid SSR issues
const EmojiPicker = dynamic(() => import("@emoji-mart/react"), { ssr: false });

interface UserInputProps {
  currentUserId?: string;
  thread: Thread;
  parentId?: string;
  onSubmitSuccess?: () => void;
  placeholder?: string;
  showAvatar?: boolean;
  className?: string;
  initialContent?: string;
  onContentChange?: (content: string) => void;
  submitButtonText?: string;
}

interface EmojiData {
  native: string;
  id: string;
  unified: string;
  keywords: string[];
}

export function UserInput({
  currentUserId,
  thread,
  parentId,
  onSubmitSuccess,
  placeholder,
  showAvatar = true,
  className = "",
  initialContent = "",
  onContentChange,
  submitButtonText = "Post",
}: UserInputProps) {
  const [newPostContent, setNewPostContent] = useState(initialContent);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [rating, setRating] = useState(5);
  const newPostInputRef = useRef<HTMLTextAreaElement>(null);
  const { addReply } = useDiscussionStore();

  // Update content if initialContent changes (for edit mode)
  useEffect(() => {
    if (initialContent) {
      setNewPostContent(initialContent);
    }
  }, [initialContent]);

  // Notify parent component of content changes if needed
  useEffect(() => {
    if (onContentChange) {
      onContentChange(newPostContent);
    }
  }, [newPostContent, onContentChange]);

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
      // If editing (using onContentChange), don't submit directly
      if (onContentChange) {
        onSubmitSuccess?.();
        return;
      }

      // Normal post/reply submission
      const postRating =
        !parentId && thread.type === DiscussionType.COURSE_REVIEW
          ? rating
          : undefined;
      await addReply(parentId || null, newPostContent, postRating);
      setNewPostContent("");
      setRating(5);
      if (newPostInputRef.current) {
        newPostInputRef.current.style.height = "auto";
      }
      onSubmitSuccess?.();
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

  if (!currentUserId) {
    return (
      <div className="text-center text-gray-500">
        Please log in to post comments
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmitNewPost}
      className={`flex items-start gap-2 ${className}`}
    >
      {showAvatar && (
        <Avatar className="w-8 h-8">
          <AvatarImage
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUserId}`}
          />
          <AvatarFallback>
            {currentUserId.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="flex-1">
        <div className="bg-white rounded-lg border">
          <div className="relative p-2">
            {!parentId && thread.type === DiscussionType.COURSE_REVIEW && (
              <Rating value={rating} onChange={setRating} className="ml-2" />
            )}
            <Textarea
              ref={newPostInputRef}
              value={newPostContent}
              onChange={handleTextareaChange}
              placeholder={
                placeholder ||
                (thread.type === DiscussionType.COURSE_REVIEW
                  ? "Write your course review..."
                  : "Write a comment...")
              }
              className="min-h-[45px] max-h-[200px] border-0 focus-visible:ring-0 shadow-none resize-none rounded-lg pr-8 py-2.5 text-sm"
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-0.5">
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
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
                      <Send className="h-4 w-4 text-blue-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {submitButtonText} {parentId ? "reply" : "comment"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
