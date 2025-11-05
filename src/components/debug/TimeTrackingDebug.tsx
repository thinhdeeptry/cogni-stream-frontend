import React from "react";

import { formatTime } from "../hooks/useTimeTracking";

interface TimeTrackingDebugProps {
  timeTracking: {
    elapsedSeconds: number;
    isActive: boolean;
    isTimeComplete: boolean;
    progress: number;
    remainingMinutes: number;
    start: () => void;
    pause: () => void;
    resume: () => void;
    reset: () => void;
  };
  requiredMinutes: number;
  itemId: string;
}

const TimeTrackingDebug: React.FC<TimeTrackingDebugProps> = ({
  timeTracking,
  requiredMinutes,
  itemId,
}) => {
  const [isVisible, setIsVisible] = React.useState(false);

  // Show debug only in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  if (!isVisible) {
    return (
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          backgroundColor: "#007bff",
          color: "white",
          padding: "10px",
          borderRadius: "5px",
          cursor: "pointer",
          zIndex: 1000,
        }}
        onClick={() => setIsVisible(true)}
      >
        🕒 Debug
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        backgroundColor: "white",
        border: "2px solid #007bff",
        borderRadius: "8px",
        padding: "15px",
        minWidth: "300px",
        fontSize: "12px",
        zIndex: 1000,
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <h4 style={{ margin: 0, color: "#007bff" }}>🕒 Time Tracking Debug</h4>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: "none",
            border: "none",
            fontSize: "16px",
            cursor: "pointer",
            color: "#666",
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: "10px", fontSize: "11px", color: "#666" }}>
        <strong>Item ID:</strong> {itemId}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          marginBottom: "10px",
        }}
      >
        <div>
          <strong>Status:</strong>{" "}
          {timeTracking.isActive ? "▶️ Active" : "⏸️ Paused"}
        </div>
        <div>
          <strong>Complete:</strong>{" "}
          {timeTracking.isTimeComplete ? "✅ Yes" : "❌ No"}
        </div>
        <div>
          <strong>Elapsed:</strong> {formatTime(timeTracking.elapsedSeconds)}
        </div>
        <div>
          <strong>Required:</strong> {requiredMinutes}m
        </div>
        <div>
          <strong>Progress:</strong> {timeTracking.progress.toFixed(1)}%
        </div>
        <div>
          <strong>Remaining:</strong> {timeTracking.remainingMinutes}m
        </div>
      </div>

      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
        <button
          onClick={timeTracking.start}
          disabled={timeTracking.isActive}
          style={{
            padding: "4px 8px",
            fontSize: "10px",
            backgroundColor: timeTracking.isActive ? "#ccc" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "3px",
            cursor: timeTracking.isActive ? "not-allowed" : "pointer",
          }}
        >
          Start
        </button>
        <button
          onClick={timeTracking.pause}
          disabled={!timeTracking.isActive}
          style={{
            padding: "4px 8px",
            fontSize: "10px",
            backgroundColor: !timeTracking.isActive ? "#ccc" : "#ffc107",
            color: !timeTracking.isActive ? "#666" : "black",
            border: "none",
            borderRadius: "3px",
            cursor: !timeTracking.isActive ? "not-allowed" : "pointer",
          }}
        >
          Pause
        </button>
        <button
          onClick={timeTracking.resume}
          disabled={timeTracking.isActive}
          style={{
            padding: "4px 8px",
            fontSize: "10px",
            backgroundColor: timeTracking.isActive ? "#ccc" : "#17a2b8",
            color: "white",
            border: "none",
            borderRadius: "3px",
            cursor: timeTracking.isActive ? "not-allowed" : "pointer",
          }}
        >
          Resume
        </button>
        <button
          onClick={timeTracking.reset}
          style={{
            padding: "4px 8px",
            fontSize: "10px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "3px",
            cursor: "pointer",
          }}
        >
          Reset
        </button>
      </div>

      <div style={{ marginTop: "8px", fontSize: "10px", color: "#666" }}>
        localStorage key: time-tracking-{itemId}
      </div>
    </div>
  );
};

export default TimeTrackingDebug;
