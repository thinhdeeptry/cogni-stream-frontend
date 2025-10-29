"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  MessageCircle,
  Search,
  Send,
  Users,
} from "lucide-react";
import { useSession } from "next-auth/react";

import {
  type ChatMessage,
  getChatRoomInfo,
  getMessages,
  sendMessage,
} from "@/actions/classChatActions";
import { getEnrollmentsByUser } from "@/actions/enrollmentActions";

import useUserStore from "@/stores/useUserStore";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [sending, setSending] = useState(false);

  const router = useRouter();
  const { data: session } = useSession();
  const { user } = useUserStore();

  // Fetch user's enrolled classes
  useEffect(() => {
    const fetchUserClasses = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);

        // Get all enrollments of user
        const enrollments = await getEnrollmentsByUser(user.id);

        if (
          enrollments.success &&
          enrollments.data &&
          Array.isArray(enrollments.data)
        ) {
          const classItems: ClassChatItem[] = [];

          for (const enrollment of enrollments.data) {
            // Check both STREAM (has class) and ONLINE (has course) enrollments
            if (enrollment.class && enrollment.type === "STREAM") {
              // STREAM enrollment - has class
              try {
                const chatInfo = await getChatRoomInfo(enrollment.class.id);

                classItems.push({
                  id: enrollment.class.id,
                  name: enrollment.class.name,
                  courseName: enrollment.class.course?.title || "Khóa học",
                  lastMessage: undefined, // Will be populated later
                  unreadCount: 0, // TODO: Implement unread count
                  totalMembers: chatInfo.totalMembers || 0,
                });
              } catch (error) {
                console.error(
                  `Error getting chat info for class ${enrollment.class.id}:`,
                  error,
                );
              }
            }
            // Note: ONLINE enrollments don't have class chat rooms
          }

          setClassList(classItems);

          // Auto select first class if available
          if (classItems.length > 0) {
            setSelectedClass(classItems[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching user classes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserClasses();
  }, [user?.id]);

  // Fetch messages for selected class
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedClass) return;

      try {
        setIsLoadingMessages(true);
        const messagesData = await getMessages(selectedClass.id, 1, 50);
        setMessages(messagesData.messages || []);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedClass]);

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedClass || sending) return;

    try {
      setSending(true);
      const message = await sendMessage(selectedClass.id, newMessage);
      setMessages((prev) => [...prev, message]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
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

    if (diffMinutes < 1) return "Vừa xong";
    if (diffMinutes < 60) return `${diffMinutes}p`;
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString("vi-VN");
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
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar - Class List */}
      <div className="w-80 bg-white border-r flex flex-col">
        {/* Header */}
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

        {/* Class List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredClasses.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500">Không có lớp học nào</p>
                <p className="text-gray-400 text-sm mt-1">
                  Đăng ký tham gia các lớp học để chat
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
                    onClick={() => setSelectedClass(classItem)}
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
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedClass ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {selectedClass.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">{selectedClass.name}</h2>
                  <p className="text-sm text-gray-600">
                    {selectedClass.courseName} • {selectedClass.totalMembers}{" "}
                    thành viên
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {isLoadingMessages ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex space-x-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-16 w-64" />
                    </div>
                  ))}
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

                    return (
                      <div
                        key={message.id}
                        className={`flex space-x-3 ${isOwnMessage ? "justify-end" : ""}`}
                      >
                        {!isOwnMessage && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={message.sender.image} />
                            <AvatarFallback>
                              {message.sender.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`flex-1 ${isOwnMessage ? "flex justify-end" : ""}`}
                        >
                          {!isOwnMessage && (
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {message.sender.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatTime(message.sentAt)}
                              </span>
                            </div>
                          )}
                          <div
                            className={`rounded-lg p-3 max-w-md ${
                              isOwnMessage
                                ? "bg-blue-500 text-white ml-auto"
                                : "bg-gray-100"
                            }`}
                          >
                            <p className="text-sm">
                              {message.content || "Tin nhắn không có nội dung"}
                            </p>
                            {isOwnMessage && (
                              <div className="text-xs text-blue-100 mt-1 text-right">
                                {formatTime(message.sentAt)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Nhập tin nhắn..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={sending}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Chọn một lớp học để bắt đầu chat
              </h3>
              <p className="text-gray-500">
                Chọn lớp học từ danh sách bên trái để xem và gửi tin nhắn
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
