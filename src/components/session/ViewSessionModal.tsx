"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  PlayCircle,
  Users,
  Video,
  XCircle,
} from "lucide-react";
import moment from "moment";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ViewSessionModal({
  open,
  onClose,
  session,
}: {
  open: boolean;
  onClose: () => void;
  session: any;
}) {
  if (!session) return null;

  const startTime = moment(session.scheduledAt);
  const endTime = startTime.clone().add(session.durationMinutes, "minutes");

  const statusConfig: Record<
    string,
    { label: string; color: string; icon: any }
  > = {
    SCHEDULED: {
      label: "Đã lên lịch",
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: AlertCircle,
    },
    COMPLETED: {
      label: "Đã hoàn thành",
      color: "bg-green-100 text-green-800 border-green-200",
      icon: CheckCircle,
    },
    CANCELED: {
      label: "Đã hủy",
      color: "bg-red-100 text-red-800 border-red-200",
      icon: XCircle,
    },
    ONGOING: {
      label: "Đang diễn ra",
      color: "bg-orange-100 text-orange-800 border-orange-200",
      icon: PlayCircle,
    },
  };

  const currentStatus = statusConfig[session.status] || statusConfig.SCHEDULED;
  const StatusIcon = currentStatus.icon;

  const isUpcoming = moment(session.scheduledAt).isAfter(moment());
  const isLive =
    session.status === "ONGOING" ||
    (moment().isBetween(startTime, endTime) && session.status === "SCHEDULED");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-6 w-6 text-blue-500" />
            Chi tiết buổi học
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Header Card */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {session.topic}
                  </h3>
                  {session.class && (
                    <p className="text-sm text-gray-600 mb-2">
                      Lớp: {session.class.name}
                    </p>
                  )}
                  {session.course && (
                    <p className="text-sm text-gray-600">
                      Khóa học: {session.course.title}
                    </p>
                  )}
                </div>
                <Badge className={`${currentStatus.color} border`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {currentStatus.label}
                </Badge>
              </div>

              {isLive && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <div className="flex items-center gap-2 text-red-700">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="font-medium">Buổi học đang diễn ra</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Time & Duration Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <span className="font-medium text-gray-700">Thời gian</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Ngày: </span>
                    <span className="font-medium">
                      {startTime.format("dddd, DD/MM/YYYY")}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Giờ: </span>
                    <span className="font-medium">
                      {startTime.format("HH:mm")} - {endTime.format("HH:mm")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <span className="font-medium text-gray-700">Thời lượng</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Tổng thời gian: </span>
                    <span className="font-medium">
                      {session.durationMinutes} phút
                    </span>
                  </div>
                  {isUpcoming && (
                    <div>
                      <span className="text-gray-600">Còn lại: </span>
                      <span className="font-medium text-blue-600">
                        {moment(session.scheduledAt).fromNow()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Instructor Info */}
          {session.instructor && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-gray-700">Giảng viên</span>
                </div>
                <div className="flex items-center gap-3">
                  {session.instructor.avatar && (
                    <img
                      src={session.instructor.avatar}
                      alt={session.instructor.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium text-gray-800">
                      {session.instructor.name}
                    </p>
                    {session.instructor.title && (
                      <p className="text-sm text-gray-600">
                        {session.instructor.title}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Meeting Links */}
          {(session.meetingLink || session.recordingUrl) && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Video className="h-5 w-5 text-purple-500" />
                  <span className="font-medium text-gray-700">Liên kết</span>
                </div>
                <div className="space-y-3">
                  {session.meetingLink && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium text-blue-800">
                          Link tham gia buổi học
                        </p>
                        <p className="text-sm text-blue-600">
                          Google Meet / Zoom
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() =>
                          window.open(session.meetingLink, "_blank")
                        }
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={!isLive && !isUpcoming}
                      >
                        {isLive ? "Tham gia ngay" : "Mở link"}
                      </Button>
                    </div>
                  )}

                  {session.recordingUrl && (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium text-green-800">
                          Bản ghi buổi học
                        </p>
                        <p className="text-sm text-green-600">
                          Xem lại nội dung đã học
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          window.open(session.recordingUrl, "_blank")
                        }
                        className="border-green-300 text-green-700 hover:bg-green-50"
                      >
                        Xem recording
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lesson Info */}
          {session.lesson && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <PlayCircle className="h-5 w-5 text-indigo-500" />
                  <span className="font-medium text-gray-700">
                    Bài học liên quan
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-gray-800">
                    {session.lesson.title}
                  </p>
                  {session.lesson.chapter && (
                    <p className="text-sm text-gray-600">
                      Chương: {session.lesson.chapter.title}
                    </p>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {session.lesson.type}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          {session.meetingLink && isLive && (
            <Button
              onClick={() => window.open(session.meetingLink, "_blank")}
              className="bg-red-600 hover:bg-red-700"
            >
              <Video className="h-4 w-4 mr-2" />
              Tham gia ngay
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
