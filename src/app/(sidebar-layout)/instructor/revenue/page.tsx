import { Metadata } from "next";

import InstructorRevenuePage from "@/components/instructor/InstructorRevenuePage";

export const metadata: Metadata = {
  title: "Doanh thu của tôi | Instructor Dashboard",
  description: "Theo dõi doanh thu và hoa hồng từ các khóa học và lớp học",
};

export default function InstructorRevenuePageRoute() {
  return <InstructorRevenuePage />;
}
