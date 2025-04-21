import { Socket, io } from "socket.io-client";

import type { Post, Reaction } from "./type";

interface ThreadUser {
  userId: string;
  userName: string;
}

interface ThreadUsers {
  threadId: string;
  users: ThreadUser[];
}

class DiscussionSocketService {
  private socket: Socket | null = null;
  private readonly namespace = "/threads";

  connect() {
    if (!this.socket) {
      const baseUrl = "https://discussion.eduforge.io.vn";

      if (!baseUrl) {
        throw new Error("BASE_URL is not defined");
      }

      try {
        this.socket = io(baseUrl + this.namespace, {
          withCredentials: true,
          reconnection: true,
          reconnectionAttempts: 10, // Increased from 5 to 10
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 30000, // Increased from 20000 to 30000
          transports: ["websocket", "polling"], // Explicitly specify transports
          autoConnect: true,
        });

        this.socket.on("connect", () => {
          console.log("Socket connected to namespace:", this.namespace);
        });

        this.socket.on("connect_error", (error) => {
          console.error("Connection error:", error.message);
        });

        this.socket.on("disconnect", (reason) => {
          console.log(`Disconnected from namespace ${this.namespace}:`, reason);
        });

        this.socket.on("error", (error) => {
          console.error("Socket error:", error);
        });
      } catch (error) {
        console.error("Error initializing socket:", error);
        // Return a dummy socket that won't throw errors when methods are called
        return {
          on: () => {},
          emit: () => {},
          disconnect: () => {},
          removeAllListeners: () => {},
        } as any;
      }
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinThread(threadId: string, userId: string, userName: string) {
    if (this.socket) {
      this.socket.emit("join-thread", { threadId, userId, userName });
    }
  }

  leaveThread(threadId: string, userId: string) {
    if (this.socket) {
      this.socket.emit("leave-thread", { threadId, userId });
    }
  }

  // Post event listeners
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

  // Reaction event listeners
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

  onDeleteReaction(
    callback: (data: { reactionId: string; postId: string }) => void,
  ) {
    if (this.socket) {
      this.socket.on("delete-reaction", callback);
    }
  }

  // Thread user event listeners
  onThreadUsers(callback: (data: ThreadUsers) => void) {
    if (this.socket) {
      this.socket.on("thread-users", callback);
    }
  }

  onUserJoined(callback: (user: ThreadUser) => void) {
    if (this.socket) {
      this.socket.on("user-joined", callback);
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

const socketService = new DiscussionSocketService();
export default socketService;
