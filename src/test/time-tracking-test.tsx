import React, { useEffect, useState } from "react";

import {
  formatTime,
  formatTimeMinutes,
  useTimeTracking,
} from "../hooks/useTimeTracking";

const TimeTrackingTest: React.FC = () => {
  const [completionCount, setCompletionCount] = useState(0);
  const [testLogs, setTestLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[TimeTrackingTest] ${message}`);
  };

  const handleTimeComplete = () => {
    setCompletionCount((prev) => prev + 1);
    addLog(`🎉 Time tracking completed! Count: ${completionCount + 1}`);
  };

  // Test with short duration for quick verification
  const timeTracking = useTimeTracking({
    itemId: "test-lesson-123",
    requiredMinutes: 0.1, // 6 seconds for quick testing
    onTimeComplete: handleTimeComplete,
  });

  useEffect(() => {
    addLog("TimeTrackingTest component mounted");
  }, []);

  useEffect(() => {
    addLog(
      `Timer state changed - Active: ${timeTracking.isActive}, Elapsed: ${timeTracking.elapsedSeconds}s, Complete: ${timeTracking.isTimeComplete}, Progress: ${timeTracking.progress.toFixed(1)}%`,
    );
  }, [
    timeTracking.isActive,
    timeTracking.elapsedSeconds,
    timeTracking.isTimeComplete,
    timeTracking.progress,
  ]);

  const clearLogs = () => {
    setTestLogs([]);
  };

  const resetAll = () => {
    timeTracking.reset();
    setCompletionCount(0);
    addLog("🔄 Reset all states");
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>🕒 Time Tracking Test</h2>

      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          border: "1px solid #ddd",
          borderRadius: "5px",
        }}
      >
        <h3>Current Status</h3>
        <p>
          <strong>Is Active:</strong> {timeTracking.isActive ? "✅" : "❌"}
        </p>
        <p>
          <strong>Elapsed Time:</strong>{" "}
          {formatTime(timeTracking.elapsedSeconds)} (
          {timeTracking.elapsedSeconds}s)
        </p>
        <p>
          <strong>Required Time:</strong> 6 seconds (0.1 minutes)
        </p>
        <p>
          <strong>Progress:</strong> {timeTracking.progress.toFixed(1)}%
        </p>
        <p>
          <strong>Is Complete:</strong>{" "}
          {timeTracking.isTimeComplete ? "✅" : "❌"}
        </p>
        <p>
          <strong>Remaining:</strong> {timeTracking.remainingMinutes} minutes
        </p>
        <p>
          <strong>Completion Count:</strong> {completionCount}
        </p>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Controls</h3>
        <button
          onClick={timeTracking.start}
          style={{
            margin: "5px",
            padding: "10px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "3px",
          }}
          disabled={timeTracking.isActive}
        >
          ▶️ Start
        </button>
        <button
          onClick={timeTracking.pause}
          style={{
            margin: "5px",
            padding: "10px",
            backgroundColor: "#ffc107",
            color: "black",
            border: "none",
            borderRadius: "3px",
          }}
          disabled={!timeTracking.isActive}
        >
          ⏸️ Pause
        </button>
        <button
          onClick={timeTracking.resume}
          style={{
            margin: "5px",
            padding: "10px",
            backgroundColor: "#17a2b8",
            color: "white",
            border: "none",
            borderRadius: "3px",
          }}
          disabled={timeTracking.isActive}
        >
          ▶️ Resume
        </button>
        <button
          onClick={resetAll}
          style={{
            margin: "5px",
            padding: "10px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "3px",
          }}
        >
          🔄 Reset
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Test Logs</h3>
        <button
          onClick={clearLogs}
          style={{
            marginBottom: "10px",
            padding: "5px 10px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "3px",
          }}
        >
          Clear Logs
        </button>
        <div
          style={{
            height: "200px",
            overflowY: "scroll",
            backgroundColor: "#f8f9fa",
            padding: "10px",
            border: "1px solid #ddd",
            borderRadius: "3px",
            fontSize: "12px",
            fontFamily: "monospace",
          }}
        >
          {testLogs.length === 0 ? (
            <p style={{ color: "#6c757d" }}>No logs yet...</p>
          ) : (
            testLogs.map((log, index) => (
              <div key={index} style={{ marginBottom: "2px" }}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      <div
        style={{
          backgroundColor: "#e9ecef",
          padding: "15px",
          borderRadius: "5px",
        }}
      >
        <h3>Instructions</h3>
        <ol>
          <li>Click "Start" to begin time tracking</li>
          <li>Watch the elapsed time increase every second</li>
          <li>After 6 seconds, it should automatically complete</li>
          <li>Try pause/resume to test state management</li>
          <li>Check browser localStorage for persistence</li>
          <li>Use Reset to clear all data</li>
        </ol>
      </div>
    </div>
  );
};

export default TimeTrackingTest;
