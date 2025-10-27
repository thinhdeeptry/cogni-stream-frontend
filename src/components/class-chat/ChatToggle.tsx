"use client";

import React, { useState } from "react";

import { MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import ClassChat from "./ClassChat";

interface ChatToggleProps {
  classId: string;
  className?: string;
  unreadCount?: number;
}

export default function ChatToggle({
  classId,
  className,
  unreadCount = 0,
}: ChatToggleProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      {/* Chat Toggle Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="relative bg-blue-500 hover:bg-blue-600 text-white rounded-full w-14 h-14 shadow-lg"
          size="lg"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Chat Component */}
      <ClassChat
        classId={classId}
        className={className}
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
      />
    </>
  );
}
