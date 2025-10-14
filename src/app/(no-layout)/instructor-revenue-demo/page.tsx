import { Metadata } from "next";

import InstructorRevenuePage from "@/components/instructor/InstructorRevenuePage";

export const metadata: Metadata = {
  title: "Instructor Revenue Demo",
  description: "Demo page for instructor revenue tracking system",
};

export default function InstructorRevenueDemoPage() {
  return <InstructorRevenuePage />;
}
