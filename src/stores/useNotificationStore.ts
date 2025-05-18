import { create } from "zustand";

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  content: string;
  link?: string;
  image?: string;
  isGlobal: boolean;
  priority: number;
  metadata?: Record<string, any>;
  validUntil?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserNotification {
  id: string;
  userId: string;
  notificationId: string;
  status: "UNREAD" | "READ" | "ARCHIVED";
  isHidden: boolean;
  isFavorite: boolean;
  actionTaken: boolean;
  sentAt: string;
  readAt: string | null;
  archivedAt: string | null;
  channel: string;
  notification: NotificationData;
}

interface NotificationState {
  notifications: UserNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  setNotifications: (notifications: UserNotification[]) => void;
  addNotification: (notification: UserNotification) => void;
  markAsRead: (id: string) => void;
  markAsFavorite: (id: string) => void;
  archiveNotification: (id: string) => void;
  deleteNotification: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => n.status === "UNREAD").length,
    }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount:
        notification.status === "UNREAD"
          ? state.unreadCount + 1
          : state.unreadCount,
    })),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, status: "READ" } : n,
      ),
      unreadCount: state.unreadCount - 1,
    })),
  markAsFavorite: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isFavorite: !n.isFavorite } : n,
      ),
    })),
  archiveNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, status: "ARCHIVED" } : n,
      ),
    })),
  deleteNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
