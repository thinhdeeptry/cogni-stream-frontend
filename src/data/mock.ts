import { Course } from "@/types/assessment/types";

export const mockCourses: Course[] = [
  {
    id: "course-001",
    name: "Toán học cơ bản",
    chapters: [
      {
        id: "chapter-001",
        name: "Đại số",
        lessons: [
          {
            id: "lesson-001",
            name: "Phương trình bậc nhất",
          },
          {
            id: "lesson-002",
            name: "Phương trình bậc hai",
          },
          {
            id: "lesson-003",
            name: "Bất phương trình",
          },
        ],
      },
      {
        id: "chapter-002",
        name: "Hình học",
        lessons: [
          {
            id: "lesson-004",
            name: "Tam giác",
          },
          {
            id: "lesson-005",
            name: "Tứ giác",
          },
          {
            id: "lesson-006",
            name: "Đường tròn",
          },
        ],
      },
    ],
  },
  {
    id: "course-002",
    name: "Vật lý 10",
    chapters: [
      {
        id: "chapter-003",
        name: "Động học chất điểm",
        lessons: [
          {
            id: "lesson-007",
            name: "Chuyển động thẳng đều",
          },
          {
            id: "lesson-008",
            name: "Chuyển động thẳng biến đổi đều",
          },
          {
            id: "lesson-009",
            name: "Sự rơi tự do",
          },
        ],
      },
      {
        id: "chapter-004",
        name: "Động lực học chất điểm",
        lessons: [
          {
            id: "lesson-010",
            name: "Các định luật Newton",
          },
          {
            id: "lesson-011",
            name: "Lực ma sát",
          },
        ],
      },
    ],
  },
  {
    id: "course-003",
    name: "Tiếng Anh giao tiếp",
    chapters: [
      {
        id: "chapter-005",
        name: "Chào hỏi và giới thiệu",
        lessons: [
          {
            id: "lesson-012",
            name: "Chào hỏi cơ bản",
          },
          {
            id: "lesson-013",
            name: "Giới thiệu bản thân",
          },
        ],
      },
      {
        id: "chapter-006",
        name: "Cuộc sống hàng ngày",
        lessons: [
          {
            id: "lesson-014",
            name: "Hoạt động hàng ngày",
          },
          {
            id: "lesson-015",
            name: "Sở thích và thói quen",
          },
        ],
      },
    ],
  },
  {
    id: "course-004",
    name: "Lập trình Python cơ bản",
    chapters: [
      {
        id: "chapter-007",
        name: "Giới thiệu Python",
        lessons: [
          {
            id: "lesson-016",
            name: "Cài đặt môi trường",
          },
          {
            id: "lesson-017",
            name: "Biến và kiểu dữ liệu",
          },
        ],
      },
      {
        id: "chapter-008",
        name: "Cấu trúc điều khiển",
        lessons: [
          {
            id: "lesson-018",
            name: "Câu lệnh if-else",
          },
          {
            id: "lesson-019",
            name: "Vòng lặp for và while",
          },
        ],
      },
    ],
  },
  {
    id: "course-005",
    name: "Hóa học hữu cơ",
    chapters: [
      {
        id: "chapter-009",
        name: "Hiđrocacbon",
        lessons: [
          {
            id: "lesson-020",
            name: "Ankan",
          },
          {
            id: "lesson-021",
            name: "Anken",
          },
          {
            id: "lesson-022",
            name: "Ankin",
          },
        ],
      },
      {
        id: "chapter-010",
        name: "Dẫn xuất hiđrocacbon",
        lessons: [
          {
            id: "lesson-023",
            name: "Ancol",
          },
          {
            id: "lesson-024",
            name: "Axit cacboxylic",
          },
        ],
      },
    ],
  },
];
