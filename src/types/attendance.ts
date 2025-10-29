export interface AttendanceCode {
  id: string;
  code: string;
  syllabusItemId: string;
  teacherId: string;
  isActive: boolean;
  expiresAt: Date | null;
  autoExpire: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  syllabusItemId: string;
  attendanceCodeId: string;
  status: AttendanceStatus;
  checkedInAt: Date;
  isLate: boolean;
  user?: {
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
      scheduledTime: Date;
    };
  };
  codes: AttendanceCode[];
  records: AttendanceRecord[];
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
    attendanceStartTime: Date | null;
    attendanceEndTime: Date | null;
    lateThresholdMinutes: number | null;
    classSession?: {
      topic: string;
      scheduledTime: Date;
    };
  };
  userRole: "INSTRUCTOR" | "STUDENT";
  codes?: AttendanceCode[]; // Chỉ có khi user là instructor
  userAttendanceRecord?: AttendanceRecord; // Chỉ có khi user là student
}
