"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Send, Smile, User, X } from "lucide-react";

import useUserStore from "@/stores/useUserStore";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

interface PopupChatbotProps {
  systemPrompt?: string;
  referenceText?: string;
  title?: string;
  placeholder?: string;
  buttonClassName?: string;
  cardClassName?: string;
  initialOpen?: boolean;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  suggestedQuestions?: string[];
  balloonText?: string;
}

// Suggested questions mặc định
const DEFAULT_SUGGESTED_QUESTIONS = [
  "Bài học này nói về gì?",
  "Làm thế nào để áp dụng kiến thức này?",
  "Giải thích chi tiết hơn về chủ đề này",
  "Cho ví dụ thực tế về chủ đề này",
];

// Dynamic avatar component for messages
const MessageAvatar = ({
  role,
  userId,
  userImage,
}: {
  role: string;
  userId?: string;
  userImage?: string;
}) => {
  if (role === "user") {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Avatar className="w-8 h-8">
          <AvatarImage
            src={
              userImage ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || "user"}`
            }
          />
          <AvatarFallback>
            {(userId || "U").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Avatar className="h-8 w-8 bg-primary/10 border shadow-sm">
        <AvatarFallback className="text-primary">
          <Bot size={16} />
        </AvatarFallback>
      </Avatar>
    </motion.div>
  );
};

// Loading animation component
const LoadingDots = () => {
  return (
    <div className="flex space-x-1.5 items-center">
      <motion.div
        className="h-2 w-2 bg-primary/70 rounded-full"
        animate={{
          scale: [0.5, 1, 0.5],
          backgroundColor: [
            "rgba(var(--primary), 0.4)",
            "rgba(var(--primary), 0.7)",
            "rgba(var(--primary), 0.4)",
          ],
        }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="h-2 w-2 bg-primary/70 rounded-full"
        animate={{
          scale: [0.5, 1, 0.5],
          backgroundColor: [
            "rgba(var(--primary), 0.4)",
            "rgba(var(--primary), 0.7)",
            "rgba(var(--primary), 0.4)",
          ],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.2,
        }}
      />
      <motion.div
        className="h-2 w-2 bg-primary/70 rounded-full"
        animate={{
          scale: [0.5, 1, 0.5],
          backgroundColor: [
            "rgba(var(--primary), 0.4)",
            "rgba(var(--primary), 0.7)",
            "rgba(var(--primary), 0.4)",
          ],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.4,
        }}
      />
    </div>
  );
};

export function PopupChatbot({
  systemPrompt = "Bạn là trợ lý AI hữu ích của Eduforge. Hãy trả lời câu hỏi một cách ngắn gọn và chính xác.",
  referenceText = "",
  title = "Trợ lý AI Eduforge",
  placeholder = "Hỏi điều gì đó...",
  buttonClassName,
  cardClassName,
  initialOpen = false,
  position = "bottom-right",
  suggestedQuestions,
  balloonText = "Eduforge AI",
}: PopupChatbotProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isFirstOpen, setIsFirstOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = useUserStore((state) => state.user);
  const userId = user?.id || "user";

  // Prepare initial messages with system prompt and reference text
  const initialMessages: { id: string; role: string; content: string }[] = [];

  // Add system prompt
  if (systemPrompt) {
    initialMessages.push({
      id: "system-1",
      role: "system",
      content: systemPrompt,
    });
  }

  // Add reference text as a system message if provided
  if (referenceText) {
    initialMessages.push({
      id: "system-2",
      role: "system",
      content: `Tham khảo thông tin sau để trả lời:\n${referenceText}`,
    });
  }

  // Use a custom implementation instead of useChat
  const [messages, setMessages] = useState<
    {
      role: string;
      content: string;
      id?: string;
      userId?: string;
      userImage?: string;
    }[]
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Chọn mảng suggested questions phù hợp
  const SUGGESTED_QUESTIONS =
    suggestedQuestions && suggestedQuestions.length > 0
      ? suggestedQuestions
      : DEFAULT_SUGGESTED_QUESTIONS;

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Add user message to the list
    const userMessage = {
      role: "user",
      content: input,
      id: Date.now().toString(),
      userId: userId,
      userImage: user?.image,
    };
    setMessages((prev) => [...prev, userMessage]);

    // Clear input
    setInput("");

    // Set loading state
    setIsLoading(true);

    try {
      // Prepare all messages including system messages
      const allMessages = [...initialMessages, ...messages, userMessage];

      // Call the API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: allMessages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      // Parse the response
      const data = await response.json();

      // Add assistant message to the list
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content, id: Date.now().toString() },
      ]);
    } catch (err) {
      console.error("Error calling chat API:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  // Log any errors for debugging
  useEffect(() => {
    if (error) {
      console.error("Chat API error:", error);
    }
  }, [error]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle suggested question click
  const handleSuggestedQuestionClick = (question: string) => {
    // Set the input value to the question
    handleInputChange({
      target: { value: question },
    } as React.ChangeEvent<HTMLTextAreaElement>);

    // Submit the form automatically after a short delay
    setTimeout(() => {
      const form = document.querySelector("form") as HTMLFormElement;
      if (form) {
        form.dispatchEvent(
          new Event("submit", { cancelable: true, bubbles: true }),
        );
      }
    }, 100);
  };

  // Filter out system messages for display
  const displayMessages = messages.filter(
    (message) => message.role !== "system",
  );

  // Determine position classes
  const positionClasses = {
    "bottom-right": "bottom-20 right-8",
    "bottom-left": "bottom-20 left-8",
    "top-right": "top-8 right-8",
    "top-left": "top-8 left-8",
  };

  // Khi popup được mở, đánh dấu là đã mở lần đầu
  useEffect(() => {
    if (isOpen && !isFirstOpen) {
      setIsFirstOpen(true);
    }
  }, [isOpen, isFirstOpen]);

  return (
    <>
      {/* Floating button to open the chatbot */}
      <motion.div
        className={cn(
          "fixed z-50",
          positionClasses[position],
          isOpen && "hidden",
        )}
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button
          onClick={() => setIsOpen(true)}
          className={cn(
            "bg-gradient-to-br from-primary to-primary/90 hover:bg-primary/90 rounded-full h-12 w-12 shadow-xl",
            buttonClassName,
          )}
          aria-label="Open AI chatbot"
          size="icon"
        >
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className="absolute inset-0 rounded-full bg-primary/20"
          />
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className="absolute inset-0 rounded-full border-2 border-primary-foreground/20"
          />
          <Bot className="h-7 w-7" />
        </Button>
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 1, duration: 0.3 }}
          className="absolute -top-10 right-0 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full shadow-md border border-primary/10 text-sm font-medium text-nowrap"
        >
          {balloonText}
          <div className="absolute -bottom-1.5 right-5 w-3 h-3 bg-white dark:bg-gray-800 border-r border-b border-primary/10 transform rotate-45"></div>
        </motion.div>
      </motion.div>

      {/* Chatbot popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={cn("fixed z-50", positionClasses[position])}
          >
            <Card
              className={cn(
                "w-80 sm:w-96 shadow-xl flex flex-col max-h-[500px] border-primary/10 rounded-xl overflow-hidden",
                cardClassName,
              )}
            >
              <CardHeader className="pb-2 border-b bg-gradient-to-r from-primary/5 to-primary/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Avatar className="h-8 w-8 bg-primary/10 border-2 border-primary/20">
                        <AvatarFallback className="text-primary">
                          <Bot size={16} />
                        </AvatarFallback>
                      </Avatar>
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-primary/30"
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-medium">
                        {title}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Powered by Gemini AI
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-primary/10"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="overflow-y-auto flex-grow p-4">
                <div className="space-y-4">
                  {displayMessages.length === 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <MessageAvatar role="assistant" />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          className="bg-gradient-to-br from-primary/5 to-primary/10 p-3 rounded-lg text-sm max-w-[85%] shadow-sm border border-primary/10"
                        >
                          <MarkdownRenderer content="Xin chào! Tôi là trợ lý AI của Eduforge. Bạn có thể hỏi tôi bất cứ điều gì." />
                        </motion.div>
                      </div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.3 }}
                        className="space-y-2 bg-gradient-to-br from-primary/5 to-primary/10 p-3 rounded-lg border border-primary/10 shadow-sm"
                      >
                        <p className="text-xs font-medium text-primary/80">
                          Gợi ý câu hỏi:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {SUGGESTED_QUESTIONS.map((question, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{
                                delay: 0.3 + idx * 0.1,
                                duration: 0.2,
                              }}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs py-1 h-auto border-primary/20 bg-white/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-200"
                                onClick={() =>
                                  handleSuggestedQuestionClick(question)
                                }
                              >
                                {question}
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    </div>
                  ) : (
                    displayMessages.map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-start gap-3"
                      >
                        <MessageAvatar
                          role={message.role}
                          userId={message.userId}
                          userImage={message.userImage}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          className={cn(
                            "p-3 rounded-lg max-w-[85%] shadow-sm border",
                            message.role === "user"
                              ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground border-primary/30"
                              : "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/10",
                          )}
                        >
                          <MarkdownRenderer
                            content={message.content}
                            className={
                              message.role === "user"
                                ? "text-primary-foreground"
                                : ""
                            }
                          />
                        </motion.div>
                      </motion.div>
                    ))
                  )}

                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3"
                    >
                      <MessageAvatar role="assistant" />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="bg-gradient-to-br from-primary/5 to-primary/10 p-3 rounded-lg flex items-center h-10 px-4 shadow-sm border border-primary/10"
                      >
                        <LoadingDots />
                      </motion.div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>

              <CardFooter className="pt-2 border-t p-4 bg-gradient-to-r from-primary/5 to-primary/10">
                <form
                  onSubmit={handleSubmit}
                  className="w-full flex gap-2 items-start"
                >
                  <Avatar className="w-8 h-8 mt-1">
                    <AvatarImage
                      src={
                        user?.image ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
                      }
                    />
                    <AvatarFallback>
                      {userId.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-white border rounded-2xl w-full min-w-[200px] max-w-full">
                      <div className="relative p-3">
                        <Textarea
                          value={input}
                          onChange={handleInputChange}
                          placeholder={placeholder}
                          className="min-h-[35px] max-h-[120px] border-0 focus-visible:ring-0 shadow-none resize-none rounded-lg p-0 placeholder:text-foreground/50 placeholder:text-sm"
                          disabled={isLoading}
                        />
                        <div className="absolute right-2 bottom-2 flex items-center gap-0.5">
                          <Button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            size="icon"
                            className={cn(
                              "h-7 w-7",
                              input.trim() && !isLoading
                                ? "bg-primary hover:bg-primary/90 hover:scale-105"
                                : "bg-primary/70",
                            )}
                          >
                            <Send className="h-4 w-4 text-white" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
