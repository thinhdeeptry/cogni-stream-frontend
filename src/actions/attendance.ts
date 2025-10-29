import { AxiosFactory } from "@/lib/axios";

// Types để tránh dependency issues
interface AttendanceCode {
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

interface AttendanceRecord {
  id: string;
  userId: string;
  syllabusItemId: string;
  attendanceCodeId: string;
  status: string;
  checkedInAt: Date;
  isLate: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface CreateAttendanceCodeRequest {
  syllabusItemId: string;
  expiresAt?: string;
  autoExpire?: boolean;
}

interface AttendanceCheckInRequest {
  code: string;
  syllabusItemId: string;
}

interface SyllabusAttendanceInfo {
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
  codes?: AttendanceCode[];
  userAttendanceRecord?: AttendanceRecord;
}

// API functions for attendance management

// Create attendance code (instructor only)
export const createAttendanceCode = async (
  data: CreateAttendanceCodeRequest,
): Promise<AttendanceCode> => {
  const api = await AxiosFactory.getApiInstance("gateway");
  const response = await api.post("/attendance/codes", data);
  return response.data;
};

// Update attendance code (instructor only)
export const updateAttendanceCode = async (
  codeId: string,
  data: Partial<CreateAttendanceCodeRequest>,
): Promise<AttendanceCode> => {
  const api = await AxiosFactory.getApiInstance("gateway");
  const response = await api.patch(`/attendance/codes/${codeId}`, data);
  return response.data;
};

// Delete attendance code (instructor only)
export const deleteAttendanceCode = async (codeId: string): Promise<void> => {
  const api = await AxiosFactory.getApiInstance("gateway");
  await api.delete(`/attendance/codes/${codeId}`);
};

// Get attendance codes by syllabus item (instructor only)
export const getAttendanceCodesBySyllabusItem = async (
  syllabusItemId: string,
): Promise<AttendanceCode[]> => {
  const api = await AxiosFactory.getApiInstance("gateway");
  const response = await api.get(
    `/attendance/syllabus/${syllabusItemId}/codes`,
  );
  return response.data;
};

// Student check-in
export const attendanceCheckIn = async (
  data: AttendanceCheckInRequest,
): Promise<AttendanceRecord> => {
  const api = await AxiosFactory.getApiInstance("gateway");
  const response = await api.post("/attendance/check-in", data);
  return response.data;
};

// Get attendance report (instructor only)
export const getAttendanceReport = async (
  syllabusItemId: string,
): Promise<any> => {
  const api = await AxiosFactory.getApiInstance("gateway");
  const response = await api.get(
    `/attendance/syllabus/${syllabusItemId}/report`,
  );
  return response.data;
};

// Get syllabus item attendance info (for both instructor and student)
export const getSyllabusItemAttendanceInfo = async (
  syllabusItemId: string,
): Promise<SyllabusAttendanceInfo> => {
  const api = await AxiosFactory.getApiInstance("gateway");
  const response = await api.get(`/attendance/syllabus/${syllabusItemId}/info`);
  return response.data;
};

// Get student attendance history
export const getStudentAttendanceHistory = async (
  classId?: string,
): Promise<AttendanceRecord[]> => {
  const api = await AxiosFactory.getApiInstance("gateway");
  const params = classId ? `?classId=${classId}` : "";
  const response = await api.get(`/attendance/history${params}`);
  return response.data;
};
