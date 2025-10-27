"use client";

import React, { useEffect, useRef, useState } from "react";

import { toast } from "@/hooks/use-toast";
import {
  FileText,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Send,
  Users,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

// Types
interface ChatMessage {
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

interface ChatRoomInfo {
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

interface ClassChatProps {
  classId: string;
  className?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function ClassChat({
  classId,
  className,
  isOpen = false,
  onToggle,
}: ClassChatProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatRoomInfo, setChatRoomInfo] = useState<ChatRoomInfo | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock API functions - replace with actual API calls
  const fetchChatRoomInfo = async () => {
    // TODO: Replace with actual API call
    try {
      // const response = await fetch(`/api/class-chat/${classId}/info`);
      // const data = await response.json();

      // Mock data for now
      const mockInfo: ChatRoomInfo = {
        id: `chat-${classId}`,
        name: `Chat ${className}`,
        description: `Phòng chat cho lớp học ${className}`,
        class: {
          id: classId,
          name: className || "Lớp học",
          status: "ACTIVE",
        },
        totalMessages: 25,
        totalMembers: 12,
        members: [
          {
            id: "1",
            name: "Nguyễn Văn A",
            image: "",
            role: "INSTRUCTOR",
            joinedAt: new Date().toISOString(),
          },
          {
            id: "2",
            name: "Trần Thị B",
            image: "",
            role: "STUDENT",
            joinedAt: new Date().toISOString(),
          },
        ],
      };

      setChatRoomInfo(mockInfo);
    } catch (error) {
      console.error("Error fetching chat room info:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin phòng chat",
        variant: "destructive",
      });
    }
  };

  const fetchMessages = async (pageNum: number = 1) => {
    try {
      if (pageNum === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      // TODO: Replace with actual API call
      // const response = await fetch(`/api/class-chat/${classId}/messages?page=${pageNum}&limit=20`);
      // const data = await response.json();

      // Mock messages for now
      const mockMessages: ChatMessage[] = [
        {
          id: "1",
          content: "Chào mọi người! Hôm nay chúng ta sẽ học về React Hooks.",
          messageType: "TEXT",
          status: "DELIVERED",
          sentAt: new Date(Date.now() - 3600000).toISOString(),
          isEdited: false,
          isDeleted: false,
          sender: {
            id: "instructor-1",
            name: "Giáo viên Nguyễn",
            image: "",
            role: "INSTRUCTOR",
          },
        },
        {
          id: "2",
          content: "Dạ thầy, em đã chuẩn bị sẵn rồi ạ!",
          messageType: "TEXT",
          status: "DELIVERED",
          sentAt: new Date(Date.now() - 3000000).toISOString(),
          isEdited: false,
          isDeleted: false,
          sender: {
            id: "student-1",
            name: "Học viên A",
            image: "",
            role: "STUDENT",
          },
        },
        {
          id: "3",
          content: "Em có câu hỏi về useEffect ạ",
          messageType: "TEXT",
          status: "DELIVERED",
          sentAt: new Date(Date.now() - 1800000).toISOString(),
          isEdited: false,
          isDeleted: false,
          sender: {
            id: "student-2",
            name: "Học viên B",
            image: "",
            role: "STUDENT",
          },
          replyTo: {
            id: "1",
            content: "Chào mọi người! Hôm nay chúng ta sẽ học về React Hooks.",
            messageType: "TEXT",
            sender: {
              name: "Giáo viên Nguyễn",
            },
          },
        },
      ];

      if (pageNum === 1) {
        setMessages(mockMessages);
      } else {
        setMessages((prev) => [...mockMessages, ...prev]);
      }

      setHasMoreMessages(pageNum < 3); // Mock pagination
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải tin nhắn",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const sendMessage = async () => {
    if ((!messageInput.trim() && !selectedFile) || isSending) return;

    setIsSending(true);
    try {
      // TODO: Replace with actual API call
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        content: messageInput.trim() || undefined,
        messageType: selectedFile
          ? selectedFile.type.startsWith("image/")
            ? "IMAGE"
            : "FILE"
          : "TEXT",
        status: "SENT",
        fileName: selectedFile?.name,
        fileUrl: filePreview || undefined,
        fileType: selectedFile?.type,
        fileSize: selectedFile?.size,
        sentAt: new Date().toISOString(),
        isEdited: false,
        isDeleted: false,
        sender: {
          id: session?.user?.email || "current-user",
          name: session?.user?.name || "Bạn",
          image: session?.user?.image || "",
          role: "STUDENT", // This should come from user context
        },
        replyTo: replyTo
          ? {
              id: replyTo.id,
              content: replyTo.content,
              messageType: replyTo.messageType,
              fileName: replyTo.fileName,
              sender: replyTo.sender,
            }
          : undefined,
      };

      setMessages((prev) => [...prev, newMessage]);
      setMessageInput("");
      setSelectedFile(null);
      setFilePreview(null);
      setReplyTo(null);

      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Lỗi",
        description: "Không thể gửi tin nhắn",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File quá lớn",
        description: "Kích thước file không được vượt quá 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Định dạng file không hỗ trợ",
        description: "Chỉ chấp nhận ảnh (JPG, PNG, GIF)",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "INSTRUCTOR":
        return "bg-blue-100 text-blue-800";
      case "ADMIN":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "INSTRUCTOR":
        return "Giảng viên";
      case "ADMIN":
        return "Quản trị";
      default:
        return "Học viên";
    }
  };

  // Initialize chat
  useEffect(() => {
    if (classId && isOpen) {
      fetchChatRoomInfo();
      fetchMessages(1);
    }
  }, [classId, isOpen]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  if (!isOpen) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[500px] shadow-lg border-2 border-gray-200 z-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">
              {chatRoomInfo?.name || "Chat"}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Users className="h-4 w-4" />
                  <span className="ml-1 text-xs">
                    {chatRoomInfo?.totalMembers || 0}
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    Thành viên ({chatRoomInfo?.totalMembers || 0})
                  </DialogTitle>
                  <DialogDescription>
                    Danh sách thành viên trong phòng chat
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-60">
                  <div className="space-y-2">
                    {chatRoomInfo?.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold">
                          {member.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{member.name}</p>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getRoleColor(member.role)}`}
                          >
                            {getRoleLabel(member.role)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="sm" onClick={onToggle}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col h-[calc(100%-80px)]">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4" ref={messagesContainerRef}>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {hasMoreMessages && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => fetchMessages(page + 1)}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Tải tin nhắn cũ hơn
                </Button>
              )}

              {messages.map((message) => (
                <div key={message.id} className="group">
                  {/* Reply indicator */}
                  {message.replyTo && (
                    <div className="ml-8 mb-1 p-2 bg-gray-50 rounded-lg border-l-2 border-gray-300">
                      <p className="text-xs text-gray-600">
                        Trả lời {message.replyTo.sender.name}
                      </p>
                      <p className="text-sm text-gray-800 truncate">
                        {message.replyTo.messageType === "TEXT"
                          ? message.replyTo.content
                          : `📎 ${message.replyTo.fileName || "File"}`}
                      </p>
                    </div>
                  )}

                  <div
                    className={`flex gap-3 ${message.sender.id === session?.user?.email ? "flex-row-reverse" : ""}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {message.sender.name.charAt(0)}
                    </div>

                    <div
                      className={`flex-1 ${message.sender.id === session?.user?.email ? "text-right" : ""}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {message.sender.name}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getRoleColor(message.sender.role)}`}
                        >
                          {getRoleLabel(message.sender.role)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatTime(message.sentAt)}
                        </span>
                      </div>

                      <div
                        className={`inline-block max-w-xs rounded-lg p-3 ${
                          message.sender.id === session?.user?.email
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        {/* Text content */}
                        {message.content && (
                          <p className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </p>
                        )}

                        {/* File content */}
                        {message.messageType !== "TEXT" && (
                          <div className="mt-2">
                            {message.messageType === "IMAGE" &&
                              message.fileUrl && (
                                <img
                                  src={message.fileUrl}
                                  alt={message.fileName}
                                  className="max-w-full rounded-lg"
                                />
                              )}
                            {message.messageType === "IMAGE" &&
                              message.fileUrl && (
                                <img
                                  src={message.fileUrl}
                                  alt={message.fileName || "Image"}
                                  className="max-w-full rounded-lg cursor-pointer hover:opacity-90"
                                  onClick={() =>
                                    window.open(message.fileUrl, "_blank")
                                  }
                                />
                              )}
                            {message.messageType === "FILE" && (
                              <div className="flex items-center gap-2 p-2 bg-white/10 rounded">
                                <FileText className="h-4 w-4" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm truncate">
                                    {message.fileName}
                                  </p>
                                  <p className="text-xs opacity-70">
                                    {message.fileSize
                                      ? formatFileSize(message.fileSize)
                                      : ""}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {message.isEdited && (
                          <p className="text-xs opacity-70 mt-1">
                            (đã chỉnh sửa)
                          </p>
                        )}
                      </div>

                      {/* Message actions */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-auto p-1"
                          onClick={() => setReplyTo(message)}
                        >
                          Trả lời
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Reply indicator */}
        {replyTo && (
          <div className="px-4 py-2 bg-gray-50 border-t">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-gray-600">
                  Trả lời {replyTo.sender.name}
                </p>
                <p className="text-sm text-gray-800 truncate">
                  {replyTo.messageType === "TEXT"
                    ? replyTo.content
                    : `📎 ${replyTo.fileName || "File"}`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyTo(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* File preview */}
        {selectedFile && (
          <div className="px-4 py-2 bg-gray-50 border-t">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-gray-600">
                  {formatFileSize(selectedFile.size)}
                </p>
                {filePreview && (
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="mt-2 max-w-20 max-h-20 rounded"
                  />
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFile(null);
                  setFilePreview(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="min-h-[40px] max-h-[100px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>

              <Button
                onClick={sendMessage}
                disabled={(!messageInput.trim() && !selectedFile) || isSending}
                size="sm"
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
