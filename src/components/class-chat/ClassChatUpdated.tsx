"use client";

import React, { useEffect, useRef, useState } from "react";

import { toast } from "@/hooks/use-toast";
import {
  Edit2,
  FileText,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Paperclip,
  Reply,
  Search,
  Send,
  Settings,
  Trash2,
  Users,
  Video,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";

import {
  ChatMessage,
  ChatRoomInfo,
  PaginatedMessages,
  deleteMessage,
  editMessage,
  getChatRoomInfo,
  getMessages,
  sendMessage as sendChatMessage,
  sendImageMessage,
} from "@/actions/classChatActions";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

interface ClassChatProps {
  classId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ClassChat: React.FC<ClassChatProps> = ({ classId, isOpen, onClose }) => {
  const { data: session } = useSession();
  const [chatRoom, setChatRoom] = useState<ChatRoomInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(
    null,
  );
  const [editContent, setEditContent] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial data
  useEffect(() => {
    if (isOpen && classId) {
      loadChatData();
    }
  }, [isOpen, classId]);

  const loadChatData = async () => {
    try {
      setLoading(true);

      // Load chat room info
      const roomInfo = await getChatRoomInfo(classId);
      setChatRoom(roomInfo);

      // Load initial messages
      const messagesData = await getMessages(classId, 1, 20);
      setMessages(messagesData.messages);
      setHasMoreMessages(messagesData.meta.hasNextPage);
      setPage(1);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!hasMoreMessages || loadingMoreMessages) return;

    try {
      setLoadingMoreMessages(true);
      const nextPage = page + 1;
      const messagesData = await getMessages(classId, nextPage, 20, searchTerm);

      setMessages((prev) => [...messagesData.messages, ...prev]);
      setHasMoreMessages(messagesData.meta.hasNextPage);
      setPage(nextPage);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingMoreMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const message = await sendChatMessage(classId, newMessage, replyTo?.id);

      setMessages((prev) => [...prev, message]);
      setNewMessage("");
      setReplyTo(null);
      scrollToBottom();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file || sending) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Lỗi",
        description: "File không được vượt quá 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);

      // Only handle images for now, since the backend only supports sendImageMessage
      if (file.type.startsWith("image/")) {
        const message = await sendImageMessage(
          classId,
          file,
          undefined,
          replyTo?.id,
        );

        setMessages((prev) => [...prev, message]);
        setReplyTo(null);
        scrollToBottom();
      } else {
        toast({
          title: "Lỗi",
          description: "Hiện tại chỉ hỗ trợ upload file ảnh",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleEditMessage = async () => {
    if (!editingMessage || !editContent.trim()) return;

    try {
      const updatedMessage = await editMessage(editingMessage.id, editContent);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === updatedMessage.id ? updatedMessage : msg,
        ),
      );

      setEditingMessage(null);
      setEditContent("");
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, isDeleted: true, content: "Tin nhắn đã bị xóa" }
            : msg,
        ),
      );
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return (
        "Hôm qua " +
        date.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } else {
      return (
        date.toLocaleDateString("vi-VN") +
        " " +
        date.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isOwnMessage = message.sender.id === session?.user?.id;

    if (message.isDeleted) {
      return (
        <div key={message.id} className="flex justify-center my-2">
          <span className="text-sm text-gray-500 italic">
            Tin nhắn đã bị xóa
          </span>
        </div>
      );
    }

    return (
      <div
        key={message.id}
        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-4`}
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
              <AvatarFallback>{message.sender.name.charAt(0)}</AvatarFallback>
            </Avatar>
          )}

          <div className={`${isOwnMessage ? "mr-2" : "ml-2"}`}>
            {!isOwnMessage && (
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-medium">
                  {message.sender.name}
                </span>
                <Badge
                  variant={
                    message.sender.role === "INSTRUCTOR"
                      ? "default"
                      : "secondary"
                  }
                  className="text-xs"
                >
                  {message.sender.role === "INSTRUCTOR"
                    ? "Giảng viên"
                    : "Học viên"}
                </Badge>
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
                <div className="break-words">{message.content}</div>
              )}

              {message.messageType === "IMAGE" && (
                <div>
                  {message.content && (
                    <div className="mb-2 break-words">{message.content}</div>
                  )}
                  <img
                    src={message.fileUrl}
                    alt={message.fileName}
                    className="max-w-full h-auto rounded cursor-pointer"
                    onClick={() => window.open(message.fileUrl, "_blank")}
                  />
                </div>
              )}

              {message.messageType === "FILE" && (
                <div>
                  {message.content && (
                    <div className="mb-2 break-words">{message.content}</div>
                  )}
                  <div className="flex items-center space-x-2 p-2 bg-white bg-opacity-20 rounded">
                    <FileText className="w-4 h-4" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {message.fileName}
                      </div>
                      <div className="text-xs opacity-75">
                        {message.fileSize && formatFileSize(message.fileSize)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(message.fileUrl, "_blank")}
                      className="text-xs"
                    >
                      Tải về
                    </Button>
                  </div>
                </div>
              )}

              {/* Message actions */}
              <div
                className={`flex items-center justify-between mt-2 ${
                  isOwnMessage ? "text-blue-100" : "text-gray-500"
                }`}
              >
                <span className="text-xs">
                  {formatTime(message.sentAt)}
                  {message.isEdited && (
                    <span className="ml-1">(đã chỉnh sửa)</span>
                  )}
                </span>

                <div className="flex items-center space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setReplyTo(message)}
                    className="p-1 h-6 w-6"
                  >
                    <Reply className="w-3 h-3" />
                  </Button>

                  {isOwnMessage && message.messageType === "TEXT" && (
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
                            setEditContent(message.content || "");
                          }}
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteMessage(message.id)}
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
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl h-[80vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl h-[80vh] flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-6 h-6" />
              <div>
                <CardTitle className="text-lg">{chatRoom?.name}</CardTitle>
                <div className="text-sm text-gray-500">
                  {chatRoom?.totalMembers} thành viên •{" "}
                  {chatRoom?.totalMessages} tin nhắn
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Tìm kiếm tin nhắn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48"
                />
                <Search className="w-4 h-4 text-gray-500" />
              </div>

              <Dialog
                open={showMembersDialog}
                onOpenChange={setShowMembersDialog}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Users className="w-4 h-4 mr-2" />
                    Thành viên
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Thành viên nhóm chat</DialogTitle>
                    <DialogDescription>
                      Danh sách các thành viên trong nhóm chat lớp học
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="max-h-96">
                    {chatRoom?.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center space-x-3 p-2"
                      >
                        <Avatar>
                          <AvatarImage src={member.image} alt={member.name} />
                          <AvatarFallback>
                            {member.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-gray-500">
                            Tham gia: {formatTime(member.joinedAt)}
                          </div>
                        </div>
                        <Badge
                          variant={
                            member.role === "INSTRUCTOR"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {member.role === "INSTRUCTOR"
                            ? "Giảng viên"
                            : "Học viên"}
                        </Badge>
                      </div>
                    ))}
                  </ScrollArea>
                </DialogContent>
              </Dialog>

              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            {loadingMoreMessages && (
              <div className="flex justify-center py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            )}

            {hasMoreMessages && !loadingMoreMessages && (
              <div className="flex justify-center py-2">
                <Button variant="ghost" size="sm" onClick={loadMoreMessages}>
                  Tải thêm tin nhắn
                </Button>
              </div>
            )}

            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Reply preview */}
          {replyTo && (
            <div className="p-2 bg-gray-50 border-t border-b">
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
              </DialogHeader>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
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

          {/* Message input */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
              >
                <Paperclip className="w-4 h-4" />
              </Button>

              <div className="flex-1">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={sending}
                />
              </div>

              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileUpload(file);
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassChat;
