"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

import { useSocket } from "@/hooks/useSocket";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit2,
  Image,
  Menu,
  MessageCircle,
  Reply,
  Search,
  Send,
  Settings,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";

import {
  type ChatMessage,
  addMemberToChatRoom,
  createChatRoom,
  getChatRoomInfo,
  getMessages,
} from "@/actions/classChatActions";
import { getEnrollmentsByUser } from "@/actions/enrollmentActions";

import useUserStore from "@/stores/useUserStore";

import { createGoogleDriveImageProps } from "@/utils/googleDriveUtils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

interface ClassChatItem {
  id: string;
  name: string;
  courseName: string;
  lastMessage?: {
    content: string;
    senderName: string;
    sentAt: string;
  };
  unreadCount: number;
  totalMembers: number;
}

export default function ChatMainPage() {
  const [classList, setClassList] = useState<ClassChatItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassChatItem | null>(
    null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isCreatingChatRoom, setIsCreatingChatRoom] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentChatInfo, setCurrentChatInfo] = useState<{
    totalMembers: number;
  }>({ totalMembers: 0 });
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(
    null,
  );
  const [editContent, setEditContent] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);

  const router = useRouter();
  const { data: session } = useSession();
  const { user } = useUserStore();
  const { socket, isConnected } = useSocket();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ref for auto-scrolling to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
        // Keep collapsed state on desktop
      } else {
        setIsSidebarOpen(false);
        setIsSidebarCollapsed(false); // Reset collapsed on mobile
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected || !selectedClass) return;

    // Join the selected class chat room
    socket.emit("join-class", { classId: selectedClass.id });

    // Listen for new messages
    const handleNewMessage = (message: ChatMessage) => {
      console.log("Received new message:", message);
      setMessages((prev) => [...prev, message]);
    };

    const handleMessageEdited = (updatedMessage: ChatMessage) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === updatedMessage.id ? updatedMessage : msg,
        ),
      );
    };

    const handleMessageDeleted = ({ messageId }: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, isDeleted: true, content: "Tin nhắn đã bị xóa" }
            : msg,
        ),
      );
    };

    const handleUserTyping = ({
      userId,
      isTyping,
    }: {
      userId: string;
      isTyping: boolean;
    }) => {
      if (userId === user?.id) return; // Ignore own typing

      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        if (isTyping) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    };

    const handleSocketError = (error: { message: string }) => {
      console.error("Socket error:", error);
      setSendError(error.message || "Lỗi kết nối");
    };

    socket.on("new-message", handleNewMessage);
    socket.on("message-edited", handleMessageEdited);
    socket.on("message-deleted", handleMessageDeleted);
    socket.on("user-typing", handleUserTyping);
    socket.on("error", handleSocketError);

    return () => {
      socket.off("new-message", handleNewMessage);
      socket.off("message-edited", handleMessageEdited);
      socket.off("message-deleted", handleMessageDeleted);
      socket.off("user-typing", handleUserTyping);
      socket.off("error", handleSocketError);
      socket.emit("leave-class", { classId: selectedClass.id });

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, isConnected, selectedClass]);

  // Fetch user's enrolled classes
  useEffect(() => {
    const fetchUserClasses = async () => {
      if (!user?.id) {
        console.log("Chat: No user ID found, skipping fetch");
        return;
      }

      try {
        setIsLoading(true);
        console.log(`Chat: Fetching enrollments for user ${user.id}`);

        // Get all enrollments of user
        const enrollments = await getEnrollmentsByUser(user.id);
        console.log("Chat: Enrollments response:", enrollments);
        console.log("Chat: Enrollments data structure:", {
          success: enrollments.success,
          dataType: typeof enrollments.data,
          isArray: Array.isArray(enrollments.data),
          dataKeys: enrollments.data
            ? Object.keys(enrollments.data)
            : "no data",
          dataValue: enrollments.data,
        });

        if (enrollments.success && enrollments.data) {
          // Handle both array and object responses
          let enrollmentsList = [];

          if (Array.isArray(enrollments.data)) {
            enrollmentsList = enrollments.data;
          } else if (
            enrollments.data.data &&
            Array.isArray(enrollments.data.data)
          ) {
            // Handle nested response format from backend
            enrollmentsList = enrollments.data.data;
          } else if (
            typeof enrollments.data === "object" &&
            !Array.isArray(enrollments.data)
          ) {
            // Handle single object or other structures
            enrollmentsList = [enrollments.data];
          }

          console.log(
            `Chat: Final enrollments list (length: ${enrollmentsList.length}):`,
            enrollmentsList,
          );
          const classItems: ClassChatItem[] = [];
          console.log(`Chat: Processing ${enrollmentsList.length} enrollments`);

          if (enrollmentsList.length === 0) {
            console.log("Chat: No enrollments found");
            setClassList([]);
            return;
          }

          for (const enrollment of enrollmentsList) {
            console.log("Chat: Processing enrollment:", {
              id: enrollment.id,
              type: enrollment.type,
              hasClass: !!enrollment.class,
              classId: enrollment.class?.id,
              className: enrollment.class?.name,
            });

            // Check both STREAM (has class) and ONLINE (has course) enrollments
            if (enrollment.class && enrollment.type === "STREAM") {
              // STREAM enrollment - has class
              // Always add the class to the list, regardless of chat room status
              const classItem = {
                id: enrollment.class.id,
                name: enrollment.class.name,
                courseName: enrollment.class.course?.title || "Khóa học",
                lastMessage: undefined, // Will be populated later
                unreadCount: 0, // TODO: Implement unread count
                totalMembers: 0, // Will be updated when getChatRoomInfo succeeds
              };

              classItems.push(classItem);
              console.log("Chat: Added class to chat list:", classItem);

              // Try to get chat info in background (non-blocking)
              getChatRoomInfo(enrollment.class.id)
                .then((chatInfo) => {
                  console.log(
                    `Chat: Got chat info for class ${enrollment.class.id}:`,
                    chatInfo,
                  );
                  // Update the class item with chat info
                  setClassList((prevList) =>
                    prevList.map((item) =>
                      item.id === enrollment.class.id
                        ? { ...item, totalMembers: chatInfo.totalMembers || 0 }
                        : item,
                    ),
                  );
                })
                .catch((error) => {
                  console.warn(
                    `Chat: Error getting chat info for class ${enrollment.class.id}:`,
                    error,
                  );
                  // Chat room might not exist yet, this is ok
                });
            } else {
              console.log(
                "Chat: Skipping enrollment (not STREAM with class):",
                {
                  type: enrollment.type,
                  hasClass: !!enrollment.class,
                },
              );
            }
            // Note: ONLINE enrollments don't have class chat rooms
          }

          console.log(
            `Chat: Final class list (${classItems.length} items):`,
            classItems,
          );
          setClassList(classItems);

          // Auto select first class if available
          if (classItems.length > 0) {
            console.log("Chat: Auto-selecting first class:", classItems[0]);
            setSelectedClass(classItems[0]);
          } else {
            console.log("Chat: No classes available for chat");
          }
        } else {
          console.warn("Chat: Invalid enrollments response:", {
            success: enrollments.success,
            hasData: !!enrollments.data,
            dataType: typeof enrollments.data,
            isArray: Array.isArray(enrollments.data),
            response: enrollments,
          });
        }
      } catch (error) {
        console.error("Chat: Error fetching user classes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserClasses();
  }, [user?.id]);

  // Fetch messages for selected class
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedClass) {
        console.log("Chat: No selected class, skipping message fetch");
        setCurrentChatInfo({ totalMembers: 0 });
        return;
      }

      console.log(
        `Chat: Fetching messages for class ${selectedClass.id} (${selectedClass.name})`,
      );

      try {
        setIsLoadingMessages(true);

        // Try to get chat room info first
        try {
          const chatInfo = await getChatRoomInfo(selectedClass.id);
          console.log(`Chat: Got current chat info:`, chatInfo);
          setCurrentChatInfo({ totalMembers: chatInfo.totalMembers || 0 });
        } catch (infoError) {
          console.log("Chat: Chat room info not available yet");
          setCurrentChatInfo({ totalMembers: 0 });
        }

        // Try to get messages
        const messagesData = await getMessages(selectedClass.id, 1, 50);
        console.log(
          `Chat: Got ${messagesData.messages?.length || 0} messages for class ${selectedClass.id}`,
        );
        setMessages(messagesData.messages || []);
      } catch (error: any) {
        console.error(
          `Chat: Error fetching messages for class ${selectedClass.id}:`,
          error,
        );

        // If chat room doesn't exist, try to create it
        if (
          error.message?.includes("Không tìm thấy phòng chat") ||
          error.message?.includes("chat room not found")
        ) {
          try {
            console.log(
              `Chat: Creating chat room for class ${selectedClass.id} (${selectedClass.name})`,
            );
            setIsCreatingChatRoom(true);

            await createChatRoom(selectedClass.id, selectedClass.name);
            console.log(
              `Chat: Successfully created chat room for class ${selectedClass.id}`,
            );

            // Try to add current user to the chat room
            if (user?.id) {
              console.log(
                `Chat: Adding user ${user.id} to chat room for class ${selectedClass.id}`,
              );
              await addMemberToChatRoom(selectedClass.id, user.id);
              console.log(`Chat: Successfully added user to chat room`);
            }

            // Retry fetching messages
            console.log(
              `Chat: Retrying message fetch for class ${selectedClass.id}`,
            );
            const retryMessagesData = await getMessages(
              selectedClass.id,
              1,
              50,
            );
            console.log(
              `Chat: Retry got ${retryMessagesData.messages?.length || 0} messages`,
            );
            setMessages(retryMessagesData.messages || []);

            // Update chat info after creating room
            try {
              const updatedChatInfo = await getChatRoomInfo(selectedClass.id);
              setCurrentChatInfo({
                totalMembers: updatedChatInfo.totalMembers || 0,
              });
            } catch (infoError) {
              console.log("Chat: Could not get updated chat info");
            }
          } catch (createError) {
            console.error(
              `Chat: Error creating chat room for class ${selectedClass.id}:`,
              createError,
            );
            setMessages([]);
          } finally {
            setIsCreatingChatRoom(false);
          }
        } else {
          setMessages([]);
        }
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedClass, user?.id]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!socket || !selectedClass) return;

    // Send typing start
    socket.emit("typing-start", { classId: selectedClass.id });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing-stop", { classId: selectedClass.id });
    }, 3000);
  };

  // Send message
  const handleSendMessage = async () => {
    if (
      (!newMessage.trim() && !selectedImage) ||
      !selectedClass ||
      sending ||
      !socket
    )
      return;

    try {
      setSending(true);
      setSendError(null); // Clear any previous errors
      console.log("Sending message:", {
        hasText: !!newMessage.trim(),
        hasImage: !!selectedImage,
        messageType: selectedImage ? "IMAGE" : "TEXT",
      });

      let messageData: any = {
        classId: selectedClass.id,
        messageType: selectedImage ? "IMAGE" : "TEXT",
      };

      if (selectedImage) {
        // Convert image to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            console.log("Image converted to base64, size:", result.length);
            resolve(result);
          };
          reader.onerror = (error) => {
            console.error("Error reading file:", error);
            reject(error);
          };
          reader.readAsDataURL(selectedImage);
        });

        try {
          const base64Data = await base64Promise;
          messageData.imageData = base64Data;
          messageData.content = newMessage.trim() || ""; // Caption for image
          console.log("Image data prepared, sending message...");
        } catch (error) {
          console.error("Error converting image to base64:", error);
          setSendError("Lỗi khi xử lý hình ảnh. Vui lòng thử lại.");
          return;
        }
      } else {
        messageData.content = newMessage;
      }

      // Send message via socket
      console.log("Emitting message via socket:", messageData);
      socket.emit("send-message", {
        ...messageData,
        replyToId: replyTo?.id,
      });

      // Clear form
      setNewMessage("");
      setSelectedImage(null);
      setImagePreview(null);
      setReplyTo(null);

      // Stop typing indicator
      if (socket && selectedClass) {
        socket.emit("typing-stop", { classId: selectedClass.id });
      }

      console.log("Message sent successfully");
    } catch (error) {
      console.error("Error sending message:", error);
      setSendError("Lỗi khi gửi tin nhắn. Vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  };

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("Selected file:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setSendError("Vui lòng chọn file ảnh (PNG, JPG, JPEG, GIF)");
      return;
    }

    // Validate file size (max 3MB to match class chat)
    if (file.size > 3 * 1024 * 1024) {
      setSendError("Kích thước ảnh không được vượt quá 3MB");
      return;
    }

    // Clear any previous errors
    setSendError(null);
    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      console.log("Image preview created successfully");
    };
    reader.onerror = (error) => {
      console.error("Error creating preview:", error);
      setSendError("Lỗi khi tạo preview ảnh");
    };
    reader.readAsDataURL(file);
  };

  // Clear selected image
  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    console.log("Cleared selected image");
  };

  // Handle message editing
  const handleEditMessage = async () => {
    if (!editingMessage || !editContent.trim() || !socket) return;

    try {
      // Send edit request via socket
      socket.emit("edit-message", {
        messageId: editingMessage.id,
        content: editContent,
      });

      setEditingMessage(null);
      setEditContent("");
    } catch (error: any) {
      console.error("Error editing message:", error);
      setSendError("Lỗi khi sửa tin nhắn. Vui lòng thử lại.");
    }
  };

  // Handle message deletion
  const handleDeleteMessage = async (messageId: string) => {
    if (!socket) return;

    try {
      // Send delete request via socket
      socket.emit("delete-message", { messageId });
    } catch (error: any) {
      console.error("Error deleting message:", error);
      setSendError("Lỗi khi xóa tin nhắn. Vui lòng thử lại.");
    }
  };

  // Filter classes based on search
  const filteredClasses = classList.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.courseName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "Vừa xong";
    if (diffMinutes < 60) return `${diffMinutes}p`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-50">
        <div className="h-full flex">
          <div className="w-80 border-r bg-white">
            <div className="p-4 border-b">
              <Skeleton className="h-8 w-48" />
            </div>
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex relative">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Class List */}
      <div
        className={`
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        fixed lg:relative z-50 lg:z-0
        ${isSidebarCollapsed ? "w-0 overflow-hidden" : "w-80"} h-full bg-white border-r flex flex-col
        transition-all duration-300 ease-in-out
        lg:translate-x-0
      `}
      >
        {/* Header */}
        {!isSidebarCollapsed && (
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-lg font-bold flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                  Chat
                </h1>
              </div>
              <div className="flex items-center gap-2">
                {/* Collapse button for desktop */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden lg:flex"
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  title={"Thu gọn sidebar"}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {/* Close button for mobile */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm lớp học..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {/* Class List */}
        {!isSidebarCollapsed && (
          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredClasses.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500">
                    {searchTerm
                      ? "Không tìm thấy lớp học nào"
                      : "Bạn chưa tham gia lớp học nào"}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    {searchTerm
                      ? "Thử từ khóa khác"
                      : "Đăng ký tham gia các lớp học LIVE để sử dụng chat"}
                  </p>
                </div>
              ) : (
                filteredClasses.map((classItem) => (
                  <motion.div
                    key={classItem.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={`mb-2 cursor-pointer transition-all ${
                        selectedClass?.id === classItem.id
                          ? "bg-blue-50 border-blue-200"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        setSelectedClass(classItem);
                        // Close sidebar on mobile when selecting a class
                        if (window.innerWidth < 1024) {
                          setIsSidebarOpen(false);
                        }
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {classItem.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            {classItem.unreadCount > 0 && (
                              <Badge
                                variant="destructive"
                                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                              >
                                {classItem.unreadCount > 9
                                  ? "9+"
                                  : classItem.unreadCount}
                              </Badge>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium truncate text-sm">
                                {classItem.name}
                              </h3>
                              {classItem.lastMessage && (
                                <span className="text-xs text-gray-500">
                                  {formatTime(classItem.lastMessage.sentAt)}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-gray-600 truncate mb-1">
                              {classItem.courseName}
                            </p>

                            {classItem.lastMessage ? (
                              <p className="text-sm text-gray-500 truncate">
                                {classItem.lastMessage.senderName}:{" "}
                                {classItem.lastMessage.content}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-400 flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {classItem.totalMembers} thành viên
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Expand button when sidebar is collapsed */}
      {isSidebarCollapsed && (
        <div className="fixed top-4 left-4 z-50 lg:block hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSidebarCollapsed(false)}
            title="Mở rộng sidebar"
            className="bg-white shadow-md hover:shadow-lg"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header with Menu Button */}
        <div className="lg:hidden p-4 bg-white border-b flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          {selectedClass && (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {selectedClass.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-sm">{selectedClass.name}</h2>
                <p className="text-xs text-gray-600">
                  {currentChatInfo.totalMembers} thành viên
                </p>
              </div>
            </div>
          )}
        </div>

        {selectedClass ? (
          <>
            {/* Desktop Chat Header */}
            <div className="hidden lg:block p-4 border-b bg-white">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.innerWidth >= 1024) {
                      setIsSidebarCollapsed(!isSidebarCollapsed);
                    } else {
                      setIsSidebarOpen(!isSidebarOpen);
                    }
                  }}
                  title={
                    window.innerWidth >= 1024
                      ? "Thu gọn sidebar"
                      : isSidebarOpen
                        ? "Ẩn danh sách lớp"
                        : "Hiện danh sách lớp"
                  }
                >
                  {window.innerWidth >= 1024 ? (
                    <ChevronLeft className="h-4 w-4" />
                  ) : isSidebarOpen ? (
                    <ChevronLeft className="h-4 w-4" />
                  ) : (
                    <Menu className="h-4 w-4" />
                  )}
                </Button>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {selectedClass.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{selectedClass.name}</h2>
                    {isConnected ? (
                      <span
                        className="w-2 h-2 bg-green-500 rounded-full"
                        title="Đã kết nối"
                      ></span>
                    ) : (
                      <span
                        className="w-2 h-2 bg-red-500 rounded-full"
                        title="Mất kết nối"
                      ></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedClass.courseName} • {currentChatInfo.totalMembers}{" "}
                    thành viên
                    {!isConnected && (
                      <span className="text-red-500 ml-2">• Mất kết nối</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {isLoadingMessages || isCreatingChatRoom ? (
                <div className="space-y-4">
                  {isCreatingChatRoom ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                      <p className="text-gray-500">
                        Đang thiết lập phòng chat...
                      </p>
                    </div>
                  ) : (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex space-x-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-16 w-64" />
                      </div>
                    ))
                  )}
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500">Chưa có tin nhắn nào</p>
                  <p className="text-gray-400 text-sm">
                    Hãy bắt đầu cuộc trò chuyện!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isOwnMessage = message.sender.id === user?.id;

                    // Handle deleted messages
                    if (message.isDeleted) {
                      return (
                        <div
                          key={message.id}
                          className="flex justify-center my-2"
                        >
                          <span className="text-sm text-gray-500 italic">
                            Tin nhắn đã bị xóa
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={message.id}
                        className={`group flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-4`}
                      >
                        <div
                          className={`flex ${isOwnMessage ? "flex-row-reverse" : "flex-row"} items-start space-x-2 max-w-[70%]`}
                        >
                          {!isOwnMessage && (
                            <Avatar className="w-8 h-8">
                              <AvatarImage
                                src={message.sender.image}
                                alt={message.sender.name}
                              />
                              <AvatarFallback>
                                {message.sender.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          )}

                          <div className={`${isOwnMessage ? "mr-2" : "ml-2"}`}>
                            {!isOwnMessage && (
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-sm font-medium">
                                  {message.sender.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatTime(message.sentAt)}
                                </span>
                              </div>
                            )}

                            {/* Reply reference */}
                            {message.replyTo && (
                              <div className="bg-gray-100 border-l-4 border-blue-500 p-2 mb-2 rounded">
                                <div className="text-xs text-gray-600 font-medium">
                                  Trả lời {message.replyTo.sender.name}
                                </div>
                                <div className="text-sm text-gray-700 truncate">
                                  {message.replyTo.messageType === "TEXT"
                                    ? message.replyTo.content
                                    : `[${message.replyTo.fileName || "File"}]`}
                                </div>
                              </div>
                            )}

                            <div
                              className={`rounded-lg p-3 ${
                                isOwnMessage
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              {/* Message content */}
                              {message.messageType === "TEXT" && (
                                <div className="break-words">
                                  {message.content}
                                </div>
                              )}

                              {message.messageType === "IMAGE" &&
                                message.fileUrl && (
                                  <div>
                                    {message.content && (
                                      <div className="mb-2 break-words">
                                        {message.content}
                                      </div>
                                    )}
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <img
                                          {...createGoogleDriveImageProps(
                                            message.fileUrl,
                                          )}
                                          alt={message.fileName || "Image"}
                                          className="max-w-full h-auto rounded cursor-pointer hover:opacity-80 transition-opacity"
                                          title="Click để xem ảnh kích thước đầy đủ"
                                        />
                                      </DialogTrigger>
                                      <DialogContent className="max-w-4xl w-auto">
                                        <DialogHeader>
                                          <DialogTitle>
                                            {message.fileName || "Hình ảnh"}
                                          </DialogTitle>
                                          <DialogDescription>
                                            Gửi bởi {message.sender.name} lúc{" "}
                                            {formatTime(message.sentAt)}
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="flex justify-center">
                                          <img
                                            {...createGoogleDriveImageProps(
                                              message.fileUrl,
                                            )}
                                            alt={message.fileName || "Image"}
                                            className="max-w-full max-h-[70vh] h-auto rounded"
                                          />
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                )}

                              {/* Message timing and edit status */}
                              <div
                                className={`flex items-center justify-between mt-2 ${
                                  isOwnMessage
                                    ? "text-blue-100"
                                    : "text-gray-500"
                                }`}
                              >
                                <span className="text-xs">
                                  {isOwnMessage && formatTime(message.sentAt)}
                                  {message.isEdited && (
                                    <span className="ml-1">(đã chỉnh sửa)</span>
                                  )}
                                </span>

                                {/* Message actions */}
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setReplyTo(message)}
                                    className="p-1 h-6 w-6"
                                    title="Trả lời"
                                  >
                                    <Reply className="w-3 h-3" />
                                  </Button>

                                  {isOwnMessage &&
                                    message.messageType === "TEXT" && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="p-1 h-6 w-6"
                                          >
                                            <Settings className="w-3 h-3" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                          <DropdownMenuItem
                                            onClick={() => {
                                              setEditingMessage(message);
                                              setEditContent(
                                                message.content || "",
                                              );
                                            }}
                                          >
                                            <Edit2 className="w-4 h-4 mr-2" />
                                            Chỉnh sửa
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleDeleteMessage(message.id)
                                            }
                                            className="text-red-600"
                                          >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Xóa
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing indicator */}
                  {typingUsers.size > 0 && (
                    <div className="flex items-center space-x-2 mb-4 px-4">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {typingUsers.size === 1
                          ? "Ai đó đang nhập..."
                          : `${typingUsers.size} người đang nhập...`}
                      </span>
                    </div>
                  )}

                  {/* Auto-scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
              {/* Reply preview */}
              {replyTo && (
                <div className="p-2 bg-gray-50 border-t border-b mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm text-gray-600">
                        Trả lời {replyTo.sender.name}
                      </div>
                      <div className="text-sm text-gray-800 truncate">
                        {replyTo.messageType === "TEXT"
                          ? replyTo.content
                          : `[${replyTo.fileName || "File"}]`}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setReplyTo(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Edit message dialog */}
              <Dialog
                open={!!editingMessage}
                onOpenChange={() => {
                  setEditingMessage(null);
                  setEditContent("");
                }}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Chỉnh sửa tin nhắn</DialogTitle>
                    <DialogDescription>
                      Thay đổi nội dung tin nhắn của bạn
                    </DialogDescription>
                  </DialogHeader>
                  <Textarea
                    value={editContent}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setEditContent(e.target.value)
                    }
                    placeholder="Nhập nội dung tin nhắn..."
                    rows={3}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingMessage(null);
                        setEditContent("");
                      }}
                    >
                      Hủy
                    </Button>
                    <Button onClick={handleEditMessage}>Cập nhật</Button>
                  </div>
                </DialogContent>
              </Dialog>
              {/* Image Preview */}
              {imagePreview && (
                <div className="mb-3 relative inline-block bg-gray-50 p-2 rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">
                        {selectedImage?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedImage && formatFileSize(selectedImage.size)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-500 hover:text-red-600"
                      onClick={clearSelectedImage}
                      title="Xóa ảnh"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-48 max-h-32 rounded border object-cover"
                  />
                </div>
              )}

              {/* Error message */}
              {sendError && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{sendError}</p>
                </div>
              )}

              <div className="flex items-center space-x-2">
                {/* Image Upload Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={sending || !isConnected || isCreatingChatRoom}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={sending || !isConnected || isCreatingChatRoom}
                  onClick={() => fileInputRef.current?.click()}
                  title="Chọn ảnh để gửi (PNG, JPG, GIF - tối đa 3MB)"
                  className="hover:bg-blue-50 hover:border-blue-300"
                >
                  <Image className="h-4 w-4" />
                </Button>

                <Input
                  placeholder={
                    isCreatingChatRoom
                      ? "Đang thiết lập phòng chat..."
                      : isConnected
                        ? selectedImage
                          ? "Thêm chú thích cho ảnh (tùy chọn)..."
                          : "Nhập tin nhắn..."
                        : "Đang kết nối..."
                  }
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                    if (sendError) setSendError(null); // Clear error when user starts typing
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={sending || !isConnected || isCreatingChatRoom}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={
                    (!newMessage.trim() && !selectedImage) ||
                    sending ||
                    !isConnected ||
                    isCreatingChatRoom
                  }
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {!isConnected ? (
                <p className="text-xs text-red-500 mt-1">
                  Mất kết nối - đang thử kết nối lại...
                </p>
              ) : isCreatingChatRoom ? (
                <p className="text-xs text-blue-500 mt-1">
                  Đang thiết lập phòng chat, vui lòng chờ...
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Chọn một lớp học để bắt đầu chat
              </h3>
              <p className="text-gray-500 mb-4">
                Chọn lớp học từ danh sách để xem và gửi tin nhắn
              </p>
              {/* Show menu button on mobile when no class selected */}
              <div className="lg:hidden">
                <Button
                  variant="outline"
                  onClick={() => setIsSidebarOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Menu className="h-4 w-4" />
                  Xem danh sách lớp học
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
