import { useEffect } from "react";

import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, Bell, Star, Trash2 } from "lucide-react";

import { notificationActions } from "@/actions/notificationActions";

import { useNotificationStore } from "@/stores/useNotificationStore";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NotificationListProps {
  userId: string;
}

// Loading animation component
const LoadingDots = () => {
  return (
    <div className="flex space-x-1.5 items-center">
      <motion.div
        className="h-2 w-2 bg-primary rounded-full"
        animate={{
          scale: [0.5, 1, 0.5],
          opacity: [0.3, 1, 0.3],
        }}
        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="h-2 w-2 bg-primary rounded-full"
        animate={{
          scale: [0.5, 1, 0.5],
          opacity: [0.3, 1, 0.3],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.2,
        }}
      />
      <motion.div
        className="h-2 w-2 bg-primary rounded-full"
        animate={{
          scale: [0.5, 1, 0.5],
          opacity: [0.3, 1, 0.3],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.4,
        }}
      />
    </div>
  );
};

export function NotificationList({ userId }: NotificationListProps) {
  const { notifications, isLoading, error } = useNotificationStore();

  useEffect(() => {
    notificationActions.fetchNotifications(userId);
  }, [userId]);

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-0 bg-zinc-50 dark:bg-slate-900 rounded-xl overflow-hidden">
      <CardHeader className="pb-2 border-b bg-white dark:bg-slate-900 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="h-8 w-8 bg-primary/5 rounded-full flex items-center justify-center">
                <Bell className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div>
              <CardTitle className="text-base font-medium">Thông báo</CardTitle>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 bg-zinc-50 dark:bg-slate-900">
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingDots />
            </div>
          ) : notifications.length === 0 || error ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full p-8 text-muted-foreground"
            >
              <Bell className="w-12 h-12 mb-4 text-primary/50" />
              <p>Chưa có thông báo nào</p>
            </motion.div>
          ) : (
            <div className="divide-y divide-border/50">
              <AnimatePresence>
                {notifications.map((userNotification) => (
                  <motion.div
                    key={userNotification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "p-4 hover:bg-muted/50 transition-colors",
                      userNotification.status === "UNREAD" && "bg-muted/30",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">
                            {userNotification.notification.title}
                          </h3>
                          {userNotification.status === "UNREAD" && (
                            <Badge
                              variant="secondary"
                              className="animate-pulse"
                            >
                              Mới
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {userNotification.notification.content}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(
                              new Date(userNotification.sentAt),
                              {
                                addSuffix: true,
                              },
                            )}
                          </span>
                          {userNotification.notification.type && (
                            <Badge variant="outline" className="capitalize">
                              {userNotification.notification.type.toLowerCase()}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
                          onClick={() =>
                            notificationActions.markAsFavorite(
                              userId,
                              userNotification.id,
                            )
                          }
                        >
                          <Star
                            className={cn(
                              "w-4 h-4 transition-colors",
                              userNotification.isFavorite &&
                                "fill-yellow-400 text-yellow-400",
                            )}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
                          onClick={() =>
                            notificationActions.archiveNotification(
                              userId,
                              userNotification.id,
                            )
                          }
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
                          onClick={() =>
                            notificationActions.deleteNotification(
                              userId,
                              userNotification.id,
                            )
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
