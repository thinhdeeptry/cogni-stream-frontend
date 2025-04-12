"use client";

import { useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";

import { ReactionCounts, ReactionType } from "./type";

const reactionEmojis: Record<ReactionType, { emoji: string; label: string }> = {
  [ReactionType.LIKE]: { emoji: "👍", label: "Thích" },
  [ReactionType.LOVE]: { emoji: "❤️", label: "Yêu thích" },
  [ReactionType.CARE]: { emoji: "🤗", label: "Thương thương" },
  [ReactionType.HAHA]: { emoji: "😄", label: "Haha" },
  [ReactionType.WOW]: { emoji: "😮", label: "Wow" },
  [ReactionType.SAD]: { emoji: "😢", label: "Buồn" },
  [ReactionType.ANGRY]: { emoji: "😠", label: "Phẫn nộ" },
};

interface ReactionData {
  id: string;
  type: ReactionType;
  userId: string;
}

interface ReactionButtonProps {
  postId: string;
  reactions?: ReactionData[];
  reactionCounts?: ReactionCounts;
  onReact: (type: ReactionType, existingReactionId?: string) => void;
  onRemoveReaction: (reactionId: string, reactionType: ReactionType) => void;
  currentUserId: string;
}

export function ReactionButton({
  reactions = [],
  reactionCounts,
  onReact,
  onRemoveReaction,
  currentUserId,
}: ReactionButtonProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<ReactionType | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const userReaction = reactions.find((r) => r.userId === currentUserId);

  // Use provided reactionCounts if available, otherwise calculate from reactions array
  const effectiveReactionCounts =
    reactionCounts ||
    reactions.reduce(
      (acc, reaction) => {
        acc[reaction.type] = (acc[reaction.type] || 0) + 1;
        return acc;
      },
      {} as Record<ReactionType, number>,
    );

  useEffect(() => {
    if (userReaction) {
      setSelectedEmoji(userReaction.type);
    } else {
      setSelectedEmoji(null);
    }
  }, [userReaction]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowReactions(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setShowReactions(false), 500);
  };

  const handleMainButtonClick = () => {
    if (selectedEmoji && userReaction) {
      onRemoveReaction(userReaction.id, userReaction.type);
      setSelectedEmoji(null);
    } else {
      setShowReactions(true);
    }
  };

  const handleReact = (type: ReactionType) => {
    if (selectedEmoji === type && userReaction) {
      // If clicking the same reaction -> remove it
      onRemoveReaction(userReaction.id, userReaction.type);
      setSelectedEmoji(null);
    } else if (selectedEmoji !== null && userReaction) {
      // If changing to a different reaction -> update existing reaction
      onReact(type, userReaction.id);
      setSelectedEmoji(type);
    } else {
      // If no existing reaction -> add new reaction
      onReact(type);
      setSelectedEmoji(type);
    }
    setShowReactions(false);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Button
        ref={buttonRef}
        variant="ghost"
        size="sm"
        className={`h-auto px-2 py-1 text-xs ${selectedEmoji ? "text-blue-600" : ""}`}
        onClick={handleMainButtonClick}
      >
        {selectedEmoji ? (
          <>
            <span className="mr-1 text-sm">
              {reactionEmojis[selectedEmoji].emoji}
            </span>
            <span className="text-xs">
              {reactionEmojis[selectedEmoji].label}
            </span>
          </>
        ) : (
          <span className="text-xs">Thích</span>
        )}
      </Button>

      <AnimatePresence>
        {showReactions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-0 mb-1 flex items-center border bg-white rounded-full shadow-lg p-0.5 z-50"
          >
            {Object.entries(reactionEmojis).map(([type, { emoji, label }]) => {
              const reactionType = type as ReactionType;
              const count = effectiveReactionCounts[reactionType] || 0;
              const isSelected = selectedEmoji === reactionType;

              return (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-1.5 rounded-full transition-colors relative ${
                    isSelected ? "bg-blue-100" : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleReact(reactionType)}
                  title={label}
                >
                  <span className="text-base" role="img" aria-label={label}>
                    {emoji}
                  </span>
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gray-200 rounded-full text-[10px] px-1 min-w-[14px] h-[14px] flex items-center justify-center">
                      {count}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
