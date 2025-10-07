import { useEffect, useState } from "react";

import { InstructorRegistration } from "@/types/instructor/types";

import { getAllInstructorRegistrationsNoPagination } from "@/actions/instructorRegistrationAction";

import useUserStore from "@/stores/useUserStore";

export function useInstructorRegistrationStatus() {
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [registration, setRegistration] =
    useState<InstructorRegistration | null>(null);
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

        // Lấy tất cả đơn đăng ký và tìm đơn của user hiện tại
        const allRegistrations =
          await getAllInstructorRegistrationsNoPagination();
        const userRegistration = allRegistrations.find(
          (reg) => reg.userId === user.id,
        );

        if (userRegistration) {
          setRegistration(userRegistration);
          setCanApply(false); // Đã có đơn đăng ký rồi
        } else {
          setCanApply(true); // Chưa có đơn đăng ký, có thể apply
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
    canApply,
    isInstructor: user?.role === "INSTRUCTOR",
  };
}
