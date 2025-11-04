"use client";

import React from "react";

import { useHydration } from "@/hooks/useHydration";

/**
 * Component wrapper để đảm bảo children chỉ render khi đã hydrate
 */
export const HydrationBoundary = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const isHydrated = useHydration();

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return <>{children}</>;
};
