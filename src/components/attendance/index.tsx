"use client";

import { useEffect, useState } from "react";

import { CreateAttendanceModal } from "./CreateAttendanceModal";
import { StudentAttendanceModal } from "./StudentAttendanceModal";

// Import từ main page để tránh lỗi
interface AttendanceManagerProps {
  syllabusItem: any; // Sử dụng any để tránh type issues
  className?: string;
}

export function AttendanceManager({
  syllabusItem,
  className = "",
}: AttendanceManagerProps) {
  // Sử dụng global user từ window hoặc pass qua props thay vì import store
  const [user, setUser] = useState<any>(null);
  const [attendanceCodes, setAttendanceCodes] = useState<any[]>([]);

  useEffect(() => {
    // Lấy user từ session storage hoặc localStorage
    const userData = localStorage.getItem("user-session");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed.state?.user);
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
  }, []);

  // Only show attendance for LIVE_SESSION items
  if (syllabusItem?.itemType !== "LIVE_SESSION") {
    return null;
  }

  // Only show for instructors and students
  if (!user || (user.role !== "INSTRUCTOR" && user.role !== "STUDENT")) {
    return null;
  }

  const isInstructor = user.role === "INSTRUCTOR";

  const handleCodeCreated = (newCode: any) => {
    setAttendanceCodes((prev) => [...prev, newCode]);
  };

  const handleCodeDeleted = (codeId: string) => {
    setAttendanceCodes((prev) => prev.filter((code) => code.id !== codeId));
  };

  return (
    <div className={className}>
      {isInstructor ? (
        <CreateAttendanceModal
          syllabusItem={syllabusItem}
          existingCodes={attendanceCodes}
          onCodeCreated={handleCodeCreated}
          onCodeDeleted={handleCodeDeleted}
        />
      ) : (
        <StudentAttendanceModal syllabusItem={syllabusItem} />
      )}
    </div>
  );
}
