export interface ClassSession {
  id: string;
  topic: string;
  scheduledAt: string;
  durationMinutes: number;
  classId: string;
  status?: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
}

export interface Lesson {
  id: string;
  title: string;
  type: "VIDEO" | "QUIZ" | "ASSIGNMENT" | "READING" | "DISCUSSION";
  estimatedDurationMinutes: number;
  videoUrl?: string;
  content?: string;
  isPublished: boolean;
  isFreePreview?: boolean;
}

export interface SyllabusItem {
  id: string;
  day: number;
  order: number;
  itemType: "LIVE_SESSION" | "LESSON";
  classSession?: ClassSession;
  lesson?: Lesson;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Syllabus {
  id: string;
  classId: string;
  className: string;
  items: SyllabusItem[];
  totalDays: number;
  totalSessions: number;
  totalLessons: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupedSyllabusItem {
  day: number;
  items: SyllabusItem[];
}
