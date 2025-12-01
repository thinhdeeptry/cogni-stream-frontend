"use client";

import { motion } from "framer-motion";
import { Award, ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";

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
  // Certificate props
  hasCertificate?: boolean;
  certificateId?: string | null;
  onCertificateClick?: () => void;
  allItemsCompleted?: boolean;
  // Attendance props
  disabledReason?: string; // Reason why next button is disabled
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
  hasCertificate = false,
  certificateId = null,
  onCertificateClick,
  allItemsCompleted = false,
  disabledReason,
}: NavigationFooterProps) {
  if (!isVisible) return null;
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t px-6 py-3 z-50"
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

        {/* Show certificate button if course is completed */}
        {allItemsCompleted ? (
          <Button
            onClick={onCertificateClick}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white transition-all duration-300"
          >
            <Award className="h-4 w-4 mr-2" />
            {certificateId ? "Xem bằng" : "Nhận bằng"}
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={!canGoNext}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
            title={!canGoNext && disabledReason ? disabledReason : undefined}
          >
            Tiếp theo
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}

        {/* Show disabled reason below button if provided */}
        {!canGoNext && disabledReason && !allItemsCompleted && (
          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2">
            <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
              {disabledReason}
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
          </div>
        )}
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
