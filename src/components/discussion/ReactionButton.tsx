"use client";

import { useState, useRef, useEffect } from "react";
import { ReactionType } from "./type";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const reactionEmojis: Record<ReactionType, { emoji: string; label: string }> = {
  [ReactionType.LIKE]: { emoji: "👍", label: "Like" },
  [ReactionType.LOVE]: { emoji: "❤️", label: "Love" },
  [ReactionType.CARE]: { emoji: "🤗", label: "Care" },
  [ReactionType.HAHA]: { emoji: "😄", label: "Haha" },
  [ReactionType.WOW]: { emoji: "😮", label: "Wow" },
  [ReactionType.SAD]: { emoji: "😢", label: "Sad" },
  [ReactionType.ANGRY]: { emoji: "😠", label: "Angry" },
};

interface ReactionButtonProps {
  postId: string;
  reactions: Array<{
    id: string;
    type: ReactionType;
    userId: string;
  }>;
  onReact: (type: ReactionType) => void;
  onRemoveReaction: () => void;
  currentUserId: string;
}

export function ReactionButton({
  reactions,
  onReact,
  onRemoveReaction,
  currentUserId,
}: ReactionButtonProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<ReactionType | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const userReaction = reactions.find((r) => r.userId === currentUserId);
  const reactionCounts = reactions.reduce(
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
    if (selectedEmoji) {
      onRemoveReaction();
      setSelectedEmoji(null);
    } else {
      setShowReactions(true);
    }
  };

  const handleReact = (type: ReactionType) => {
    if (selectedEmoji === type) {
      // Nếu click vào reaction hiện tại -> un-react
      onRemoveReaction();
      setSelectedEmoji(null);
    } else if (selectedEmoji !== null) {
      // Nếu đã có reaction và chọn reaction khác -> update reaction
      onRemoveReaction();
      onReact(type);
    } else {
      // Nếu chưa có reaction -> thêm mới
      onReact(type);
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
          <span className="text-xs">Like</span>
        )}
      </Button>

      <AnimatePresence>
        {showReactions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-0 mb-1 flex items-center bg-white rounded-full shadow-lg p-0.5 z-50"
          >
            {Object.entries(reactionEmojis).map(([type, { emoji, label }]) => {
              const reactionType = type as ReactionType;
              const count = reactionCounts[reactionType] || 0;
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
