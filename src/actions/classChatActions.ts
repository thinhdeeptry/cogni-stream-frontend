// src/actions/classChatActions.ts
import { AxiosFactory } from "@/lib/axios";

const classChatApi = await AxiosFactory.getApiInstance("courses");

// Types
export interface ChatMessage {
  id: string;
  content?: string;
  messageType: "TEXT" | "IMAGE" | "FILE";
  status: "SENT" | "DELIVERED" | "READ";
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
  sentAt: string;
  editedAt?: string;
  isEdited: boolean;
  isDeleted: boolean;
  sender: {
    id: string;
    name: string;
    image?: string;
    role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  };
  replyTo?: {
    id: string;
    content?: string;
    messageType: string;
    fileName?: string;
    sender: {
      name: string;
    };
  };
}

export interface ChatRoomInfo {
  id: string;
  name: string;
  description?: string;
  class: {
    id: string;
    name: string;
    status: string;
  };
  totalMessages: number;
  totalMembers: number;
  members: Array<{
    id: string;
    name: string;
    image?: string;
    role: string;
    joinedAt: string;
  }>;
}

export interface PaginatedMessages {
  messages: ChatMessage[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

// Get chat room info
export const getChatRoomInfo = async (
  classId: string,
): Promise<ChatRoomInfo> => {
  try {
    const response = await classChatApi.get(`/${classId}/info`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching chat room info:", error);
    throw new Error(
      error.response?.data?.message || "Không thể tải thông tin phòng chat",
    );
  }
};

// Get messages
export const getMessages = async (
  classId: string,
  page: number = 1,
  limit: number = 20,
  search?: string,
  beforeMessageId?: string,
): Promise<PaginatedMessages> => {
  try {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    if (search) {
      params.append("search", search);
    }

    if (beforeMessageId) {
      params.append("beforeMessageId", beforeMessageId);
    }

    const response = await classChatApi.get(
      `/${classId}/messages?${params.toString()}`,
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    throw new Error(error.response?.data?.message || "Không thể tải tin nhắn");
  }
};

// Send text message
export const sendMessage = async (
  classId: string,
  content: string,
  replyToId?: string,
): Promise<ChatMessage> => {
  try {
    const response = await classChatApi.post(`/${classId}/messages`, {
      content,
      messageType: "TEXT",
      replyToId,
    });
    return response.data;
  } catch (error: any) {
    console.error("Error sending message:", error);
    throw new Error(error.response?.data?.message || "Không thể gửi tin nhắn");
  }
};

// Send image message
export const sendImageMessage = async (
  classId: string,
  file: File,
  content?: string,
  replyToId?: string,
): Promise<ChatMessage> => {
  try {
    // Validate image file
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Chỉ chấp nhận file ảnh: JPG, PNG, GIF");
    }

    // Validate file size (max 3MB)
    const maxSize = 3 * 1024 * 1024; // 3MB
    if (file.size > maxSize) {
      throw new Error("Kích thước ảnh không được vượt quá 3MB");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("messageType", "IMAGE");

    if (content) {
      formData.append("content", content);
    }

    if (replyToId) {
      formData.append("replyToId", replyToId);
    }

    const response = await classChatApi.post(
      `/${classId}/messages/file`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  } catch (error: any) {
    console.error("Error sending file message:", error);
    throw new Error(error.response?.data?.message || "Không thể gửi file");
  }
};

// Edit message
export const editMessage = async (
  messageId: string,
  content: string,
): Promise<ChatMessage> => {
  try {
    const response = await classChatApi.patch(`/messages/${messageId}`, {
      content,
    });
    return response.data;
  } catch (error: any) {
    console.error("Error editing message:", error);
    throw new Error(error.response?.data?.message || "Không thể sửa tin nhắn");
  }
};

// Delete message
export const deleteMessage = async (messageId: string): Promise<void> => {
  try {
    await classChatApi.delete(`/messages/${messageId}`);
  } catch (error: any) {
    console.error("Error deleting message:", error);
    throw new Error(error.response?.data?.message || "Không thể xóa tin nhắn");
  }
};

// Create chat room (admin/instructor only)
export const createChatRoom = async (
  classId: string,
  className: string,
): Promise<ChatRoomInfo> => {
  try {
    const response = await classChatApi.post(`/${classId}/create-room`, {
      className,
    });
    return response.data;
  } catch (error: any) {
    console.error("Error creating chat room:", error);
    throw new Error(
      error.response?.data?.message || "Không thể tạo phòng chat",
    );
  }
};

// Add member to chat room
export const addMemberToChatRoom = async (
  classId: string,
  userId: string,
): Promise<void> => {
  try {
    await classChatApi.post(`/${classId}/add-member`, {
      userId,
    });
  } catch (error: any) {
    console.error("Error adding member to chat room:", error);
    throw new Error(
      error.response?.data?.message || "Không thể thêm thành viên",
    );
  }
};
