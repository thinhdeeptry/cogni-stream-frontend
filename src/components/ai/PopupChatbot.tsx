"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Download,
  Maximize2,
  Minimize2,
  RotateCcw,
  Send,
  Smile,
  Trash2,
  User,
  X,
} from "lucide-react";

import useUserStore from "@/stores/useUserStore";

import {
  analyzeConversation,
  generateSmartSuggestions,
} from "@/utils/conversationAnalyzer";

import { ConversationStats } from "@/components/ai/ConversationStats";
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
  showBalloon?: boolean;
  welcomeMessage?: string;
  // New context-aware props
  userName?: string;
  courseName?: string;
  lessonName?: string;
  lessonOrder?: number;
  totalLessons?: number;
  chapterName?: string;
  // Student Lesson Context API - Enriched context for AI
  studentLessonContext?: {
    learnerLevel?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    needsEncouragement?: boolean;
    strugglingAreas?: string[];
    strongAreas?: string[];
    recommendedActions?: string[];
    contextSummary?: string;
    courseProgress?: number;
    quizInfo?: {
      highestScore?: number | null;
      isPassed?: boolean;
      totalAttempts?: number;
      canRetry?: boolean;
    };
  };
  // Syllabus Structure - Full learning path context
  syllabusStructure?: {
    currentDay: number;
    totalDays: number;
    // Progress statistics from backend
    completedSessions: number;
    completedLessons: number;
    sessionProgress: number; // 0-100 percentage
    lessonProgress: number; // 0-100 percentage
    lessons: Array<{
      id: string;
      title: string;
      type: "QUIZ" | "VIDEO" | "BLOG" | "MIXED";
      content?: string;
      chapterTitle?: string;
      order: number;
      estimatedDurationMinutes?: number;
      isCompleted: boolean;
      isCurrent: boolean;
    }>;
    liveSessions: Array<{
      id: string;
      topic: string;
      order: number;
      durationMinutes?: number;
      isCompleted: boolean;
    }>;
  };
}

// Suggested questions mặc định
const DEFAULT_SUGGESTED_QUESTIONS = [
  "Tóm tắt nội dung",
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
        className="h-2 w-2 bg-primary rounded-full"
        animate={{
          scale: [0.5, 1, 0.5],
          opacity: [0.3, 1, 0.3],
        }}
        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="h-2 w-2 bg-primary rounded-full"
        animate={{
          scale: [0.5, 1, 0.5],
          opacity: [0.3, 1, 0.3],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.2,
        }}
      />
      <motion.div
        className="h-2 w-2 bg-primary rounded-full"
        animate={{
          scale: [0.5, 1, 0.5],
          opacity: [0.3, 1, 0.3],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.4,
        }}
      />
    </div>
  );
};

