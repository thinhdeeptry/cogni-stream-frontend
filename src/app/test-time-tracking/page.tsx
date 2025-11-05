"use client";

import dynamic from "next/dynamic";

// Dynamically import the test component to avoid SSR issues
const TimeTrackingTest = dynamic(
  () => import("../../test/time-tracking-test"),
  {
    ssr: false,
    loading: () => <p>Loading time tracking test...</p>,
  },
);

export default function TimeTrackingTestPage() {
  return (
    <div>
      <TimeTrackingTest />
    </div>
  );
}
