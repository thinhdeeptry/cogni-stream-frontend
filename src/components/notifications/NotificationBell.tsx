import { useEffect } from "react";

import { Bell } from "lucide-react";

import { notificationActions } from "@/actions/notificationActions";

import { useNotificationStore } from "@/stores/useNotificationStore";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { NotificationList } from "./NotificationList";

interface NotificationBellProps {
  userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const { unreadCount } = useNotificationStore();

  useEffect(() => {
    notificationActions.fetchNotifications(userId);
  }, [userId]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <NotificationList userId={userId} />
      </PopoverContent>
    </Popover>
  );
}
