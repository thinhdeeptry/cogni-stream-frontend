export interface AttendanceCode {
  id: string;
  code: string;
  syllabusItemId: string;
  teacherId: string;
  isActive: boolean;
  expiresAt: string | null;
  autoExpire: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  syllabusItemId: string;
  attendanceCodeId: string;
  status: AttendanceStatus;
  attendedAt: string;
  isLate: boolean;
  student?: {
    id: string;
    name: string;
    email: string;
  };
}

export enum AttendanceStatus {
  PRESENT = "PRESENT",
  LATE = "LATE",
  ABSENT = "ABSENT",
}

export interface CreateAttendanceCodeRequest {
  syllabusItemId: string;
  expiresAt?: string;
  autoExpire?: boolean;
}

export interface AttendanceCheckInRequest {
  code: string;
  syllabusItemId: string;
}

export interface AttendanceReport {
  syllabusItem: {
    id: string;
    day: number;
    order: number;
    itemType: string;
    classSession?: {
      topic: string;
      scheduledTime: string;
    };
  };
  codes: AttendanceCode[];
  report: AttendanceRecord[];
  stats: {
    totalStudents: number;
    presentCount: number;
    lateCount: number;
    absentCount: number;
  };
}

export interface SyllabusAttendanceInfo {
  syllabusItem: {
    id: string;
    day: number;
    order: number;
    itemType: string;
    attendanceEnabled: boolean;
    attendanceStartTime: string | null;
    attendanceEndTime: string | null;
    lateThresholdMinutes: number | null;
    classSession?: {
      topic: string;
      scheduledTime: string;
    };
  };
  userRole: "INSTRUCTOR" | "STUDENT";
  codes?: AttendanceCode[]; // Chỉ có khi user là instructor
  userAttendanceRecord?: AttendanceRecord; // Chỉ có khi user là student
}
