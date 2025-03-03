import { Question, QuestionDifficulty, QuestionType } from "@/types";

// Mock data with Question type augmented to include id
export interface MockQuestion extends Question {
  id: string;
}

export const mockQuestions: MockQuestion[] = [
  {
    id: "q-001",
    type: QuestionType.SINGLE_CHOICE,
    content: {
      text: "Giải phương trình: 2x + 5 = 13",
    },
    explanation: "Phương trình bậc nhất dạng ax + b = c",
    questionSetterId: "setter-001",
    courseId: "course-001",
    chapterId: "chapter-001",
    lessonId: "lesson-001",
    difficulty: QuestionDifficulty.UNDERSTANDING,
    options: [
      {
        content: { text: "x = 4" },
        isCorrect: true,
        order: 1,
      },
      {
        content: { text: "x = 3" },
        isCorrect: false,
        order: 2,
      },
      {
        content: { text: "x = 5" },
        isCorrect: false,
        order: 3,
      },
    ],
  },
  {
    id: "q-002",
    type: QuestionType.MULTIPLE_CHOICE,
    content: {
      text: "Chọn các phát biểu đúng về phương trình bậc hai ax² + bx + c = 0:",
    },
    explanation: "Các tính chất cơ bản của phương trình bậc hai",
    questionSetterId: "setter-001",
    courseId: "course-001",
    chapterId: "chapter-001",
    lessonId: "lesson-002",
    difficulty: QuestionDifficulty.APPLYING,
    options: [
      {
        content: { text: "Có tối đa 2 nghiệm thực" },
        isCorrect: true,
        order: 1,
      },
      {
        content: { text: "Luôn có nghiệm" },
        isCorrect: false,
        order: 2,
      },
      {
        content: { text: "Đồ thị là một parabol" },
        isCorrect: true,
        order: 3,
      },
    ],
  },
  {
    id: "q-003",
    type: QuestionType.TRUE_FALSE,
    content: {
      text: "Phương trình 2x + 1 = 0 có nghiệm là x = -1/2",
    },
    explanation: "Định lý Pytago",
    questionSetterId: "setter-001",
    courseId: "course-001",
    chapterId: "chapter-002",
    lessonId: "lesson-004",
    difficulty: QuestionDifficulty.REMEMBERING,
    options: [
      {
        content: { text: "Đúng" },
        isCorrect: true,
        order: 1,
      },
      {
        content: { text: "Sai" },
        isCorrect: false,
        order: 2,
      },
    ],
  },
  {
    id: "q-004",
    type: QuestionType.ESSAY,
    content: {
      text: "Trình bày phương pháp giải phương trình bậc hai ax² + bx + c = 0",
    },
    explanation: "Phương pháp giải toán hình học",
    questionSetterId: "setter-001",
    courseId: "course-001",
    chapterId: "chapter-002",
    lessonId: "lesson-005",
    difficulty: QuestionDifficulty.EVALUATING,
    referenceAnswer: {
      content: {
        text: "1. Vẽ hình và ghi dữ kiện\n2. Phân tích dữ kiện\n3. Lập kế hoạch giải\n4. Thực hiện từng bước\n5. Kiểm tra kết quả",
      },
      notes:
        "Đây là phương pháp chung, cần điều chỉnh theo từng bài toán cụ thể",
    },
  },
  {
    id: "q-005",
    type: QuestionType.MULTIPLE_CHOICE,
    content: {
      text: "Một vật chuyển động thẳng đều có:",
    },
    explanation: "Đặc điểm của chuyển động thẳng đều",
    questionSetterId: "setter-002",
    courseId: "course-002",
    chapterId: "chapter-003",
    lessonId: "lesson-007",
    difficulty: QuestionDifficulty.ANALYZING,
    options: [
      {
        content: { text: "Vận tốc không đổi" },
        isCorrect: true,
        order: 1,
      },
      {
        content: { text: "Gia tốc không đổi" },
        isCorrect: false,
        order: 2,
      },
      {
        content: { text: "Quãng đường tỷ lệ thuận với thời gian" },
        isCorrect: true,
        order: 3,
      },
    ],
  },
  {
    id: "q-006",
    type: QuestionType.SINGLE_CHOICE,
    content: {
      text: "Choose the correct greeting for a formal business meeting:",
    },
    explanation: "Formal greetings in business context",
    questionSetterId: "setter-003",
    courseId: "course-003",
    chapterId: "chapter-005",
    lessonId: "lesson-012",
    difficulty: QuestionDifficulty.APPLYING,
    options: [
      {
        content: { text: "Hey there!" },
        isCorrect: false,
        order: 1,
      },
      {
        content: { text: "Good morning, pleased to meet you" },
        isCorrect: true,
        order: 2,
      },
      {
        content: { text: "What's up?" },
        isCorrect: false,
        order: 3,
      },
    ],
  },
  {
    id: "q-007",
    type: QuestionType.MULTIPLE_CHOICE,
    content: {
      text: "Đâu là tên biến hợp lệ trong JavaScript?",
    },
    explanation: "Python variable naming rules",
    questionSetterId: "setter-004",
    courseId: "course-003",
    chapterId: "chapter-005",
    lessonId: "lesson-013",
    difficulty: QuestionDifficulty.UNDERSTANDING,
    options: [
      {
        content: { text: "my_variable" },
        isCorrect: true,
        order: 1,
      },
      {
        content: { text: "1variable" },
        isCorrect: false,
        order: 2,
      },
      {
        content: { text: "_hidden" },
        isCorrect: true,
        order: 3,
      },
    ],
  },
  {
    id: "q-008",
    type: QuestionType.TRUE_FALSE,
    content: {
      text: "HTML là ngôn ngữ lập trình",
    },
    explanation: "Định nghĩa về ankan",
    questionSetterId: "setter-004",
    courseId: "course-003",
    chapterId: "chapter-006",
    lessonId: "lesson-015",
    difficulty: QuestionDifficulty.CREATING,
    options: [
      {
        content: { text: "Đúng" },
        isCorrect: true,
        order: 1,
      },
      {
        content: { text: "Sai" },
        isCorrect: false,
        order: 2,
      },
    ],
  },
];
