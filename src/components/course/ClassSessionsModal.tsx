"use client";

import { useEffect, useState } from "react";

import { Class, Schedule } from "@/types/course/types";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Info,
  Loader2,
  MapPin,
  Users,
  Video,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ClassSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classItem: Class | null;
  onSelectClass: (classId: string) => void;
}

export default function ClassSessionsModal({
  isOpen,
  onClose,
  classItem,
  onSelectClass,
}: ClassSessionsModalProps) {
  const [generatedSessions, setGeneratedSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Helper function để tạo sessions từ schedules
  const generateSessionsFromSchedules = (classData: Class) => {
    if (!classData?.schedules || !Array.isArray(classData.schedules)) {
      return [];
    }

    const sessions: any[] = [];
    const dayMapping: { [key: string]: number } = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    const dayNames = [
      "Chủ nhật",
      "Thứ 2",
      "Thứ 3",
      "Thứ 4",
      "Thứ 5",
      "Thứ 6",
      "Thứ 7",
    ];

    classData.schedules.forEach((schedule: Schedule, scheduleIndex: number) => {
      if (!schedule.days || !Array.isArray(schedule.days)) return;

      const startDate = new Date(schedule.startDate);
      const endDate = new Date(schedule.endDate);
      let sessionCount = 1;

      // Tạo sessions cho mỗi ngày phù hợp trong khoảng thời gian
      for (
        let currentDate = new Date(startDate);
        currentDate <= endDate;
        currentDate.setDate(currentDate.getDate() + 1)
      ) {
        const dayOfWeek = currentDate.getDay();
        const dayKey = Object.keys(dayMapping).find(
          (key) => dayMapping[key] === dayOfWeek,
        );

        if (dayKey && schedule.days.includes(dayKey)) {
          const sessionDate = new Date(currentDate);
          const [hours, minutes] = (schedule.startTime || "19:00").split(":");
          sessionDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          // Tính thời gian kết thúc (mặc định 2 tiếng)
          const duration = 120; // 2 tiếng
          const endHour = parseInt(hours) + 2;
          const endTime = `${endHour.toString().padStart(2, "0")}:${minutes}`;

          sessions.push({
            id: `generated-${scheduleIndex}-${sessionCount}`,
            topic: `${schedule.name} - Buổi ${sessionCount}`,
            scheduledAt: sessionDate.toISOString(),
            durationMinutes: duration,
            dayOfWeek: dayNames[dayOfWeek],
            date: sessionDate.toLocaleDateString("vi-VN"),
            time: schedule.startTime,
            endTime: endTime,
            lesson: null,
            status: sessionDate > new Date() ? "SCHEDULED" : "COMPLETED",
            scheduleName: schedule.name,
          });

          sessionCount++;
        }
      }
    });

    // Sắp xếp theo thời gian
    sessions.sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );

    return sessions;
  };

  useEffect(() => {
    if (isOpen && classItem) {
      setIsLoading(true);
      try {
        const generated = generateSessionsFromSchedules(classItem);
        setGeneratedSessions(generated);
      } catch (err) {
        console.error("Error generating sessions from schedules:", err);
      } finally {
        setIsLoading(false);
      }
    }
  }, [isOpen, classItem]);

  const handleSelect = () => {
    if (classItem) {
      onSelectClass(classItem.id);
      onClose();
    }
  };

  // Tính toán thống kê từ generated sessions
  const upcomingSessions = generatedSessions.filter(
    (s) => s.status === "SCHEDULED",
  );
  const pastSessions = generatedSessions.filter(
    (s) => s.status === "COMPLETED",
  );
  const totalDurationHours =
    generatedSessions.reduce((total, s) => total + s.durationMinutes, 0) / 60;
  const nextSession = upcomingSessions[0] || null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "ongoing":
        return "bg-blue-100 text-blue-800";
      case "scheduled":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "Đã hoàn thành";
      case "ongoing":
        return "Đang diễn ra";
      case "scheduled":
        return "Đã lên lịch";
      case "cancelled":
        return "Đã hủy";
      default:
        return status || "Chưa xác định";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-6 w-6 text-orange-500" />
            Lịch học chi tiết
          </DialogTitle>
        </DialogHeader>

        {/* Class Information Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {classItem?.name}
            </h3>
            {classItem?.description && (
              <p className="text-gray-600 mt-1">{classItem.description}</p>
            )}

            {/* Class Info Summary */}
            <div className="flex flex-wrap gap-4 mt-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-500" />
                <span>
                  {classItem && formatDateShort(classItem.startDate)}
                  {classItem?.endDate &&
                    ` - ${formatDateShort(classItem.endDate)}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-orange-500" />
                <span>
                  {classItem?.currentStudents || 0}/
                  {classItem?.maxStudents || 0} học viên
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-orange-500" />
                <span>Google Meet</span>
              </div>
            </div>

            {/* Schedules Display */}
            {classItem?.schedules && classItem.schedules.length > 0 && (
              <div className="mt-4 space-y-3">
                <h4 className="font-semibold text-gray-800 text-base">
                  Lịch học:
                </h4>
                {classItem.schedules.map((schedule, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-blue-800">
                        {schedule.name}
                      </h5>
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-700"
                      >
                        {schedule.days.length} ngày/tuần
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-gray-700">
                            Thời gian:
                          </span>
                          <span className="text-blue-700 font-semibold">
                            {schedule.startTime}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-gray-700">
                            Thời lượng:
                          </span>
                          <span className="text-gray-600">2 tiếng/buổi</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-gray-700">
                            Khoảng thời gian:
                          </span>
                        </div>
                        <div className="text-gray-600 text-xs ml-6">
                          {formatDate(schedule.startDate)} →{" "}
                          {formatDate(schedule.endDate)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-gray-700">
                          Các ngày trong tuần:
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {schedule.days.map((day) => {
                          const dayMap: {
                            [key: string]: { short: string; full: string };
                          } = {
                            Monday: { short: "T2", full: "Thứ Hai" },
                            Tuesday: { short: "T3", full: "Thứ Ba" },
                            Wednesday: { short: "T4", full: "Thứ Tư" },
                            Thursday: { short: "T5", full: "Thứ Năm" },
                            Friday: { short: "T6", full: "Thứ Sáu" },
                            Saturday: { short: "T7", full: "Thứ Bảy" },
                            Sunday: { short: "CN", full: "Chủ Nhật" },
                          };
                          const dayInfo = dayMap[day] || {
                            short: day,
                            full: day,
                          };
                          return (
                            <div
                              key={day}
                              className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm font-medium"
                            >
                              {dayInfo.full}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden min-h-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : classItem?.schedules && classItem.schedules.length > 0 ? (
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4 pb-4">
                {/* Summary Statistics */}
                {/* <div className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg">
                  <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Thống kê lịch học
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-orange-600 text-lg">
                        {generatedSessions.length}
                      </div>
                      <div className="text-gray-600">Tổng buổi học</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-orange-600 text-lg">
                        {Math.round(totalDurationHours)}h
                      </div>
                      <div className="text-gray-600">Tổng thời lượng</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-orange-600 text-lg">
                        {upcomingSessions.length}
                      </div>
                      <div className="text-gray-600">Buổi sắp tới</div>
                    </div>
                  </div>
                  
                  
                  {nextSession && (
                    <div className="mt-3 pt-3 border-t border-orange-200">
                      <div className="text-sm">
                        <span className="font-medium text-orange-800">Buổi học tiếp theo: </span>
                        <span className="text-gray-700">{nextSession.dayOfWeek}, {nextSession.date} lúc {nextSession.time}</span>
                      </div>
                    </div>
                  )}
                </div> */}

                {/* Detailed Schedule Information */}
                {/* <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800 text-lg">Chi tiết lịch học</h4>
                  {classItem.schedules.map((schedule, index) => (
                    <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-semibold text-gray-800">{schedule.name}</h5>
                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                          {schedule.days.length} ngày/tuần
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">Giờ học:</span>
                            <span className="text-blue-600 font-semibold">{schedule.startTime} - {
                              (() => {
                                const [hours, minutes] = schedule.startTime.split(':');
                                const endHour = parseInt(hours) + 2;
                                return `${endHour.toString().padStart(2, '0')}:${minutes}`;
                              })()
                            }</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">Thời gian:</span>
                            <span className="text-gray-600">
                              {formatDateShort(schedule.startDate)} - {formatDateShort(schedule.endDate)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">Các ngày học:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {schedule.days.map(day => {
                              const dayMap: { [key: string]: string } = {
                                'monday': 'Thứ Hai',
                                'tuesday': 'Thứ Ba',
                                'wednesday': 'Thứ Tư',
                                'thursday': 'Thứ Năm',
                                'friday': 'Thứ Sáu',
                                'saturday': 'Thứ Bảy',
                                'sunday': 'Chủ Nhật'
                              };
                              return (
                                <span key={day} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                  {dayMap[day] || day}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div> */}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Calendar className="h-12 w-12 mb-4" />
              <p>Chưa có lịch học chi tiết cho lớp này.</p>
              <p className="text-sm mt-1">
                Lịch học sẽ được cập nhật sau khi có đủ học viên đăng ký.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button
            onClick={handleSelect}
            disabled={
              isLoading ||
              Boolean(
                classItem?.currentStudents &&
                  classItem?.maxStudents &&
                  classItem.currentStudents >= classItem.maxStudents,
              )
            }
            className="bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
          >
            <Video className="h-4 w-4 mr-1" />
            {Boolean(
              classItem?.currentStudents &&
                classItem?.maxStudents &&
                classItem.currentStudents >= classItem.maxStudents,
            )
              ? "Lớp đã đầy"
              : "Chọn lớp này"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
