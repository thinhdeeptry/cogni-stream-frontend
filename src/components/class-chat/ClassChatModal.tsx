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
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";

import {
  ChatMessage,
  ChatRoomInfo,
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

interface ClassChatModalProps {
  classId: string;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

const ClassChatModal: React.FC<ClassChatModalProps> = ({
  classId,
  className,
  isOpen,
  onClose,
}) => {
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Load initial data
  useEffect(() => {
    if (isOpen && classId) {
      loadChatData();
    }
  }, [isOpen, classId]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

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
        description: error.message || "Không thể tải dữ liệu chat",
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
        description: error.message || "Không thể tải thêm tin nhắn",
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
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể gửi tin nhắn",
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

      // For now, only support images - can be extended later
      if (file.type.startsWith("image/")) {
        const message = await sendImageMessage(
          classId,
          file,
          undefined, // content
          replyTo?.id,
        );

        setMessages((prev) => [...prev, message]);
        setReplyTo(null);
      } else {
        toast({
          title: "Lỗi",
          description: "Hiện tại chỉ hỗ trợ file ảnh",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể gửi file",
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
        description: error.message || "Không thể chỉnh sửa tin nhắn",
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
        description: error.message || "Không thể xóa tin nhắn",
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
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 1) return "Vừa xong";
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
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
        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-4 group`}
      >
        <div
          className={`flex ${isOwnMessage ? "flex-row-reverse" : "flex-row"} items-start space-x-2 max-w-[75%]`}
        >
          {!isOwnMessage && (
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage
                src={message.sender.image}
                alt={message.sender.name}
              />
              <AvatarFallback>{message.sender.name.charAt(0)}</AvatarFallback>
            </Avatar>
          )}

          <div className={`${isOwnMessage ? "mr-2" : "ml-2"} flex-1`}>
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
              <div className="bg-gray-100 border-l-4 border-blue-500 p-2 mb-2 rounded text-sm">
                <div className="text-xs text-gray-600 font-medium">
                  Trả lời {message.replyTo.sender.name}
                </div>
                <div className="text-gray-700 truncate">
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
              {message.messageType === "TEXT" && message.content && (
                <div className="break-words whitespace-pre-wrap">
                  {message.content}
                </div>
              )}

              {message.messageType === "IMAGE" && (
                <div>
                  {message.content && (
                    <div className="mb-2 break-words">{message.content}</div>
                  )}
                  <img
                    src={message.fileUrl}
                    alt={message.fileName}
                    className="max-w-full h-auto rounded cursor-pointer hover:opacity-90 transition-opacity"
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
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
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
                      className="text-xs h-auto p-1"
                    >
                      Tải về
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Message info and actions */}
            <div
              className={`flex items-center justify-between mt-1 text-xs ${
                isOwnMessage ? "text-gray-500" : "text-gray-500"
              } opacity-0 group-hover:opacity-100 transition-opacity`}
            >
              <span>
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
                  className="p-1 h-6 w-6 hover:bg-gray-200"
                  title="Trả lời"
                >
                  <Reply className="w-3 h-3" />
                </Button>

                {isOwnMessage && message.messageType === "TEXT" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="p-1 h-6 w-6 hover:bg-gray-200"
                        title="Tùy chọn"
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
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <CardHeader className="border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {chatRoom?.name || `Chat ${className}`}
                </CardTitle>
                <div className="text-sm text-gray-500">
                  {chatRoom?.totalMembers || 0} thành viên •{" "}
                  {chatRoom?.totalMessages || 0} tin nhắn
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Search */}
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm tin nhắn..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-48 pl-10"
                  />
                </div>
              </div>

              {/* Members dialog */}
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
                <DialogContent className="max-w-md">
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
                        className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg"
                      >
                        <Avatar className="w-10 h-10">
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

              {/* Close button */}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-sm text-gray-500">Đang tải chat...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                {/* Load more button */}
                {hasMoreMessages && !loadingMoreMessages && (
                  <div className="flex justify-center py-2 mb-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadMoreMessages}
                    >
                      Tải thêm tin nhắn
                    </Button>
                  </div>
                )}

                {loadingMoreMessages && (
                  <div className="flex justify-center py-2 mb-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                )}

                {/* Messages */}
                <div className="space-y-2">{messages.map(renderMessage)}</div>

                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Reply preview */}
              {replyTo && (
                <div className="p-3 bg-gray-50 border-t border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-600 mb-1">
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
                      className="ml-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Message input */}
              <div className="p-4 border-t bg-white">
                <div className="flex items-end space-x-2">
                  {/* File upload button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending}
                    className="shrink-0"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>

                  {/* Message input */}
                  <div className="flex-1">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Nhập tin nhắn..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={sending}
                      className="min-h-[40px] max-h-[120px] resize-none"
                      rows={1}
                    />
                  </div>

                  {/* Send button */}
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="shrink-0"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>

        {/* Hidden file input */}
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
              className="resize-none"
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
              <Button
                onClick={handleEditMessage}
                disabled={!editContent.trim()}
              >
                Cập nhật
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  );
};

export default ClassChatModal;
