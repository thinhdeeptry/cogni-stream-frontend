"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { Class } from "@/types/course/types";
import { motion } from "framer-motion";
import { Calendar, CheckCircle2, Clock, MapPin, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ClassSelectorProps {
  classes: Class[];
  selectedClassId: string | null;
  onClassSelect: (classId: string) => void;
  isLoading?: boolean;
}

const ClassSelector = ({
  classes,
  selectedClassId,
  onClassSelect,
  isLoading = false,
}: ClassSelectorProps) => {
  useEffect(() => {
    console.log("classes in classSelector: ", classes);
  }, [classes]);
  // State cho modal lịch học
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [viewingClass, setViewingClass] = useState<Class | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      month: "short",
      day: "numeric",
    });
  };

  const getClassStatus = (classItem: Class) => {
    const now = new Date();
    const startDate = new Date(classItem.startDate);
    const endDate = classItem.endDate ? new Date(classItem.endDate) : null;

    if (now < startDate) {
      return {
        label: "Sắp diễn ra",
        color: "bg-blue-100 text-blue-700 border-blue-300",
        icon: <Calendar className="h-3 w-3" />,
      };
    } else if (endDate && now >= startDate && now <= endDate) {
      return {
        label: "Đang diễn ra",
        color: "bg-green-100 text-green-700 border-green-300",
        icon: <CheckCircle2 className="h-3 w-3" />,
      };
    } else if (endDate && now > endDate) {
      return {
        label: "Đã kết thúc",
        color: "bg-gray-100 text-gray-700 border-gray-300",
        icon: <CheckCircle2 className="h-3 w-3" />,
      };
    } else {
      return {
        label: "Đang diễn ra",
        color: "bg-green-100 text-green-700 border-green-300",
        icon: <CheckCircle2 className="h-3 w-3" />,
      };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 animate-pulse rounded"></div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <div className="space-y-3">
                <div className="h-5 bg-gray-200 animate-pulse rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 animate-pulse rounded w-2/3"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          Chưa có lớp học nào mở đăng ký
        </h3>
        <p className="text-gray-500 mb-1">
          Hiện tại chưa có lớp học nào mở đăng ký cho khóa học này
        </p>
        <p className="text-gray-400 text-sm">
          Vui lòng quay lại sau hoặc liên hệ để được thông báo khi có lớp mới
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-500" />
            Chọn lớp học
          </h3>
          <Badge variant="outline" className="bg-orange-50 text-orange-700">
            {classes.length} lớp có sẵn
          </Badge>
        </div>

        <div className="grid gap-4">
          {classes.map((classItem, index) => {
            const status = getClassStatus(classItem);
            const isSelected = selectedClassId === classItem.id;

            return (
              <motion.div
                key={classItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-md",
                    isSelected
                      ? "border-2 border-orange-500 bg-orange-50 shadow-md"
                      : "border border-gray-200 hover:border-orange-300",
                  )}
                  onClick={() => onClassSelect(classItem.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-800 text-lg">
                            {classItem.name}
                          </h4>
                          {isSelected && (
                            <CheckCircle2 className="h-5 w-5 text-orange-500" />
                          )}
                        </div>

                        <Badge
                          variant="outline"
                          className={cn("text-xs", status.color)}
                        >
                          {status.icon}
                          <span className="ml-1">{status.label}</span>
                        </Badge>
                      </div>
                    </div>

                    {classItem.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {classItem.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        <div>
                          <div className="font-medium">Bắt đầu</div>
                          <div>{formatDateShort(classItem.startDate)}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <div>
                          <div className="font-medium">Kết thúc</div>
                          <div>
                            {classItem.endDate
                              ? formatDateShort(classItem.endDate)
                              : "Chưa xác định"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="h-4 w-4 text-orange-500" />
                        <span className="text-sm">
                          <span className="font-medium">
                            {classItem.currentStudents}
                          </span>
                          <span className="text-gray-400">
                            /{classItem.maxStudents}
                          </span>
                          <span className="ml-1">học viên</span>
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {!isSelected && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-orange-600 border-orange-200 hover:bg-orange-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              onClassSelect(classItem.id);
                            }}
                          >
                            Chọn lớp này
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:bg-blue-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingClass(classItem);
                            setIsScheduleModalOpen(true);
                          }}
                        >
                          Xem lịch học
                        </Button>
                      </div>

                      {isSelected && (
                        <Badge className="bg-orange-500 text-white">
                          Đã chọn
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {classes.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <div className="bg-blue-100 rounded-full p-1">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-blue-800 mb-1">
                  Lưu ý về lịch học
                </h4>
                <p className="text-blue-700 text-sm">
                  Sau khi chọn lớp và đăng ký, bạn sẽ nhận được thông tin chi
                  tiết về lịch học và đường link tham gia các buổi học trực
                  tuyến qua email.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lịch học lớp: {viewingClass?.name}</DialogTitle>
            <DialogDescription>{viewingClass?.description}</DialogDescription>
          </DialogHeader>
          {viewingClass?.schedules && viewingClass.schedules.length > 0 ? (
            <div className="space-y-4 mt-2">
              {viewingClass.schedules.map((schedule, idx) => (
                <div key={idx} className="border rounded-lg p-3 bg-blue-50">
                  <div className="font-semibold text-blue-800 mb-1">
                    {schedule.name}
                  </div>
                  <div className="text-sm text-gray-700 mb-1">
                    Ngày học: {schedule.days.join(", ")}
                  </div>
                  <div className="text-sm text-gray-700">
                    Từ{" "}
                    {new Date(schedule.startDate).toLocaleDateString("vi-VN")}{" "}
                    đến {new Date(schedule.endDate).toLocaleDateString("vi-VN")}
                  </div>
                  <div className="text-sm text-gray-700">
                    Giờ học: {schedule.startTime}
                    {schedule.endTime ? ` - ${schedule.endTime}` : ""}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm mt-2">
              Chưa có lịch học cho lớp này.
            </div>
          )}
          <DialogClose asChild>
            <Button className="mt-4 w-full" variant="outline">
              Đóng
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClassSelector;
