import { Socket, io } from "socket.io-client";
import type { Post, Reaction } from "./type";

interface TypingUser {
  userId: string;
  userName: string;
}

interface TypingEvent {
  threadId: string;
  typingUsers: TypingUser[];
}

interface ThreadUsers {
  threadId: string;
  users: TypingUser[];
}

class DiscussionSocketService {
  private socket: Socket | null = null;
  private typingTimeout: NodeJS.Timeout | null = null;
  private currentThreadId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private readonly namespace = "/threads";

  connect() {
    if (!this.socket) {
      const baseUrl =
        process.env.NEXT_PUBLIC_DISCUSSION_GATEWAY_URL ||
        "http://localhost:3005";
      console.log("Connecting to socket URL:", baseUrl + this.namespace); // Debug log

      this.socket = io(baseUrl + this.namespace, {
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: true,
      });

      this.socket.on("connect", () => {
        console.log("Socket connected to namespace:", this.namespace);
        this.reconnectAttempts = 0;
      });

      this.socket.on("connect_error", (error) => {
        console.error("Connection error:", error.message);
        if (error.message.includes("Invalid namespace")) {
          console.error(
            "Invalid namespace. Please check server configuration.",
          );
        }
      });

      this.socket.on("reconnect", (attemptNumber) => {
        console.log(
          `Reconnected to namespace ${this.namespace} after ${attemptNumber} attempts`,
        );
        this.reconnectAttempts = 0;
        if (this.currentThreadId) {
          this.joinThread(this.currentThreadId);
        }
      });

      this.socket.on("reconnect_error", (error) => {
        console.error("Reconnection error:", error);
        this.reconnectAttempts++;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.socket?.emit("reconnect_failed");
        }
      });

      this.socket.on("reconnect_failed", () => {
        console.error(
          `Failed to reconnect to namespace ${this.namespace} after maximum attempts`,
        );
        this.reconnect();
      });

      this.socket.on("disconnect", (reason) => {
        console.log(`Disconnected from namespace ${this.namespace}:`, reason);
      });
    }
    return this.socket;
  }

  private reconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  disconnect() {
    if (this.socket) {
      this.currentThreadId = null;
      this.socket.disconnect();
      this.socket = null;
    }
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
    this.reconnectAttempts = 0;
  }

  joinThread(threadId: string) {
    if (this.socket) {
      this.currentThreadId = threadId;
      this.socket.emit("join-thread", threadId);
    }
  }

  leaveThread(threadId: string) {
    if (this.socket) {
      this.currentThreadId = null;
      this.socket.emit("leave-thread", threadId);
    }
  }

  sendTyping(
    threadId: string,
    userId: string,
    userName: string,
    isTyping: boolean,
  ) {
    if (this.socket) {
      this.socket.emit("typing", { threadId, userId, userName, isTyping });
    }
  }

  onNewPost(callback: (post: Post) => void) {
    if (this.socket) {
      this.socket.on("new-post", callback);
    }
  }

  onUpdatePost(callback: (post: Post) => void) {
    if (this.socket) {
      this.socket.on("update-post", callback);
    }
  }

  onDeletePost(callback: (data: { postId: string }) => void) {
    if (this.socket) {
      this.socket.on("delete-post", callback);
    }
  }

  onNewReaction(callback: (reaction: Reaction) => void) {
    if (this.socket) {
      this.socket.on("new-reaction", callback);
    }
  }

  onUpdateReaction(callback: (reaction: Reaction) => void) {
    if (this.socket) {
      this.socket.on("update-reaction", callback);
    }
  }

  onDeleteReaction(callback: (data: { reactionId: string }) => void) {
    if (this.socket) {
      this.socket.on("delete-reaction", callback);
    }
  }

  onUserTyping(callback: (data: TypingEvent) => void) {
    if (this.socket) {
      this.socket.on("user-typing", callback);
    }
  }

  onJoinedThread(callback: (threadId: string) => void) {
    if (this.socket) {
      this.socket.on("joined-thread", callback);
    }
  }

  onLeftThread(callback: (threadId: string) => void) {
    if (this.socket) {
      this.socket.on("left-thread", callback);
    }
  }

  onThreadUsers(callback: (data: ThreadUsers) => void) {
    if (this.socket) {
      this.socket.on("thread-users", callback);
    }
  }

  onUserJoined(callback: (user: TypingUser) => void) {
    if (this.socket) {
      this.socket.on("user-joined", callback);
    }
  }

  onUserLeft(callback: (user: TypingUser) => void) {
    if (this.socket) {
      this.socket.on("user-left", callback);
    }
  }

  debounceTyping(
    threadId: string,
    userId: string,
    userName: string,
    isTyping: boolean,
    delay: number = 1000,
  ) {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }

    if (!isTyping) {
      this.sendTyping(threadId, userId, userName, false);
      return;
    }

    this.sendTyping(threadId, userId, userName, true);
    this.typingTimeout = setTimeout(() => {
      this.sendTyping(threadId, userId, userName, false);
    }, delay);
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

const socketService = new DiscussionSocketService();
export default socketService;
