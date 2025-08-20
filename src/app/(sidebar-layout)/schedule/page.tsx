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

import {
  getClassSessionsByClassroomId,
  mySchedule,
} from "@/actions/classSessionAction";

// Import 2 modal
import { CreateSessionModal } from "@/components/session/CreateSessionModal";
import { CustomEvent } from "@/components/session/CustomEvent";
import { CustomMonthEvent } from "@/components/session/CustomMonthEvent";
import { UpdateSessionModal } from "@/components/session/UpdateSessionModal";
import { Button } from "@/components/ui/button";

const localizer = momentLocalizer(moment);

export default function ClassroomSchedulePage() {
  // modal state
  const [openCreate, setOpenCreate] = useState(false);
  const [openUpdate, setOpenUpdate] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(
    null,
  );
  const [studentSessions, setStudentSessions] = useState<ClassSession[]>([]);
  const [instructorSessions, setInstructorSessions] = useState<ClassSession[]>(
    [],
  );

  const fetchSessions = async () => {
    // try {
    //   const data: ClassSession[] = await getClassSessionsByClassroomId(
    //     id as string,
    //   );
    //   console.log("data: ", data);
    //   setSessions(data);
    // } catch {
    //   toast.error("Lỗi tải danh sách buổi học");
    // }

    try {
      const data = await mySchedule();
      console.log("data: ", data);
      setStudentSessions(data.data.learingSessions);
      setInstructorSessions(data.data.teachingSessions);
    } catch (error) {
      toast.error("Lỗi tải danh sách buổi học");
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const events: RBCEvent[] = [
    ...studentSessions.map((s) => ({
      id: s.id,
      title: s.topic + " (Học)",
      start: new Date(s.scheduledAt),
      end: moment(s.scheduledAt).add(s.durationMinutes, "minutes").toDate(),
      resource: s,
    })),
    ...instructorSessions.map((s) => ({
      id: s.id,
      title: s.topic + " (Dạy)",
      start: new Date(s.scheduledAt),
      end: moment(s.scheduledAt).add(s.durationMinutes, "minutes").toDate(),
      resource: s,
    })),
  ];

  const handleSelectSlot = ({ start, end }: SlotInfo) => {
    console.log("Tạo mới từ", start, "đến", end);
    setOpenCreate(true);
  };

  const handleSelectEvent = (event: RBCEvent) => {
    console.log("Edit buổi học", event);
    setSelectedSession(event.resource as ClassSession);
    setOpenUpdate(true);
  };

  return (
    <div className="p-5 bg-white rounded-lg shadow space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Lịch buổi học</h1>
        {/* <Button onClick={() => setOpenCreate(true)}>
          <Plus className="w-4 h-4 mr-2" /> Thêm buổi học
        </Button> */}
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
        components={{
          event: CustomEvent, // default cho week/day/agenda
          month: {
            event: CustomMonthEvent, // riêng cho month view
          },
        }}
      />

      {/* Modals
      <CreateSessionModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        classroomId={id as string}
        onSuccess={fetchSessions}
      />
      {selectedSession && (
        <UpdateSessionModal
          open={openUpdate}
          onClose={() => {
            setOpenUpdate(false);
            setSelectedSession(null);
          }}
          session={selectedSession}
          onSuccess={fetchSessions}
        />
      )} */}
    </div>
  );
}
