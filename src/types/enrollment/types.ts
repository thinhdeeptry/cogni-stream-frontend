export type EnrollmentType = "STREAM" | "ONLINE";

export interface Enrollment {
  id: string;
  type: EnrollmentType;
  progress: number;
  isCompleted: boolean;
  completedAt?: string; // ISO date string
  createdAt: string;
  updatedAt: string;

  studentId: string;
  classId?: string;
  courseId?: string;
}
