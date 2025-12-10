import { useEffect, useState } from "react";

import {
  InstructorRegistration,
  RegistrationStatus,
} from "@/types/instructor/types";

import { getAllInstructorRegistrationsNoPagination } from "@/actions/instructorRegistrationAction";

import useUserStore from "@/stores/useUserStore";

export function useInstructorRegistrationStatus() {
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [registration, setRegistration] =
    useState<InstructorRegistration | null>(null);
  const [allUserRegistrations, setAllUserRegistrations] = useState<
    InstructorRegistration[]
  >([]);
  const [canApply, setCanApply] = useState(false);

  useEffect(() => {
    async function checkRegistrationStatus() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Nếu user đã là INSTRUCTOR thì không thể đăng ký nữa
        if (user.role === "INSTRUCTOR") {
          setCanApply(false);
          setLoading(false);
          return;
        }

        // Lấy tất cả đơn đăng ký của user hiện tại
        const allRegistrations =
          await getAllInstructorRegistrationsNoPagination();
        const userRegistrations = allRegistrations.filter(
          (reg) => reg.userId === user.id,
        );

        // Lưu tất cả đơn của user
        setAllUserRegistrations(userRegistrations);

        if (userRegistrations.length === 0) {
          setCanApply(true);
          setLoading(false);
          return;
        }

        // Ưu tiên hiển thị đơn PENDING hoặc APPROVED
        const pendingOrApproved = userRegistrations.find(
          (reg) =>
            reg.status === RegistrationStatus.PENDING ||
            reg.status === RegistrationStatus.APPROVED,
        );

        if (pendingOrApproved) {
          setRegistration(pendingOrApproved);
          setCanApply(false);
        } else {
          // Nếu chỉ có đơn REJECTED, hiển thị đơn mới nhất và cho phép apply
          const sortedByDate = [...userRegistrations].sort(
            (a, b) =>
              new Date(b.submittedAt).getTime() -
              new Date(a.submittedAt).getTime(),
          );
          setRegistration(sortedByDate[0]);
          setCanApply(true);
        }
      } catch (error) {
        console.error("Error checking registration status:", error);
        setCanApply(false);
      } finally {
        setLoading(false);
      }
    }

    checkRegistrationStatus();
  }, [user]);

  return {
    loading,
    registration,
    allUserRegistrations,
    canApply,
    isInstructor: user?.role === "INSTRUCTOR",
  };
}
