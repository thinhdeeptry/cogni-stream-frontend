"use client";

import { useEffect, useState } from "react";

import { ClassSession } from "@/types/course/types";
import moment from "moment";
import {
  Calendar,
  Event as RBCEvent,
  momentLocalizer,
} from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { toast } from "sonner";

import { mySchedule } from "@/actions/classSessionAction";

import { CustomEvent } from "@/components/session/CustomEvent";
import { CustomMonthEvent } from "@/components/session/CustomMonthEvent";
import { ViewSessionModal } from "@/components/session/ViewSessionModal";

const localizer = momentLocalizer(moment);

export default function MySchedulePage() {
  const [studentSessions, setStudentSessions] = useState<ClassSession[]>([]);
  const [instructorSessions, setInstructorSessions] = useState<ClassSession[]>(
    [],
  );
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(
    null,
  );

  const fetchSessions = async () => {
    try {
      const res = await mySchedule();
      setStudentSessions(res.data.learingSessions || []);
      setInstructorSessions(res.data.teachingSessions || []);
    } catch {
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

  return (
    <div className="p-5 bg-white rounded-lg shadow space-y-4">
      <h1 className="text-2xl font-semibold">Lịch của tôi</h1>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        style={{ height: 600 }}
        onSelectEvent={(event: RBCEvent) =>
          setSelectedSession(event.resource as ClassSession)
        }
        components={{
          event: CustomEvent,
          month: {
            event: CustomMonthEvent,
          },
        }}
      />

      {/* Modal hiển thị chi tiết session */}
      {selectedSession && (
        <ViewSessionModal
          open={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          session={selectedSession}
        />
      )}
    </div>
  );
}
