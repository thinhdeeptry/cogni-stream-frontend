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
  private currentThreadId: string | null = null;
  private currentUserId: string | null = null;
  private currentUserName: string | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;

  connect() {
    // If we already have a socket, return it
    if (this.socket && this.socket.connected) {
      console.log("Socket already connected, reusing existing connection");
      return this.socket;
    }

    // If we have a socket but it's disconnected, clean it up first
    if (this.socket) {
      console.log(
        "Cleaning up existing disconnected socket before creating a new one",
      );
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    const baseUrl = "https://discussion.cognistream.io.vn";

    if (!baseUrl) {
      console.error("BASE_URL is not defined");
      return this.createDummySocket();
    }

    try {
      console.log(
        "Creating new socket connection to:",
        baseUrl + this.namespace,
      );
      this.socket = io(baseUrl + this.namespace, {
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 30000,
        transports: ["websocket", "polling"],
        autoConnect: true,
      });

      this.socket.on("connect", () => {
        console.log("Socket connected to namespace:", this.namespace);

        // If we have thread info stored, automatically rejoin the thread
        if (
          this.currentThreadId &&
          this.currentUserId &&
          this.currentUserName
        ) {
          console.log(
            "Auto-rejoining thread after reconnection:",
            this.currentThreadId,
          );
          this.joinThread(
            this.currentThreadId,
            this.currentUserId,
            this.currentUserName,
          );
        }
      });

      this.socket.on("connect_error", (error) => {
        console.error("Connection error:", error.message);
      });

      this.socket.on("disconnect", (reason) => {
        console.log(`Disconnected from namespace ${this.namespace}:`, reason);

        // If it's not a manual disconnect, try to reconnect
        if (
          reason !== "io client disconnect" &&
          reason !== "io server disconnect"
        ) {
          console.log("Will attempt to reconnect automatically");
        }
      });

      this.socket.on("reconnect", (attemptNumber) => {
        console.log(
          `Reconnected to namespace ${this.namespace} after ${attemptNumber} attempts`,
        );
      });

      this.socket.on("reconnect_attempt", (attemptNumber) => {
        console.log(
          `Reconnection attempt ${attemptNumber} to namespace ${this.namespace}`,
        );
      });

      this.socket.on("reconnect_error", (error) => {
        console.error("Reconnection error:", error);
      });

      this.socket.on("reconnect_failed", () => {
        console.error("Failed to reconnect after all attempts");
      });

      this.socket.on("error", (error) => {
        console.error("Socket error:", error);
      });
    } catch (error) {
      console.error("Error initializing socket:", error);
      return this.createDummySocket();
    }

    return this.socket;
  }

  private createDummySocket() {
    console.warn("Creating dummy socket due to connection issues");
    return {
      on: () => {},
      emit: () => {},
      disconnect: () => {},
      removeAllListeners: () => {},
      connected: false,
    } as any;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinThread(threadId: string, userId: string, userName: string) {
    // Store the current thread info for reconnection
    this.currentThreadId = threadId;
    this.currentUserId = userId;
    this.currentUserName = userName;

    console.log(`Joining thread: ${threadId} as user: ${userName} (${userId})`);

    if (this.socket) {
      if (this.socket.connected) {
        this.socket.emit("join-thread", { threadId, userId, userName });
      } else {
        console.warn(
          "Socket not connected when trying to join thread. Will join on reconnection.",
        );
        // Attempt to reconnect
        this.socket.connect();
      }
    } else {
      console.warn(
        "No socket available when trying to join thread. Creating new connection.",
      );
      const socket = this.connect();
      if (socket && socket.connected) {
        socket.emit("join-thread", { threadId, userId, userName });
      }
    }
  }

  leaveThread(threadId: string, userId: string) {
    console.log(`Leaving thread: ${threadId} as user: ${userId}`);

    if (this.socket && this.socket.connected) {
      this.socket.emit("leave-thread", { threadId, userId });
    }

    // Clear stored thread info
    if (this.currentThreadId === threadId && this.currentUserId === userId) {
      this.currentThreadId = null;
      this.currentUserId = null;
      this.currentUserName = null;
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
      console.log("Removing all socket event listeners");
      // Remove specific event listeners to avoid memory leaks
      const events = [
        "connect",
        "disconnect",
        "connect_error",
        "error",
        "reconnect",
        "reconnect_attempt",
        "reconnect_error",
        "reconnect_failed",
        "new-post",
        "update-post",
        "delete-post",
        "new-reaction",
        "update-reaction",
        "delete-reaction",
        "thread-users",
        "user-joined",
      ];

      events.forEach((event) => {
        if (this.socket) {
          this.socket.removeAllListeners(event);
        }
      });

      // As a fallback, also call removeAllListeners with no arguments
      this.socket.removeAllListeners();
    }
  }
}

const socketService = new DiscussionSocketService();
export default socketService;
