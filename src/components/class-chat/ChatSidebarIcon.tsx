"use client";

import React, { useState } from "react";

import { MessageCircle } from "lucide-react";

import ClassChatModal from "@/components/class-chat/ClassChatModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatSidebarIconProps {
  classId: string;
  className?: string;
  unreadCount?: number;
}

export default function ChatSidebarIcon({
  classId,
  className,
  unreadCount = 0,
}: ChatSidebarIconProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsChatOpen(true)}
              className="relative w-full justify-start gap-2 h-9"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="flex-1 text-left">Chat lớp học</span>
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="h-5 min-w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Mở chat lớp học</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <ClassChatModal
        classId={classId}
        className={className}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </>
  );
}
