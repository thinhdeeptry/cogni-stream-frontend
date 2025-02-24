import { Question } from "@/types";

export const mockQuestions: Question[] = [
  {
    id: "q-001",
    type: "SINGLE_CHOICE",
    content: {
      text: "Giải phương trình: 2x + 5 = 13",
    },
    explanation: "Phương trình bậc nhất dạng ax + b = c",
    questionSetterId: "setter-001",
    courseId: "course-001",
    chapterId: "chapter-001",
    lessonId: "lesson-001",
    options: [
      {
        id: "opt-001",
        content: { text: "x = 4" },
        isCorrect: true,
        order: 1,
      },
      {
        id: "opt-002",
        content: { text: "x = 3" },
        isCorrect: false,
        order: 2,
      },
      {
        id: "opt-003",
        content: { text: "x = 5" },
        isCorrect: false,
        order: 3,
      },
    ],
  },
  {
    id: "q-002",
    type: "MULTIPLE_CHOICE",
    content: {
      text: "Chọn các phát biểu đúng về phương trình bậc hai ax² + bx + c = 0:",
    },
    explanation: "Các tính chất cơ bản của phương trình bậc hai",
    questionSetterId: "setter-001",
    courseId: "course-001",
    chapterId: "chapter-001",
    lessonId: "lesson-002",
    options: [
      {
        id: "opt-004",
        content: { text: "Có tối đa 2 nghiệm thực" },
        isCorrect: true,
        order: 1,
      },
      {
        id: "opt-005",
        content: { text: "Luôn có nghiệm" },
        isCorrect: false,
        order: 2,
      },
      {
        id: "opt-006",
        content: { text: "Đồ thị là một parabol" },
        isCorrect: true,
        order: 3,
      },
    ],
  },
  {
    id: "q-003",
    type: "TRUE_FALSE",
    content: {
      text: "Trong tam giác vuông, bình phương cạnh huyền bằng tổng bình phương hai cạnh góc vuông.",
    },
    explanation: "Định lý Pytago",
    questionSetterId: "setter-001",
    courseId: "course-001",
    chapterId: "chapter-002",
    lessonId: "lesson-004",
    options: [
      {
        id: "opt-007",
        content: { text: "Đúng" },
        isCorrect: true,
        order: 1,
      },
      {
        id: "opt-008",
        content: { text: "Sai" },
        isCorrect: false,
        order: 2,
      },
    ],
  },
  {
    id: "q-004",
    type: "ESSAY",
    content: {
      text: "Trình bày các bước giải một bài toán hình học về tam giác.",
    },
    explanation: "Phương pháp giải toán hình học",
    questionSetterId: "setter-001",
    courseId: "course-001",
    chapterId: "chapter-002",
    lessonId: "lesson-004",
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
    type: "MULTIPLE_CHOICE",
    content: {
      text: "Một vật chuyển động thẳng đều có:",
    },
    explanation: "Đặc điểm của chuyển động thẳng đều",
    questionSetterId: "setter-002",
    courseId: "course-002",
    chapterId: "chapter-003",
    lessonId: "lesson-007",
    options: [
      {
        id: "opt-009",
        content: { text: "Vận tốc không đổi" },
        isCorrect: true,
        order: 1,
      },
      {
        id: "opt-010",
        content: { text: "Gia tốc không đổi" },
        isCorrect: false,
        order: 2,
      },
      {
        id: "opt-011",
        content: { text: "Quãng đường tỷ lệ thuận với thời gian" },
        isCorrect: true,
        order: 3,
      },
    ],
  },
  {
    id: "q-006",
    type: "SINGLE_CHOICE",
    content: {
      text: "Choose the correct greeting for a formal business meeting:",
    },
    explanation: "Formal greetings in business context",
    questionSetterId: "setter-003",
    courseId: "course-003",
    chapterId: "chapter-005",
    lessonId: "lesson-012",
    options: [
      {
        id: "opt-012",
        content: { text: "Hey there!" },
        isCorrect: false,
        order: 1,
      },
      {
        id: "opt-013",
        content: { text: "Good morning, pleased to meet you" },
        isCorrect: true,
        order: 2,
      },
      {
        id: "opt-014",
        content: { text: "What's up?" },
        isCorrect: false,
        order: 3,
      },
    ],
  },
  {
    id: "q-007",
    type: "MULTIPLE_CHOICE",
    content: {
      text: "Which of the following are valid variable names in Python?",
    },
    explanation: "Python variable naming rules",
    questionSetterId: "setter-004",
    courseId: "course-004",
    chapterId: "chapter-007",
    lessonId: "lesson-017",
    options: [
      {
        id: "opt-015",
        content: { text: "my_variable" },
        isCorrect: true,
        order: 1,
      },
      {
        id: "opt-016",
        content: { text: "1variable" },
        isCorrect: false,
        order: 2,
      },
      {
        id: "opt-017",
        content: { text: "_hidden" },
        isCorrect: true,
        order: 3,
      },
    ],
  },
  {
    id: "q-008",
    type: "TRUE_FALSE",
    content: {
      text: "Ankan là hiđrocacbon no, mạch hở.",
    },
    explanation: "Định nghĩa về ankan",
    questionSetterId: "setter-005",
    courseId: "course-005",
    chapterId: "chapter-009",
    lessonId: "lesson-020",
    options: [
      {
        id: "opt-018",
        content: { text: "Đúng" },
        isCorrect: true,
        order: 1,
      },
      {
        id: "opt-019",
        content: { text: "Sai" },
        isCorrect: false,
        order: 2,
      },
    ],
  },
];
