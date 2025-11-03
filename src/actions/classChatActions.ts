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

// Get chat room info - Still needed for initial data
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

// Get messages - Still needed for loading message history
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

// Create chat room (admin/instructor only) - Still needed for setup
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

// Add member to chat room - Still needed for management
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

/*
NOTE: Realtime actions đã được thay thế bởi Socket.IO events:
- sendMessage() ➜ socket.emit('send-message', {...})
- sendImageMessage() ➜ socket.emit('send-message', {messageType: 'IMAGE', imageData: '...'})
- editMessage() ➜ socket.emit('edit-message', {...})
- deleteMessage() ➜ socket.emit('delete-message', {...})
*/
