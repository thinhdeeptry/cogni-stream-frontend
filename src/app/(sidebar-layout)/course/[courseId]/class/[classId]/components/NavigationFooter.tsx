"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";

interface NavigationFooterProps {
  currentIndex: number;
  totalItems: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  isSidebarOpen: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToggleSidebar: () => void;
  isVisible: boolean;
}

export function NavigationFooter({
  currentIndex,
  totalItems,
  canGoPrevious,
  canGoNext,
  isSidebarOpen,
  onPrevious,
  onNext,
  onToggleSidebar,
  isVisible,
}: NavigationFooterProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t px-6 py-3 z-1"
    >
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={!canGoPrevious}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Trước
        </Button>

        <span className="text-sm text-gray-600">
          {currentIndex + 1} / {totalItems}
        </span>

        <Button
          onClick={onNext}
          disabled={!canGoNext}
          className="bg-orange-500 hover:bg-orange-600"
        >
          Tiếp theo
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Sidebar toggle button */}
      <div className="absolute top-1/2 -translate-y-1/2 right-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleSidebar}
          className="flex items-center gap-2"
        >
          {isSidebarOpen ? (
            <>
              <EyeOff className="h-4 w-4" />
              <span className="hidden sm:inline">Ẩn</span>
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Hiện</span>
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
