"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ClassSession } from "@/types/course/types";
import { Plus } from "lucide-react";
import moment from "moment";
import {
  Calendar,
  Event as RBCEvent,
  SlotInfo,
  momentLocalizer,
} from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { toast } from "sonner";

import { getClassSessionsByClassroomId } from "@/actions/classSessionAction";

import { Button } from "@/components/ui/button";

const localizer = momentLocalizer(moment);

export default function ClassroomSchedulePage() {
  const { id } = useParams();
  const [sessions, setSessions] = useState<ClassSession[]>([]);

  const fetchSessions = async () => {
    try {
      const data: ClassSession[] = await getClassSessionsByClassroomId(
        id as string,
      );
      setSessions(data);
    } catch {
      toast.error("Lỗi tải danh sách buổi học");
    }
  };

  useEffect(() => {
    if (id) fetchSessions();
  }, [id]);

  const events: RBCEvent[] = sessions.map((s) => ({
    id: s.id,
    title: s.topic,
    start: new Date(s.scheduledAt),
    end: moment(s.scheduledAt).add(s.durationMinutes, "minutes").toDate(),
  }));

  const handleSelectSlot = ({ start, end }: SlotInfo) => {
    console.log("Tạo mới từ", start, "đến", end);
    // mở modal tạo buổi học
  };

  const handleSelectEvent = (event: RBCEvent) => {
    console.log("Edit buổi học", event);
    // mở modal edit buổi học
  };

  return (
    <div className="p-5 bg-white rounded-lg shadow space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Lịch buổi học</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> Thêm buổi học
        </Button>
      </div>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        style={{ height: 600 }}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
      />
    </div>
  );
}