export function PopupChatbot({
  systemPrompt = "Bạn là trợ lý AI hữu ích của cognistream. Hãy trả lời câu hỏi một cách ngắn gọn và chính xác.",
  referenceText = "",
  title = "Trợ lý AI cognistream",
  placeholder = "Hỏi điều gì đó...",
  buttonClassName,
  cardClassName,
  initialOpen = false,
  position = "bottom-right",
  suggestedQuestions,
  balloonText = "cognistream AI",
  showBalloon = true,
  welcomeMessage = "Xin chào! Tôi là trợ lý AI của cognistream. Bạn có thể hỏi tôi bất cứ điều gì.",
  userName,
  courseName,
  lessonName,
  lessonOrder,
  totalLessons,
  chapterName,
  studentLessonContext,
  syllabusStructure,
}: PopupChatbotProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isFirstOpen, setIsFirstOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = useUserStore((state) => state.user);
  const userId = user?.id || "user";

  // Create context-aware system prompt and welcome message
  const contextualSystemPrompt = useMemo(() => {
    let prompt = `Bạn là trợ lý AI học tập thông minh của CogniStream. Hãy tuân thủ các nguyên tắc sau:

🎯 PERSONALITY & TONE:
- Thân thiện, kiên nhẫn và khuyến khích
- Giọng điệu như một mentor giàu kinh nghiệm
- Tránh lặp lại câu trả lời, luôn đa dạng cách diễn đạt
- Nhận biết được context và không trả lời máy móc

💬 CONVERSATION AWARENESS:
- Luôn đọc và hiểu toàn bộ lịch sử conversation
- Đừng lặp lại thông tin đã nói trước đó
- Khi user nói "cảm ơn", hãy phản hồi ngắn gọn và hỏi thêm
- Nhận biết được khi user hài lòng vs khi cần hỗ trợ thêm
- Tránh giải thích lại những gì đã rõ ràng

🎓 EDUCATIONAL APPROACH:
- Ưu tiên hiểu sâu hơn là ghi nhớ
- Đưa ra ví dụ thực tế và có thể áp dụng
- Khuyến khích tư duy phản biện
- Điều chỉnh độ phức tạp theo phản hồi của user

📚 CONTENT STRATEGY:
- Khi user hỏi lại thông tin cũ, hãy mở rộng hoặc đưa góc nhìn mới
- Luôn kết nối với kiến thức đã học trước đó
- Đề xuất bước tiếp theo trong quá trình học
- Tạo momentum học tập tích cực`;

    // Add user context
    if (userName) {
      prompt = prompt.replace(/bạn/g, userName);
      prompt += `\n\n👤 USER CONTEXT:\nLuôn gọi người dùng bằng tên "${userName}" thay vì "bạn". Tạo connection cá nhân và nhớ preferences của ${userName} qua các cuộc hội thoại.`;
    }

    // Add student context enrichment from API
    if (studentLessonContext) {
      prompt += `\n\n📊 THÔNG TIN HỌC VIÊN (từ Student Context API):`;

      if (studentLessonContext.learnerLevel) {
        const levelDesc = {
          BEGINNER:
            "Người mới bắt đầu - cần giải thích chi tiết, tránh thuật ngữ phức tạp",
          INTERMEDIATE:
            "Trung cấp - có thể sử dụng thuật ngữ chuyên môn với giải thích ngắn",
          ADVANCED:
            "Nâng cao - tập trung vào ứng dụng sâu và các trường hợp đặc biệt",
        };
        prompt += `\n- Trình độ: ${levelDesc[studentLessonContext.learnerLevel]}`;
      }

      if (studentLessonContext.courseProgress !== undefined) {
        prompt += `\n- Tiến độ khóa học: ${studentLessonContext.courseProgress}%`;
      }

      if (studentLessonContext.contextSummary) {
        prompt += `\n- Tình trạng: ${studentLessonContext.contextSummary}`;
      }

      if (studentLessonContext.needsEncouragement) {
        prompt += `\n\n⚠️ HỖ TRỢ ĐẶC BIỆT: Học viên đang cần được khuyến khích và hỗ trợ tích cực. Hãy:\n- Động viên và nhấn mạnh những tiến bộ đã đạt được\n- Đưa ra lời khuyên cụ thể và khả thi\n- Tạo không khí tích cực và tin tưởng\n- Chia nhỏ vấn đề phức tạp thành các bước đơn giản`;
      }

      if (
        studentLessonContext.strugglingAreas &&
        studentLessonContext.strugglingAreas.length > 0
      ) {
        prompt += `\n\n❌ ĐIỂM YẾU cần chú ý:\n${studentLessonContext.strugglingAreas.map((area) => `- ${area}`).join("\n")}`;
      }

      if (
        studentLessonContext.strongAreas &&
        studentLessonContext.strongAreas.length > 0
      ) {
        prompt += `\n\n✅ ĐIỂM MẠNH có thể dựa vào:\n${studentLessonContext.strongAreas.map((area) => `- ${area}`).join("\n")}`;
      }

      if (
        studentLessonContext.recommendedActions &&
        studentLessonContext.recommendedActions.length > 0
      ) {
        prompt += `\n\n🎯 HÀNH ĐỘNG ĐỀ XUẤT:\n${studentLessonContext.recommendedActions.map((action) => `- ${action}`).join("\n")}`;
      }

      if (studentLessonContext.quizInfo) {
        const { isPassed, totalAttempts, highestScore, canRetry } =
          studentLessonContext.quizInfo;
        if (totalAttempts !== undefined && totalAttempts > 0) {
          prompt += `\n\n📝 THÔNG TIN QUIZ:\n- Đã làm: ${totalAttempts} lần${highestScore !== null ? `, điểm cao nhất: ${highestScore}` : ""}\n- Trạng thái: ${isPassed ? "✅ Đã đạt" : "⚠️ Chưa đạt"}${!isPassed && canRetry ? " (có thể làm lại)" : ""}`;
        }
      }
    }

    // Add syllabus structure - learning path context
    if (syllabusStructure) {
      const {
        lessons,
        liveSessions,
        currentDay,
        totalDays,
        completedSessions = liveSessions.filter((s) => s.isCompleted).length,
        completedLessons = lessons.filter((l) => l.isCompleted).length,
        sessionProgress = liveSessions.length > 0
          ? Math.round((completedSessions / liveSessions.length) * 100)
          : 0,
        lessonProgress = lessons.length > 0
          ? Math.round((completedLessons / lessons.length) * 100)
          : 0,
      } = syllabusStructure;

      const currentLessonIndex = lessons.findIndex((l) => l.isCurrent);
      const upcomingLessons = lessons
        .filter((l, idx) => idx > currentLessonIndex && !l.isCompleted)
        .slice(0, 3);
      const previousLessons = lessons
        .filter((l, idx) => idx < currentLessonIndex)
        .slice(-3);

      prompt += `\n\n📚 LỘ TRÌNH HỌC TẬP:`;
      prompt += `\n- Ngày học: ${currentDay}/${totalDays}`;
      prompt += `\n- Tổng số: ${lessons.length} bài lessons, ${liveSessions.length} buổi học trực tuyến`;
      prompt += `\n\n📊 TIẾN ĐỘ CHI TIẾT:`;
      prompt += `\n- Lessons: ${completedLessons}/${lessons.length} bài (${lessonProgress}%)`;
      prompt += `\n- Live Sessions: ${completedSessions}/${liveSessions.length} buổi (${sessionProgress}%)`;
      prompt += `\n- Tổng thể: ${Math.round(((completedLessons + completedSessions) / (lessons.length + liveSessions.length)) * 100)}%`;
      if (previousLessons.length > 0) {
        prompt += `\n\n📖 CÁC BÀI ĐÃ HỌC (trước bài hiện tại):`;
        previousLessons.forEach((lesson, idx) => {
          prompt += `\n${idx + 1}. "${lesson.title}" - ${lesson.type}`;
          if (lesson.chapterTitle) {
            prompt += ` (${lesson.chapterTitle})`;
          }
          // Include content summary if available for context
          if (lesson.content && lesson.content.length > 0) {
            const contentPreview = lesson.content
              .substring(0, 150)
              .replace(/\n/g, " ");
            prompt += `\n   Nội dung: ${contentPreview}${lesson.content.length > 150 ? "..." : ""}`;
          }
        });
        prompt += `\n\n💡 Sử dụng: Có thể tham chiếu đến các bài này khi giải thích hoặc ôn tập.`;
      }

      if (upcomingLessons.length > 0) {
        prompt += `\n\n🔜 CÁC BÀI SẮP HỌC (sau bài hiện tại):`;
        upcomingLessons.forEach((lesson, idx) => {
          prompt += `\n${idx + 1}. "${lesson.title}" - ${lesson.type}`;
          if (lesson.chapterTitle) {
            prompt += ` (${lesson.chapterTitle})`;
          }
          if (lesson.estimatedDurationMinutes) {
            prompt += ` - ${lesson.estimatedDurationMinutes} phút`;
          }
        });
        prompt += `\n\n💡 Sử dụng: Có thể gợi ý kiến thức cần chuẩn bị hoặc roadmap tiếp theo.`;
      }

      if (liveSessions.length > 0) {
        const completedSessions = liveSessions.filter((s) => s.isCompleted);
        prompt += `\n\n📹 BUỔI HỌC TRỰC TUYẾN:`;
        prompt += `\n- Đã tham gia: ${completedSessions.length}/${liveSessions.length} buổi`;
        liveSessions.forEach((session, idx) => {
          prompt += `\n${idx + 1}. "${session.topic}" ${session.isCompleted ? "✅" : "⏳"}`;
        });
      }

      // Add quiz milestones
      const quizLessons = lessons.filter((l) => l.type === "QUIZ");
      if (quizLessons.length > 0) {
        const passedQuizzes = quizLessons.filter((q) => q.isCompleted);
        prompt += `\n\n📝 CHECKPOINT QUIZ:`;
        prompt += `\n- Đã vượt qua: ${passedQuizzes.length}/${quizLessons.length} quiz`;
        quizLessons.forEach((quiz, idx) => {
          prompt += `\n${idx + 1}. "${quiz.title}" ${quiz.isCompleted ? "✅ Đã pass" : quiz.isCurrent ? "📍 Hiện tại" : "⏳ Chưa làm"}`;
        });
      }
    }

    // Add lesson context
    if (courseName || lessonName) {
      prompt += `\n\n📖 LEARNING CONTEXT:`;
      if (courseName) {
        prompt += `\n- Khóa học: ${courseName}`;
      }
      if (chapterName) {
        prompt += `\n- Chương: ${chapterName}`;
      }
      if (lessonName && lessonOrder && totalLessons) {
        prompt += `\n- Bài học: ${lessonName} (Bài ${lessonOrder}/${totalLessons})`;
        prompt += `\n- Tiến độ: ${Math.round((lessonOrder / totalLessons) * 100)}% khóa học`;
      } else if (lessonName) {
        prompt += `\n- Bài học: ${lessonName}`;
      }

      prompt += `\n\n🎯 CONTEXT USAGE:\n- Khi được hỏi về "khóa này", "bài này", "chương này", hiểu đúng context trên\n- Liên kết kiến thức với các bài trước/sau khi có thể\n- Đánh giá mức độ khó của bài trong tổng thể khóa học`;
    }

    // Add conversation intelligence
    prompt += `\n\n🧠 CONVERSATION INTELLIGENCE:
- Phân tích conversation history để hiểu learning journey của user
- Nhận biết pattern: user thích học theo cách nào, gặp khó khăn gì
- Tránh repeat thông tin, thay vào đó build upon previous answers
- Khi user nói "cảm ơn", response ngắn gọn + offer next step
- Response cho social cues như "thanks", "ok", "hiểu rồi" một cách tự nhiên`;

    return prompt;
  }, [
    systemPrompt,
    userName,
    courseName,
    lessonName,
    lessonOrder,
    totalLessons,
    chapterName,
    referenceText,
    studentLessonContext,
    syllabusStructure, // Add syllabusStructure as dependency
  ]);

  const [messages, setMessages] = useState<
    {
      role: string;
      content: string;
      id?: string;
      userId?: string;
      userImage?: string;
      timestamp?: number;
    }[]
  >([]);

  const contextualWelcomeMessage = useMemo(() => {
    // Check lesson type from reference text for contextual welcome
    const isQuizLesson = referenceText?.includes(
      "QUIZ LESSON - SPECIAL INSTRUCTIONS",
    );
    const hasVideoNoTranscript = referenceText?.includes(
      "Video Status: Video available but transcript not accessible",
    );
    const hasReadingContent = referenceText?.includes("Reading Content:");
    const hasVideoTranscript = referenceText?.includes("Video Transcript");

    if (userName) {
      let message = `Xin chào ${userName}! 👋 Mình là AI Assistant của CogniStream.`;

      if (lessonName && courseName) {
        if (isQuizLesson) {
          message += ` Mình thấy ${userName} đang chuẩn bị cho bài kiểm tra "${lessonName}" trong khóa "${courseName}".`;
          message += `\n\n🎯 **Lưu ý quan trọng**: Đây là bài kiểm tra, mình sẽ **không đưa ra đáp án trực tiếp** nhưng sẽ giúp ${userName} hiểu khái niệm và phát triển tư duy để tự giải quyết các câu hỏi!`;
        } else if (hasVideoNoTranscript) {
          message += ` ${userName} đang học bài video "${lessonName}" đúng không?`;
          message += `\n\n📹 **Về video**: Video có sẵn để xem nhưng mình không có transcript chi tiết. Tuy nhiên, dựa vào nội dung bài học và kiến thức chuyên môn, mình vẫn có thể hỗ trợ ${userName} giải thích khái niệm, trả lời câu hỏi và tạo bài tập ôn luyện!`;
        } else if (hasReadingContent) {
          message += ` ${userName} đang đọc bài "${lessonName}" trong khóa "${courseName}".`;
          message += `\n\n📚 **Bài đọc**: Mình đã đọc toàn bộ nội dung và có thể giúp ${userName} phân tích, tóm tắt, hoặc tạo câu hỏi ôn tập!`;
        } else if (hasVideoTranscript) {
          message += ` ${userName} đang xem video "${lessonName}" với đầy đủ transcript.`;
          message += `\n\n🎥 **Video có transcript**: Mình có thể tham chiếu đến từng phần cụ thể của video để hỗ trợ ${userName} tốt nhất!`;
        } else {
          message += ` Mình thấy ${userName} đang học bài "${lessonName}" trong khóa "${courseName}".`;
        }
      } else if (courseName) {
        message += ` ${userName} đang tham gia khóa học "${courseName}" đúng không?`;
      }

      message += `\n\nMình sẽ nhớ cuộc trò chuyện của chúng ta để hỗ trợ ${userName} tốt hơn! Hãy hỏi bất cứ điều gì nhé! 🚀`;
      return message;
    }
    return welcomeMessage;
  }, [welcomeMessage, userName, courseName, lessonName, referenceText]);

  // Create context-aware suggested questions with conversation analysis
  const contextualSuggestedQuestions = useMemo(() => {
    if (suggestedQuestions && suggestedQuestions.length > 0) {
      return suggestedQuestions;
    }

    // Initial questions for new conversations
    const getContextualQuestions = () => {
      // Check reference text for lesson type information
      const isQuizLesson = referenceText?.includes(
        "QUIZ LESSON - SPECIAL INSTRUCTIONS",
      );
      const hasVideoTranscript = referenceText?.includes("Video Transcript");
      const hasVideoNoTranscript = referenceText?.includes(
        "Video Status: Video available but transcript not accessible",
      );
      const hasReadingContent = referenceText?.includes("Reading Content:");

      if (isQuizLesson) {
        return [
          "Làm thế nào để ôn tập hiệu quả cho bài kiểm tra này?",
          "Những khái niệm nào cần nắm vững để làm tốt quiz?",
          "Chiến lược nào giúp tư duy logic khi làm bài?",
          "Cách quản lý thời gian khi làm bài kiểm tra?",
          "Làm sao để giảm căng thẳng khi thi?",
        ];
      }

      if (hasVideoNoTranscript) {
        return [
          "Video này về chủ đề gì chính?",
          "Hướng dẫn tôi cách ghi chú hiệu quả khi xem video",
          "Làm thế nào để tập trung khi học qua video?",
          "Cách ôn tập lại nội dung video vừa xem?",
          "Những điểm quan trọng cần chú ý trong video này?",
        ];
      }

      if (hasReadingContent) {
        return [
          `Tóm tắt nội dung bài "${lessonName}" này`,
          "Phân tích cấu trúc của bài đọc này",
          "Tạo mindmap cho các khái niệm chính",
          "Câu hỏi ôn tập cho bài đọc này",
          "Ví dụ thực tế về những gì đã học",
        ];
      }

      if (hasVideoTranscript) {
        return [
          `Video "${lessonName}" nói về những gì chính?`,
          "Phân tích timeline của video theo các mốc quan trọng",
          "Tóm tắt ý chính từng phần của video",
          "Tạo note-taking từ nội dung video",
          "Kiến thức này áp dụng như thế nào thực tế?",
        ];
      }

      // Default questions
      return [
        lessonName
          ? `Bài "${lessonName}" nói về gì chính?`
          : "Bài học này về chủ đề gì?",
        courseName
          ? `Tại sao cần học khóa "${courseName}"?`
          : "Tại sao cần học khóa này?",
        "Những khái niệm nào cần nắm vững?",
        "Kiến thức này ứng dụng như thế nào?",
        "Tôi cần chuẩn bị gì để học tốt?",
      ];
    };

    const defaultQuestions = getContextualQuestions();

    return defaultQuestions;
  }, [suggestedQuestions, courseName, lessonName]);

  // Prepare initial messages with enhanced system prompt and reference text
  const initialMessages: { id: string; role: string; content: string }[] = [];

  // Add enhanced system prompt
  if (contextualSystemPrompt) {
    initialMessages.push({
      id: "system-1",
      role: "system",
      content: contextualSystemPrompt,
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

  // Generate unique conversation ID based on lesson/course context
  const conversationId = useMemo(() => {
    // Create a unique ID based on context to maintain separate conversations per lesson
    const contextParts = [
      userId,
      courseName?.replace(/\s+/g, "-"),
      lessonName?.replace(/\s+/g, "-"),
      lessonOrder?.toString(),
    ].filter(Boolean);
    return `chat-${contextParts.join("-")}`;
  }, [userId, courseName, lessonName, lessonOrder]);

  // Use a custom implementation instead of useChat with localStorage persistence

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load conversation history from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined" && conversationId) {
      try {
        const savedMessages = localStorage.getItem(conversationId);
        if (savedMessages) {
          const parsed = JSON.parse(savedMessages);
          // Only load messages that are less than 24 hours old
          const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
          const recentMessages = parsed.filter(
            (msg: any) => !msg.timestamp || msg.timestamp > twentyFourHoursAgo,
          );

          if (recentMessages.length > 0) {
            setMessages(recentMessages);
            console.log(
              `💾 Loaded ${recentMessages.length} messages from conversation history`,
            );
          }
        }
      } catch (error) {
        console.error("Error loading conversation history:", error);
      }
    }
  }, [conversationId]);

  // Save conversation history to localStorage whenever messages change
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      conversationId &&
      messages.length > 0
    ) {
      try {
        // Keep only the last 50 messages to prevent localStorage bloat
        const messagesToSave = messages.slice(-50).map((msg) => ({
          ...msg,
          timestamp: msg.timestamp || Date.now(),
        }));

        localStorage.setItem(conversationId, JSON.stringify(messagesToSave));
        console.log(
          `💾 Saved ${messagesToSave.length} messages to conversation history`,
        );
      } catch (error) {
        console.error("Error saving conversation history:", error);
      }
    }
  }, [messages, conversationId]);

  // Enhanced suggested questions with conversation analysis
  const enhancedSuggestedQuestions = useMemo(() => {
    // If we have basic questions, start with those
    if (
      contextualSuggestedQuestions &&
      contextualSuggestedQuestions.length > 0
    ) {
      // Check if we have ongoing conversation for smart suggestions
      const hasConversation =
        messages.filter((m) => m.role !== "system").length > 0;

      if (hasConversation) {
        // Analyze conversation to provide smart suggestions
        const analysis = analyzeConversation(messages);
        const smartSuggestions = generateSmartSuggestions(analysis, {
          courseName,
          lessonName,
        });

        if (smartSuggestions.length > 0) {
          return smartSuggestions;
        }

        // Enhanced context-aware advanced questions
        const getAdvancedQuestions = () => {
          const isQuizLesson = referenceText?.includes(
            "QUIZ LESSON - SPECIAL INSTRUCTIONS",
          );
          const hasVideoNoTranscript = referenceText?.includes(
            "Video Status: Video available but transcript not accessible",
          );
          const hasReadingContent = referenceText?.includes("Reading Content:");

          // Get learner level from student context
          const learnerLevel =
            studentLessonContext?.learnerLevel || "INTERMEDIATE";

          // Get syllabus progress info
          const lessonProgress = syllabusStructure?.lessonProgress || 0;
          const hasUpcomingQuiz = syllabusStructure?.lessons
            ?.slice(
              syllabusStructure.lessons.findIndex((l) => l.isCurrent) + 1,
              syllabusStructure.lessons.findIndex((l) => l.isCurrent) + 4,
            )
            ?.some((l) => l.type === "QUIZ");

          // Quiz preparation questions
          if (isQuizLesson) {
            const baseQuestions = [
              "Những khái niệm nào quan trọng nhất cho quiz này?",
              "Tạo bộ câu hỏi ôn tập cho tôi",
              "Chiến lược làm bài hiệu quả là gì?",
            ];

            if (learnerLevel === "BEGINNER") {
              return [
                ...baseQuestions,
                "Giải thích từng bước cách chuẩn bị quiz",
                "Những điểm cơ bản cần nắm vững là gì?",
              ];
            } else if (learnerLevel === "ADVANCED") {
              return [
                ...baseQuestions,
                "Những case đặc biệt hoặc edge cases cần chú ý?",
                "Cách tối ưu thời gian làm bài?",
              ];
            }
            return baseQuestions.concat([
              "Phần nào tôi nên ôn kỹ hơn?",
              "Tự đánh giá độ hiểu biết của tôi",
            ]);
          }

          // Video without transcript
          if (hasVideoNoTranscript) {
            return [
              "Hướng dẫn ghi chú hiệu quả từ video này",
              "Những điểm mấu chốt cần ghi nhớ?",
              "Tạo outline cho nội dung video",
              learnerLevel === "BEGINNER"
                ? "Giải thích đơn giản nhất về chủ đề này"
                : "Phân tích sâu các khái niệm trong video",
              hasUpcomingQuiz
                ? "Nội dung nào sẽ có trong quiz sắp tới?"
                : "Làm sao áp dụng kiến thức này?",
            ];
          }

          // Reading content
          if (hasReadingContent) {
            const progressBasedQuestion =
              lessonProgress < 30
                ? "Kiến thức này liên hệ với mục tiêu khóa học như thế nào?"
                : lessonProgress < 70
                  ? "Kết nối với các bài đã học trước đó"
                  : "Tổng hợp toàn bộ kiến thức đã học";

            return [
              "Tóm tắt ý chính bằng mindmap",
              learnerLevel === "BEGINNER"
                ? "Giải thích bằng ngôn ngữ đơn giản và ví dụ cụ thể"
                : "Phân tích chi tiết và ứng dụng thực tế",
              progressBasedQuestion,
              "Tạo flashcards để ghi nhớ",
              hasUpcomingQuiz
                ? "Quiz sắp tới sẽ hỏi những gì từ bài này?"
                : "Bài tập thực hành để củng cố kiến thức",
            ];
          }

          // Live session or general content
          const isLiveSession =
            !isQuizLesson && !hasVideoNoTranscript && !hasReadingContent;
          if (isLiveSession) {
            return [
              "Tổng kết những gì đã học trong buổi này",
              "Câu hỏi nào cần làm rõ thêm?",
              "Chuẩn bị gì cho buổi học tiếp theo?",
              "Kế hoạch thực hành sau buổi học",
              "Ghi chú quan trọng từ session này",
            ];
          }

          // Default advanced questions with context awareness
          const defaultQuestions = [];

          if (learnerLevel === "BEGINNER") {
            defaultQuestions.push(
              "Giải thích chi tiết với ví dụ đơn giản",
              "Các thuật ngữ cần hiểu trong bài này",
            );
          } else if (learnerLevel === "ADVANCED") {
            defaultQuestions.push(
              "Phân tích case study phức tạp",
              "So sánh với best practices trong ngành",
            );
          }

          // Add progress-based questions
          if (lessonProgress < 30) {
            defaultQuestions.push("Tổng quan lộ trình và mục tiêu học tập");
          } else if (lessonProgress > 70) {
            defaultQuestions.push("Ôn tập tổng hợp toàn khóa học");
          }

          // Add quiz preparation if upcoming
          if (hasUpcomingQuiz) {
            defaultQuestions.push("Chuẩn bị gì cho quiz sắp tới?");
          }

          // Fill remaining slots
          defaultQuestions.push(
            "Ví dụ thực tế trong công việc",
            "Bài tập để thực hành ngay",
          );

          return defaultQuestions.slice(0, 5);
        };

        return getAdvancedQuestions();
      }

      return contextualSuggestedQuestions;
    }

    return contextualSuggestedQuestions;
  }, [
    contextualSuggestedQuestions,
    messages,
    courseName,
    lessonName,
    referenceText,
    studentLessonContext,
    syllabusStructure,
  ]);

  // Chọn mảng suggested questions phù hợp
  const SUGGESTED_QUESTIONS = enhancedSuggestedQuestions;

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // Handle input key press for Enter submission
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter, but allow Shift+Enter for new lines
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.dispatchEvent(
          new Event("submit", { cancelable: true, bubbles: true }),
        );
      }
    }
  };

  // Handle form submission with enhanced conversation analysis
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
      timestamp: Date.now(),
    };

    // Analyze conversation to understand user better
    const currentMessages = [...messages, userMessage];
    const conversationAnalysis = analyzeConversation(currentMessages);

    // Generate enhanced system prompt based on analysis
    let enhancedSystemPrompt = contextualSystemPrompt;

    if (conversationAnalysis.lastIntent === "thanks") {
      enhancedSystemPrompt += `\n\n🎯 CURRENT SITUATION: User vừa cảm ơn. Hãy response ngắn gọn, tự nhiên và offer next step hoặc hỏi xem cần hỗ trợ gì thêm. ĐỪNG lặp lại thông tin đã nói.`;
    } else if (conversationAnalysis.lastIntent === "confusion") {
      enhancedSystemPrompt += `\n\n🎯 CURRENT SITUATION: User đang confused. Hãy giải thích bằng cách khác đơn giản hơn, sử dụng ví dụ cụ thể và chia nhỏ thành steps.`;
    } else if (conversationAnalysis.lastIntent === "request_example") {
      enhancedSystemPrompt += `\n\n🎯 CURRENT SITUATION: User cần ví dụ. Hãy đưa ra ví dụ thực tế, cụ thể và có thể áp dụng ngay.`;
    }

    if (conversationAnalysis.userLearningStyle !== "unknown") {
      enhancedSystemPrompt += `\n\n📊 USER LEARNING STYLE: ${conversationAnalysis.userLearningStyle}. Hãy adapt teaching approach cho phù hợp.`;
    }

    if (conversationAnalysis.learningChallenges.length > 0) {
      enhancedSystemPrompt += `\n\n⚠️ LEARNING CHALLENGES: User đang gặp khó khăn với: ${conversationAnalysis.learningChallenges.join(", ")}. Hãy address những điểm này.`;
    }

    setMessages((prev) => [...prev, userMessage]);

    // Clear input
    setInput("");

    // Set loading state
    setIsLoading(true);

    try {
      // Prepare enhanced system messages
      const enhancedInitialMessages = [
        {
          id: "system-1",
          role: "system",
          content: enhancedSystemPrompt,
        },
        ...(referenceText
          ? [
              {
                id: "system-2",
                role: "system",
                content: `Tham khảo thông tin sau để trả lời:\n${referenceText}`,
              },
            ]
          : []),
      ];

      // Prepare all messages including enhanced system messages
      const allMessages = [
        ...enhancedInitialMessages,
        ...messages,
        userMessage,
      ];

      // Call the API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: allMessages,
          temperature: 0.7,
          max_tokens: 5000,
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
        {
          role: "assistant",
          content: data.content,
          id: Date.now().toString(),
          timestamp: Date.now(),
        },
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
    setInput(question);

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

  // Clear conversation history
  const clearConversation = () => {
    setMessages([]);
    if (typeof window !== "undefined" && conversationId) {
      localStorage.removeItem(conversationId);
      console.log("🗑️ Cleared conversation history");
    }
  };

  // Export conversation history
  const exportConversation = () => {
    if (messages.length === 0) return;

    const conversationText = messages
      .filter((msg) => msg.role !== "system")
      .map((msg) => {
        const timestamp = msg.timestamp
          ? new Date(msg.timestamp).toLocaleString("vi-VN")
          : "";
        const role = msg.role === "user" ? userName || "User" : "AI Assistant";
        return `[${timestamp}] ${role}: ${msg.content}`;
      })
      .join("\n\n");

    const blob = new Blob([conversationText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversation-${conversationId}-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
            "bg-primary hover:bg-primary/90 rounded-full h-12 w-12 shadow-md",
            buttonClassName,
          )}
          aria-label="Open AI chatbot"
          size="icon"
        >
          <Bot className="h-6 w-6" />
        </Button>
        {showBalloon && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 1, duration: 0.3 }}
            className="absolute -top-10 right-0 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm text-sm font-medium text-nowrap"
          >
            {balloonText}
            <div className="absolute -bottom-1.5 right-5 w-2.5 h-2.5 bg-white dark:bg-slate-800 rotate-45"></div>
          </motion.div>
        )}
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
                "shadow-lg border flex flex-col bg-zinc-50 dark:bg-slate-900  rounded-2xl overflow-hidden",
                isExpanded
                  ? "w-[550px] sm:w-[650px] max-h-[650px]"
                  : "w-80 sm:w-96 max-h-[500px]",
                "transition-all duration-300",
                cardClassName,
              )}
            >
              <CardHeader className="pb-2 border-b bg-white dark:bg-slate-900 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Avatar className="h-8 w-8 bg-primary/5">
                        <AvatarFallback className="text-primary">
                          <Bot size={16} />
                        </AvatarFallback>
                      </Avatar>
                      {messages.length > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                        >
                          {messages.filter((m) => m.role !== "system").length}
                        </motion.div>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base font-medium">
                        {title}
                      </CardTitle>
                      {messages.length > 0 && (
                        <p className="text-xs text-gray-500">
                          {messages.filter((m) => m.role !== "system").length}{" "}
                          tin nhắn
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Export conversation button */}
                    {messages.length > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
                        onClick={exportConversation}
                        title="Xuất cuộc hội thoại"
                      >
                        <Download size={14} />
                      </Button>
                    )}

                    {/* Clear conversation button */}
                    {messages.length > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-red-600 hover:text-red-700"
                        onClick={clearConversation}
                        title="Xóa cuộc hội thoại"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
                      onClick={() => setIsExpanded(!isExpanded)}
                      title={isExpanded ? "Thu nhỏ" : "Mở rộng"}
                    >
                      {isExpanded ? (
                        <Minimize2 size={14} />
                      ) : (
                        <Maximize2 size={14} />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="overflow-y-auto flex-grow p-4 bg-gray-100/60 dark:bg-slate-950">
                <div className="space-y-4">
                  {/* Conversation Statistics */}
                  <ConversationStats
                    messages={messages}
                    conversationId={conversationId}
                    userName={userName}
                    courseName={courseName}
                    lessonName={lessonName}
                    lessonOrder={lessonOrder}
                    totalLessons={totalLessons}
                    chapterName={chapterName}
                  />

                  {displayMessages.length === 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <MessageAvatar role="assistant" />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          className="bg-white dark:bg-slate-900 p-3 rounded-xl text-sm max-w-[85%] shadow-sm"
                        >
                          <MarkdownRenderer
                            content={contextualWelcomeMessage}
                          />
                        </motion.div>
                      </div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.3 }}
                        className="space-y-2 bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm"
                      >
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
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
                                className="text-xs py-1 h-auto border-gray-200 dark:border-gray-700 bg-transparent hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-primary transition-all duration-200"
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
                            "p-3 rounded-xl max-w-[85%] shadow-sm",
                            message.role === "user"
                              ? "bg-primary text-white"
                              : "bg-white dark:bg-slate-900",
                          )}
                        >
                          <MarkdownRenderer
                            content={message.content}
                            className={
                              message.role === "user"
                                ? "text-white prose-headings:text-white prose-p:text-white prose-strong:text-white prose-a:text-white/90 prose-code:bg-primary-foreground/20 prose-code:text-white"
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
                        className="bg-white dark:bg-slate-900 p-3 rounded-xl flex items-center h-8 px-4 shadow-sm"
                      >
                        <LoadingDots />
                      </motion.div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>

              <CardFooter className="border-t p-3 bg-white dark:bg-slate-900">
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
                    <div className="bg-gray-100 dark:bg-slate-800 rounded-2xl w-full min-w-[200px] max-w-full">
                      <div className="relative p-3  ">
                        <Textarea
                          value={input}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyPress}
                          placeholder={placeholder}
                          className="min-h-[35px] max-h-[120px] border-0 focus-visible:ring-0 shadow-none resize-none rounded-lg p-0 placeholder:text-gray-400 placeholder:text-sm bg-transparent"
                          disabled={isLoading}
                        />
                        <div className="absolute right-2 bottom-2 flex items-center gap-0.5">
                          <Button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            size="icon"
                            className={cn(
                              "h-7 w-7 rounded-full",
                              input.trim() && !isLoading
                                ? "bg-primary hover:bg-primary/90"
                                : "bg-gray-300 dark:bg-gray-600",
                            )}
                          >
                            <Send className="h-3 w-3 mr-1/2 text-white" />
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
