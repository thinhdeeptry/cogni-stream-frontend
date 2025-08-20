// CustomEvent.tsx
import { ClassSession } from "@/types/course/types";
import clsx from "clsx";
import moment from "moment";

export function CustomEvent({ event }: { event: any }) {
  const session: ClassSession = event.resource;
  const start = moment(session.scheduledAt).format("HH:mm");
  const end = moment(session.scheduledAt)
    .add(session.durationMinutes, "minutes")
    .format("HH:mm");

  // map màu theo status
  const bgColor =
    session.status === "SCHEDULED"
      ? "bg-blue-200" // xanh dương mờ
      : session.status === "COMPLETED"
        ? "bg-green-200" // xanh lá mờ
        : session.status === "CANCELED"
          ? "bg-red-200" // đỏ mờ
          : "bg-gray-200"; // fallback

  return (
    <div
      className={clsx(
        "p-1 text-xs rounded-md", // bo góc cho đẹp
        bgColor,
      )}
    >
      <div className="font-semibold text-gray-700">{session.topic}</div>
      <div className="text-gray-700">
        {start} - {end} ({session.status})
      </div>
      {session.meetingLink && (
        <a
          href={session.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          Join
        </a>
      )}
      {session.recordingUrl && (
        <a
          href={session.recordingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-green-600 underline"
        >
          Recording
        </a>
      )}
    </div>
  );
}
