"use client";

import { useState } from "react";

import {
  Award,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  MapPin,
  Users,
  Video,
} from "lucide-react";
import ReactPlayer from "react-player";

import { AttendanceManager } from "@/components/attendance/AttendanceManager";
import { StudentAttendanceInput } from "@/components/attendance/StudentAttendanceInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ClassSession {
  id: string;
  topic: string;
  scheduledAt: string; // Changed from scheduledDate to scheduledAt
  durationMinutes: number;
  meetingLink?: string;
  meetingDetail?: string;
  recordingUrl?: string;
}

interface LiveSessionCardProps {
  classSession: ClassSession;
  instructorId: string;
  syllabusItemId: string;
  currentItemIndex: number;
  totalItems: number;
  isLast: boolean;
  hasCertificate: boolean;
  certificateId?: string;
  enrollmentId?: string; // For student attendance
  isInstructorOrAdmin?: boolean; // To show different UI
  userRole?: "INSTRUCTOR" | "ADMIN"; // Thêm userRole prop
  onJoinSession: () => void;
  onCompleteSession: () => void;
  onViewCertificate: () => void;
  onAttendanceSuccess?: () => void; // Callback for successful attendance
}

export function LiveSessionCard({
  classSession,
  instructorId,
  syllabusItemId,
  currentItemIndex,
  totalItems,
  isLast,
  hasCertificate,
  certificateId,
  enrollmentId,
  isInstructorOrAdmin = false,
  userRole = "INSTRUCTOR",
  onJoinSession,
  onCompleteSession,
  onViewCertificate,
  onAttendanceSuccess,
}: LiveSessionCardProps) {
  const [isVideoLoading, setIsVideoLoading] = useState(true);

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

  const sessionDate = new Date(classSession.scheduledAt);
  const now = new Date();
  const isUpcoming = sessionDate > now;
  const isToday = sessionDate.toDateString() === now.toDateString();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Video className="h-6 w-6 text-red-500" />
          <div>
            {/* <h2 className="text-xl font-semibold text-gray-900">
              {classSession.topic}
            </h2> */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(classSession.scheduledAt)}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatTime(classSession.scheduledAt)} -{" "}
                {classSession.durationMinutes} phút
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-xl border border-red-100">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <Users className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-800 mb-1">
                Buổi học trực tuyến
              </h3>
              <p className="text-sm text-red-600">
                Tham gia buổi học trực tiếp với giảng viên và các học viên khác
              </p>
            </div>
          </div>

          {classSession.meetingDetail && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 shadow-sm">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Chi tiết buổi học
              </h4>
              <p className="text-gray-700 whitespace-pre-wrap">
                {classSession.meetingDetail}
              </p>
            </div>
          )}

          {/* Session Status and Actions */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isUpcoming ? (
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800"
                  >
                    Sắp diễn ra
                  </Badge>
                ) : isToday ? (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800"
                  >
                    Hôm nay
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-gray-100 text-gray-800"
                  >
                    Đã diễn ra
                  </Badge>
                )}
              </div>

              {classSession.meetingLink && (
                <Button
                  onClick={onJoinSession}
                  className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Tham gia buổi học
                </Button>
              )}
            </div>

            {!classSession.meetingLink && (
              <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 font-medium mb-1">
                  Chưa có link tham gia
                </p>
                <p className="text-sm text-yellow-600">
                  Link buổi học sẽ được cập nhật trước giờ học
                </p>
              </div>
            )}
          </div>

          {/* Recording Section */}
          {classSession.recordingUrl && (
            <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Video className="h-5 w-5 text-blue-600" />
                Bản ghi buổi học
              </h4>

              <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-3">
                {isVideoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
                <ReactPlayer
                  url={classSession.recordingUrl}
                  width="100%"
                  height="100%"
                  controls
                  onReady={() => setIsVideoLoading(false)}
                  onError={() => setIsVideoLoading(false)}
                  config={{
                    youtube: {
                      playerVars: {
                        showinfo: 1,
                        controls: 1,
                        rel: 0,
                      },
                    },
                  }}
                />
              </div>

              <p className="text-sm text-gray-600">
                Xem lại nội dung buổi học đã được ghi lại
              </p>
            </div>
          )}

          {/* Completion Actions */}
          {isLast && hasCertificate ? (
            <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Award className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-yellow-800">
                      Chứng chỉ hoàn thành
                    </h4>
                    <p className="text-sm text-yellow-600">
                      Bạn đã hoàn thành khóa học và nhận được chứng chỉ
                    </p>
                  </div>
                </div>
                <Button
                  onClick={onViewCertificate}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <Award className="h-4 w-4 mr-2" />
                  Xem chứng chỉ
                </Button>
              </div>
            </div>
          ) : (
            // Show manual completion only for instructors
            // isInstructorOrAdmin && (
            //   <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            //     <div className="flex items-center justify-between">
            //       <div>
            //         <h4 className="font-semibold text-blue-800 mb-1">
            //           Hoàn thành buổi học (Preview Mode)
            //         </h4>
            //         <p className="text-sm text-blue-600">
            //           Đánh dấu buổi học này là đã hoàn thành
            //           {isLast && " để nhận chứng chỉ"}
            //         </p>
            //       </div>
            //       <Button
            //         onClick={onCompleteSession}
            //         className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            //       >
            //         <CheckCircle className="h-4 w-4" />
            //         Hoàn thành
            //       </Button>
            //     </div>
            //   </div>
            // )
            <></>
          )}

          {/* Attendance System */}
          <div className="mt-6">
            {isInstructorOrAdmin ? (
              // Instructor view - AttendanceManager with modal for creating/managing codes
              <AttendanceManager
                syllabusItemId={syllabusItemId}
                instructorId={instructorId}
                isLiveSession={true}
                sessionTopic={classSession.topic}
                userRole={userRole}
              />
            ) : enrollmentId ? (
              // Student view - StudentAttendanceInput for submitting codes
              <div className="space-y-3">
                <StudentAttendanceInput
                  syllabusItemId={syllabusItemId}
                  enrollmentId={enrollmentId}
                  sessionTopic={classSession.topic}
                  onAttendanceSuccess={onAttendanceSuccess}
                />
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
