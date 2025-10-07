"use client";

import { useMemo } from "react";

import { motion } from "framer-motion";
import {
  BookOpen,
  Clock,
  GraduationCap,
  MessageCircle,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

interface ConversationStatsProps {
  messages: any[];
  conversationId: string;
  userName?: string;
  courseName?: string;
  lessonName?: string;
  lessonOrder?: number;
  totalLessons?: number;
  chapterName?: string;
}

export function ConversationStats({
  messages,
  conversationId,
  userName,
  courseName,
  lessonName,
  lessonOrder,
  totalLessons,
  chapterName,
}: ConversationStatsProps) {
  const stats = useMemo(() => {
    const displayMessages = messages.filter((m) => m.role !== "system");
    const userMessages = displayMessages.filter((m) => m.role === "user");
    const assistantMessages = displayMessages.filter(
      (m) => m.role === "assistant",
    );

    const firstMessage = displayMessages[0];
    const lastMessage = displayMessages[displayMessages.length - 1];

    const duration =
      firstMessage &&
      lastMessage &&
      firstMessage.timestamp &&
      lastMessage.timestamp
        ? lastMessage.timestamp - firstMessage.timestamp
        : 0;

    return {
      totalMessages: displayMessages.length,
      userMessages: userMessages.length,
      assistantMessages: assistantMessages.length,
      duration: Math.floor(duration / 1000 / 60), // minutes
      hasHistory: displayMessages.length > 0,
    };
  }, [messages]);

  if (!stats.hasHistory) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800 mb-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MessageCircle size={16} className="text-blue-600" />
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Lịch sử hội thoại
          </span>
        </div>
        <Badge variant="secondary" className="text-xs">
          {stats.duration > 0 ? `${stats.duration} phút` : "Mới"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-blue-700 dark:text-blue-300">
        <div className="flex items-center gap-1">
          <User size={12} />
          <span>{stats.userMessages} câu hỏi</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageCircle size={12} />
          <span>{stats.assistantMessages} trả lời</span>
        </div>
      </div>

      {/* Context Information */}
      {(courseName || lessonName) && (
        <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
          <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
            {courseName && (
              <div className="flex items-center gap-1">
                <GraduationCap size={10} />
                <span className="truncate">{courseName}</span>
              </div>
            )}
            {chapterName && (
              <div className="flex items-center gap-1">
                <BookOpen size={10} />
                <span className="truncate">{chapterName}</span>
              </div>
            )}
            {lessonName && (
              <div className="flex items-center gap-1">
                <BookOpen size={10} />
                <span className="truncate">
                  {lessonName}{" "}
                  {lessonOrder &&
                    totalLessons &&
                    `(${lessonOrder}/${totalLessons})`}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
