"use client";

import { useEffect, useState } from "react";

export default function Loading({ isLoading }: { isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }
}
