import axios from "axios";

import { useNotificationStore } from "@/stores/useNotificationStore";

const API_URL = process.env.NEXT_PUBLIC_NOTIFICATION_API_URL;

export const notificationActions = {
  fetchNotifications: async (userId: string, page = 1, limit = 10) => {
    try {
      const store = useNotificationStore.getState();
      store.setLoading(true);

      const response = await axios.get(
        `${API_URL}/users/${userId}/notifications`,
        {
          params: { page, limit },
        },
      );

      console.log("Notification response:", response.data);

      if (response.data && Array.isArray(response.data.data)) {
        store.setNotifications(response.data.data);
        store.setError(null);
      } else {
        store.setError("Invalid notification data format");
      }
    } catch (error) {
      useNotificationStore.getState().setError("Failed to fetch notifications");
      console.warn("Failed to fetch notifications:", error);
    } finally {
      useNotificationStore.getState().setLoading(false);
    }
  },

  markAsRead: async (userId: string, notificationId: string) => {
    try {
      const store = useNotificationStore.getState();

      await axios.patch(
        `${API_URL}/users/${userId}/notifications/${notificationId}`,
        { status: "READ" },
      );

      store.markAsRead(notificationId);
      store.setError(null);
    } catch (error) {
      useNotificationStore
        .getState()
        .setError("Failed to mark notification as read");
      console.warn("Failed to mark notification as read:", error);
    }
  },

  markAsFavorite: async (userId: string, notificationId: string) => {
    try {
      const store = useNotificationStore.getState();

      await axios.patch(
        `${API_URL}/users/${userId}/notifications/${notificationId}`,
        { isFavorite: true },
      );

      store.markAsFavorite(notificationId);
      store.setError(null);
    } catch (error) {
      useNotificationStore
        .getState()
        .setError("Failed to mark notification as favorite");
      console.warn("Failed to mark notification as favorite:", error);
    }
  },

  archiveNotification: async (userId: string, notificationId: string) => {
    try {
      const store = useNotificationStore.getState();

      await axios.patch(
        `${API_URL}/users/${userId}/notifications/${notificationId}`,
        { status: "ARCHIVED" },
      );

      store.archiveNotification(notificationId);
      store.setError(null);
    } catch (error) {
      useNotificationStore
        .getState()
        .setError("Failed to archive notification");
      console.warn("Failed to archive notification:", error);
    }
  },

  deleteNotification: async (userId: string, notificationId: string) => {
    try {
      const store = useNotificationStore.getState();

      await axios.delete(
        `${API_URL}/users/${userId}/notifications/${notificationId}`,
      );

      store.deleteNotification(notificationId);
      store.setError(null);
    } catch (error) {
      useNotificationStore.getState().setError("Failed to delete notification");
      console.warn("Failed to delete notification:", error);
    }
  },
};
