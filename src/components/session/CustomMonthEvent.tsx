// components/session/CustomMonthEvent.tsx
import { ClassSession } from "@/types/course/types";
import clsx from "clsx";
import moment from "moment";

export function CustomMonthEvent({ event }: { event: any }) {
  const session: ClassSession = event.resource;
  const start = moment(session.scheduledAt).format("HH:mm");

  const bgColor = clsx(
    "rounded px-1 text-xs font-bold text-black",
    session.status === "SCHEDULED"
      ? "bg-blue-200"
      : session.status === "COMPLETED"
        ? "bg-green-200"
        : session.status === "CANCELED"
          ? "bg-red-200"
          : "bg-gray-200",
  );

  return (
    <div className={bgColor}>
      <span>{start}</span> {session.topic}
    </div>
  );
}
