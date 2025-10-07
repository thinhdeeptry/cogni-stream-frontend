"use client";

import { useState } from "react";

import { Copy, Play } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TestPrompt {
  id: string;
  category: string;
  title: string;
  prompt: string;
  expected: string;
  difficulty: "easy" | "medium" | "hard";
}

const TEST_PROMPTS: TestPrompt[] = [
  {
    id: "1",
    category: "Context Recognition",
    title: "Personal Greeting Test",
    prompt:
      "Chào bạn! Tôi tên là Nam. Cho tôi biết hiện tại tôi đang học bài gì?",
    expected: "AI sẽ gọi 'Chào Nam' và nói về bài học hiện tại",
    difficulty: "easy",
  },
  {
    id: "2",
    category: "Course Understanding",
    title: "Course Overview",
    prompt: "Khóa học này dạy những gì vậy? Tổng quan cho tôi biết nhé",
    expected: "AI sẽ tóm tắt course title, description và learning outcomes",
    difficulty: "easy",
  },
  {
    id: "3",
    category: "Progress Tracking",
    title: "Learning Progress",
    prompt: "Tôi đã học được bao nhiêu phần trăm của khóa học rồi?",
    expected: "AI sẽ dựa vào progress store để trả lời",
    difficulty: "medium",
  },
  {
    id: "4",
    category: "Video Analysis",
    title: "Video Summary",
    prompt: "Video bài học này nói về điều gì chính? Tóm tắt giúp tôi",
    expected: "AI sẽ dựa vào video transcript để tóm tắt",
    difficulty: "medium",
  },
  {
    id: "5",
    category: "Learning Support",
    title: "Practice Questions",
    prompt: "Tạo cho tôi 3 câu hỏi ôn tập cho bài học này",
    expected: "AI sẽ tạo câu hỏi dựa trên lesson content",
    difficulty: "medium",
  },
  {
    id: "6",
    category: "Advanced Context",
    title: "Cross-Lesson Analysis",
    prompt:
      "Bài học trước đó có liên quan gì đến bài này không? So sánh giúp tôi",
    expected: "AI sẽ phân tích mối liên hệ giữa các lessons",
    difficulty: "hard",
  },
  {
    id: "7",
    category: "Personalization",
    title: "Learning Style Adaptation",
    prompt:
      "Tôi học kiểu visual learner, có cách nào học bài này hiệu quả hơn không?",
    expected: "AI sẽ đưa ra lời khuyên phù hợp với learning style",
    difficulty: "hard",
  },
  {
    id: "8",
    category: "Fun & Creative",
    title: "Gamification",
    prompt:
      "Biến bài học này thành một trò chơi để tôi học vui hơn được không?",
    expected: "AI sẽ tạo game mechanics cho việc học",
    difficulty: "hard",
  },
  {
    id: "9",
    category: "Technical",
    title: "Error Prevention",
    prompt: "Những lỗi phổ biến nào học viên thường mắc phải ở bài này?",
    expected: "AI sẽ dựa vào experience để đưa ra common mistakes",
    difficulty: "medium",
  },
  {
    id: "10",
    category: "Motivation",
    title: "Learning Encouragement",
    prompt: "Tôi cảm thấy nản, động viên tôi tiếp tục học nhé",
    expected: "AI sẽ đưa ra động lực phù hợp với progress và context",
    difficulty: "easy",
  },
];

const difficultyColors = {
  easy: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  hard: "bg-red-100 text-red-800",
};

export default function AITestPrompts() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    "all",
    ...Array.from(new Set(TEST_PROMPTS.map((p) => p.category))),
  ];

  const filteredPrompts =
    selectedCategory === "all"
      ? TEST_PROMPTS
      : TEST_PROMPTS.filter((p) => p.category === selectedCategory);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Đã copy prompt!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-4">
          🤖 AI Chatbot Test Prompts
        </h1>
        <p className="text-gray-600 mb-6">
          Test các tính năng cá nhân hóa và context awareness của AI chatbot.
          Click vào prompt để copy và paste vào chatbot.
        </p>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={
                selectedCategory === category
                  ? "bg-orange-500 hover:bg-orange-600"
                  : ""
              }
            >
              {category === "all" ? "Tất cả" : category}
            </Button>
          ))}
        </div>
      </div>

      {/* Test Prompts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPrompts.map((prompt) => (
          <Card key={prompt.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{prompt.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {prompt.category}
                    </Badge>
                    <Badge
                      className={`text-xs ${difficultyColors[prompt.difficulty]}`}
                    >
                      {prompt.difficulty.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {/* Prompt Text */}
                <div className="relative">
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="text-sm font-medium text-gray-800 mb-2">
                      📝 Prompt:
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      {prompt.prompt}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 h-8 w-8 p-0"
                    onClick={() => copyToClipboard(prompt.prompt, prompt.id)}
                  >
                    {copiedId === prompt.id ? (
                      <span className="text-green-500">✓</span>
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>

                {/* Expected Result */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-800 mb-1">
                    🎯 Kết quả mong đợi:
                  </p>
                  <p className="text-blue-700 text-sm">{prompt.expected}</p>
                </div>

                {/* Quick Test Button */}
                <Button
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
                  onClick={() => {
                    copyToClipboard(prompt.prompt, prompt.id);
                    // You could also trigger opening the chatbot here if needed
                  }}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Copy & Test
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Instructions */}
      <Card className="mt-8 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-800">📋 Hướng dẫn Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-orange-700">
            <p>
              <strong>1.</strong> Chọn một prompt từ danh sách trên
            </p>
            <p>
              <strong>2.</strong> Click "Copy & Test" để copy prompt
            </p>
            <p>
              <strong>3.</strong> Mở AI chatbot trong trang lesson
            </p>
            <p>
              <strong>4.</strong> Paste prompt và gửi tin nhắn
            </p>
            <p>
              <strong>5.</strong> So sánh kết quả thực tế với kết quả mong đợi
            </p>
            <p>
              <strong>6.</strong> Ghi chú những gì hoạt động tốt và cần cải
              thiện
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Tips */}
      <Card className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">
            💡 Tips cho Advanced Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-blue-700 text-sm">
            <p>• Test với user có tên khác nhau để kiểm tra personalization</p>
            <p>• Thử với lesson types khác nhau (video, blog, quiz)</p>
            <p>• Test conversation nhiều lượt để kiểm tra memory</p>
            <p>
              • Kiểm tra AI có "hallucinate" thông tin không có trong context
            </p>
            <p>• Test với lessons có và không có video transcript</p>
            <p>• Thử các edge cases như empty content hoặc very long content</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
