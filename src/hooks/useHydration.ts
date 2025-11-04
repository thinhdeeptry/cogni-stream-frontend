"use client";

import { useEffect, useState } from "react";

import useUserStore from "@/stores/useUserStore";

/**
 * Hook để đảm bảo app chỉ render khi Zustand store đã được hydrate
 * Giúp tránh hydration mismatch và đảm bảo data consistency
 */
export const useHydration = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const hydrated = useUserStore((state) => state.hydrated);

  useEffect(() => {
    // Đợi cho đến khi store được hydrate
    if (hydrated) {
      setIsHydrated(true);
    }
  }, [hydrated]);

  return isHydrated;
};
