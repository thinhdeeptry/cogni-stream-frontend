/**
 * Shared components for Admin Approval System
 * Reusable UI components for course, class, and lesson approval workflows
 */
import Link from "next/link";
import React from "react";

import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  GraduationCap,
  TrendingUp,
  User,
  Users,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ==========================================
// STATS CARD COMPONENT
// ==========================================

export interface StatsCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  color: "yellow" | "blue" | "green" | "orange" | "red" | "purple";
  href?: string;
  description?: string;
  isLoading?: boolean;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const ApprovalStatsCard: React.FC<StatsCardProps> = ({
  title,
  count,
  icon,
  color,
  href,
  description,
  isLoading = false,
  trend,
}) => {
  const colorClasses = {
    yellow:
      "border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100",
    blue: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
    green: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
    orange:
      "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100",
    red: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
    purple:
      "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100",
  };

  const CardWrapper = href
    ? ({ children }: { children: React.ReactNode }) => (
        <Link href={href}>
          <Card
            className={`cursor-pointer transition-all duration-200 ${colorClasses[color]} border-2 hover:shadow-md`}
          >
            {children}
          </Card>
        </Link>
      )
    : ({ children }: { children: React.ReactNode }) => (
        <Card className={`${colorClasses[color]} border-2`}>{children}</Card>
      );

  if (isLoading) {
    return (
      <Card className="border-2 border-slate-200 bg-slate-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-24 bg-slate-200 animate-pulse rounded"></div>
          <div className="h-5 w-5 bg-slate-200 animate-pulse rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-16 bg-slate-200 animate-pulse rounded mb-1"></div>
          <div className="h-3 w-32 bg-slate-200 animate-pulse rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <CardWrapper>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {trend && (
            <div
              className={`flex items-center text-xs ${
                trend.isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              <TrendingUp
                className={`h-3 w-3 mr-1 ${
                  !trend.isPositive ? "rotate-180" : ""
                }`}
              />
              {Math.abs(trend.value)}%
            </div>
          )}
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1">{count.toLocaleString()}</div>
        {description && <p className="text-xs opacity-80">{description}</p>}
      </CardContent>
    </CardWrapper>
  );
};

// ==========================================
// TIME AGO COMPONENT
// ==========================================

export interface TimeAgoProps {
  date: string | Date;
  showIcon?: boolean;
  className?: string;
}

export const TimeAgo: React.FC<TimeAgoProps> = ({
  date,
  showIcon = true,
  className = "",
}) => {
  const getTimeAgo = (dateInput: string | Date) => {
    const dateObj =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return "Vừa xong";
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ngày trước`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} tuần trước`;
    const months = Math.floor(days / 30);
    return `${months} tháng trước`;
  };

  return (
    <div
      className={`flex items-center gap-2 text-sm text-slate-500 ${className}`}
    >
      {showIcon && <Clock className="h-4 w-4" />}
      <span>{getTimeAgo(date)}</span>
    </div>
  );
};

// ==========================================
// STATUS BADGE COMPONENT
// ==========================================

export interface StatusBadgeProps {
  status: string;
  type: "course" | "class" | "lesson" | "class-active";
  size?: "sm" | "md" | "lg";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type,
  size = "md",
}) => {
  const getStatusConfig = () => {
    if (type === "course") {
      switch (status) {
        case "PENDING_APPROVAL":
          return {
            color: "bg-yellow-100 text-yellow-800",
            icon: "⏳",
            text: "Chờ duyệt",
          };
        case "APPROVED":
          return {
            color: "bg-green-100 text-green-800",
            icon: "✅",
            text: "Đã duyệt",
          };
        case "REJECTED":
          return {
            color: "bg-red-100 text-red-800",
            icon: "❌",
            text: "Bị từ chối",
          };
        case "PUBLISHED":
          return {
            color: "bg-blue-100 text-blue-800",
            icon: "🌐",
            text: "Đã xuất bản",
          };
        default:
          return {
            color: "bg-slate-100 text-slate-800",
            icon: "❓",
            text: status,
          };
      }
    }

    if (type === "class") {
      switch (status) {
        case "UPCOMING":
          return {
            color: "bg-cyan-100 text-cyan-800",
            icon: "📅",
            text: "Sắp diễn ra",
          };
        case "ONGOING":
          return {
            color: "bg-orange-100 text-orange-800",
            icon: "🏃",
            text: "Đang diễn ra",
          };
        case "COMPLETED":
          return {
            color: "bg-green-100 text-green-800",
            icon: "🏁",
            text: "Hoàn thành",
          };
        case "CANCELLED":
          return {
            color: "bg-red-100 text-red-800",
            icon: "❌",
            text: "Đã hủy",
          };
        default:
          return {
            color: "bg-slate-100 text-slate-800",
            icon: "❓",
            text: status,
          };
      }
    }

    if (type === "class-active") {
      switch (status) {
        case "PENDING_APPROVAL":
          return {
            color: "bg-yellow-100 text-yellow-800",
            icon: "⏳",
            text: "Chờ duyệt xuất bản",
          };
        case "APPROVED":
          return {
            color: "bg-green-100 text-green-800",
            icon: "✅",
            text: "Đã duyệt xuất bản",
          };
        case "REJECTED":
          return {
            color: "bg-red-100 text-red-800",
            icon: "❌",
            text: "Bị từ chối xuất bản",
          };
        case "PUBLISHED":
          return {
            color: "bg-blue-100 text-blue-800",
            icon: "🌐",
            text: "Đã xuất bản",
          };
        default:
          return {
            color: "bg-slate-100 text-slate-800",
            icon: "❓",
            text: status,
          };
      }
    }

    if (type === "lesson") {
      switch (status) {
        case "PENDING_APPROVAL":
          return {
            color: "bg-yellow-100 text-yellow-800",
            icon: "⏳",
            text: "Chờ duyệt",
          };
        case "APPROVED":
          return {
            color: "bg-green-100 text-green-800",
            icon: "✅",
            text: "Đã duyệt",
          };
        case "REJECTED":
          return {
            color: "bg-red-100 text-red-800",
            icon: "❌",
            text: "Bị từ chối",
          };
        case "PUBLISHED":
          return {
            color: "bg-blue-100 text-blue-800",
            icon: "🌐",
            text: "Đã xuất bản",
          };
        default:
          return {
            color: "bg-slate-100 text-slate-800",
            icon: "❓",
            text: status,
          };
      }
    }

    return { color: "bg-slate-100 text-slate-800", icon: "❓", text: status };
  };

  const config = getStatusConfig();
  const sizeClass = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  }[size];

  return (
    <Badge className={`${config.color} ${sizeClass} font-medium`}>
      <span className="mr-1">{config.icon}</span>
      {config.text}
    </Badge>
  );
};

// ==========================================
// INSTRUCTOR INFO COMPONENT
// ==========================================

export interface InstructorInfoProps {
  instructor: {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
    };
    headline?: string;
    avgRating?: number;
    totalRatings?: number;
  };
  size?: "sm" | "md" | "lg";
  showEmail?: boolean;
  showRating?: boolean;
}

export const InstructorInfo: React.FC<InstructorInfoProps> = ({
  instructor,
  size = "md",
  showEmail = true,
  showRating = false,
}) => {
  const avatarSize = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  }[size];

  const textSize = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }[size];

  return (
    <div className="flex items-center gap-3">
      <Avatar className={avatarSize}>
        <AvatarImage src={instructor.user.image} />
        <AvatarFallback className={textSize}>
          {instructor.user.name?.charAt(0)?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className={`font-medium ${textSize}`}>{instructor.user.name}</p>
        {showEmail && (
          <p
            className={`text-slate-500 ${size === "sm" ? "text-xs" : "text-xs"}`}
          >
            {instructor.user.email}
          </p>
        )}
        {showRating && instructor.avgRating && (
          <div
            className={`flex items-center gap-1 ${size === "sm" ? "text-xs" : "text-xs"} text-slate-600`}
          >
            <span>⭐ {instructor.avgRating.toFixed(1)}</span>
            <span>({instructor.totalRatings || 0} đánh giá)</span>
          </div>
        )}
        {instructor.headline && size !== "sm" && (
          <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
            {instructor.headline}
          </p>
        )}
      </div>
    </div>
  );
};

// ==========================================
// APPROVAL ACTIONS COMPONENT
// ==========================================

export interface ApprovalActionsProps {
  onApprove: () => void;
  onReject: () => void;
  onViewDetails?: () => void;
  isProcessing?: boolean;
  approveText?: string;
  rejectText?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "compact";
}

export const ApprovalActions: React.FC<ApprovalActionsProps> = ({
  onApprove,
  onReject,
  onViewDetails,
  isProcessing = false,
  approveText = "Duyệt",
  rejectText = "Từ chối",
  size = "md",
  variant = "default",
}) => {
  const buttonSize = size === "sm" ? "sm" : size === "lg" ? "lg" : "default";

  if (variant === "compact") {
    return (
      <div className="flex justify-end gap-1">
        {onViewDetails && (
          <Button
            variant="outline"
            size={buttonSize}
            onClick={onViewDetails}
            className="px-2"
            disabled={isProcessing}
          >
            <Eye className="h-3 w-3" />
          </Button>
        )}
        <Button
          size={buttonSize}
          className="bg-green-500 hover:bg-green-600 text-white px-2"
          onClick={onApprove}
          disabled={isProcessing}
        >
          <CheckCircle className="h-3 w-3" />
        </Button>
        <Button
          size={buttonSize}
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50 px-2"
          onClick={onReject}
          disabled={isProcessing}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex justify-end gap-2">
      {onViewDetails && (
        <Button
          variant="outline"
          size={buttonSize}
          onClick={onViewDetails}
          className="flex items-center gap-1"
          disabled={isProcessing}
        >
          <Eye className="h-3 w-3" />
          Chi tiết
        </Button>
      )}

      <Button
        size={buttonSize}
        className="bg-green-500 hover:bg-green-600 text-white"
        onClick={onApprove}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <div className="flex items-center gap-1">
            <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
            Đang xử lý...
          </div>
        ) : (
          <>
            <CheckCircle className="h-3 w-3 mr-1" />
            {approveText}
          </>
        )}
      </Button>

      <Button
        size={buttonSize}
        variant="outline"
        className="border-red-200 text-red-600 hover:bg-red-50"
        onClick={onReject}
        disabled={isProcessing}
      >
        <X className="h-3 w-3 mr-1" />
        {rejectText}
      </Button>
    </div>
  );
};

// ==========================================
// CONTENT TYPE ICON COMPONENT
// ==========================================

export interface ContentTypeIconProps {
  type: "course" | "class" | "lesson" | "VIDEO" | "BLOG" | "QUIZ" | "MIXED";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export const ContentTypeIcon: React.FC<ContentTypeIconProps> = ({
  type,
  size = "md",
  showLabel = false,
}) => {
  const iconSize = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }[size];

  const getTypeConfig = () => {
    switch (type) {
      case "course":
        return {
          icon: <BookOpen className={`${iconSize} text-blue-500`} />,
          label: "Khóa học",
        };
      case "class":
        return {
          icon: <GraduationCap className={`${iconSize} text-purple-500`} />,
          label: "Lớp học",
        };
      case "lesson":
      case "BLOG":
        return {
          icon: <FileText className={`${iconSize} text-green-500`} />,
          label: "Bài học",
        };
      case "VIDEO":
        return {
          icon: <div className={`${iconSize} text-red-500`}>🎥</div>,
          label: "Video",
        };
      case "QUIZ":
        return {
          icon: <div className={`${iconSize} text-orange-500`}>❓</div>,
          label: "Quiz",
        };
      case "MIXED":
        return {
          icon: <div className={`${iconSize} text-purple-500`}>🔀</div>,
          label: "Hỗn hợp",
        };
      default:
        return {
          icon: <FileText className={`${iconSize} text-slate-500`} />,
          label: "Khác",
        };
    }
  };

  const config = getTypeConfig();

  if (!showLabel) {
    return config.icon;
  }

  return (
    <div className="flex items-center gap-2">
      {config.icon}
      <span
        className={`${
          size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm"
        } text-slate-700`}
      >
        {config.label}
      </span>
    </div>
  );
};

// ==========================================
// LOADING SKELETON COMPONENT
// ==========================================

export const ApprovalTableSkeleton: React.FC<{ rows?: number }> = ({
  rows = 5,
}) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="p-4 border-b border-slate-200">
        <div className="h-4 w-64 bg-slate-200 animate-pulse rounded"></div>
      </div>
      <div className="divide-y divide-slate-200">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-slate-200 animate-pulse rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 w-48 bg-slate-200 animate-pulse rounded"></div>
                <div className="h-3 w-32 bg-slate-200 animate-pulse rounded"></div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-20 bg-slate-200 animate-pulse rounded"></div>
              <div className="h-8 w-16 bg-slate-200 animate-pulse rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// EMPTY STATE COMPONENT
// ==========================================

export interface EmptyStateProps {
  type: "course" | "class" | "lesson";
  title?: string;
  description?: string;
  action?: {
    text: string;
    onClick: () => void;
  };
}

export const ApprovalEmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  action,
}) => {
  const getDefaultContent = () => {
    switch (type) {
      case "course":
        return {
          icon: <BookOpen className="h-12 w-12 text-slate-400" />,
          title: "Không có khóa học nào chờ duyệt",
          description:
            "Tất cả khóa học đã được xét duyệt hoặc chưa có khóa học mới nào được gửi.",
        };
      case "class":
        return {
          icon: <GraduationCap className="h-12 w-12 text-slate-400" />,
          title: "Không có lớp học nào chờ duyệt",
          description:
            "Tất cả lớp học đã được xét duyệt xuất bản hoặc chưa có lớp học mới nào được gửi.",
        };
      case "lesson":
        return {
          icon: <FileText className="h-12 w-12 text-slate-400" />,
          title: "Không có bài học nào chờ duyệt",
          description:
            "Tất cả bài học đã được xét duyệt hoặc chưa có bài học mới nào được gửi.",
        };
    }
  };

  const defaultContent = getDefaultContent();

  return (
    <div className="text-center py-12">
      <div className="flex justify-center mb-4">{defaultContent.icon}</div>
      <h3 className="text-lg font-medium text-slate-900 mb-2">
        {title || defaultContent.title}
      </h3>
      <p className="text-slate-500 mb-6 max-w-md mx-auto">
        {description || defaultContent.description}
      </p>
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.text}
        </Button>
      )}
    </div>
  );
};
