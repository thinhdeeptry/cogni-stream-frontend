/**
 * Admin Components Export Index
 * Central export file for all admin-related components
 */

// Approval System Components
export {
  ApprovalStatsCard,
  TimeAgo,
  StatusBadge,
  InstructorInfo,
  ApprovalActions,
  ContentTypeIcon,
  ApprovalTableSkeleton,
  ApprovalEmptyState,
} from "./ApprovalComponents";

// Pricing Management Components
export { AdminPricingManager } from "./AdminPricingManager";

// Re-export types
export type {
  StatsCardProps,
  TimeAgoProps,
  StatusBadgeProps,
  InstructorInfoProps,
  ApprovalActionsProps,
  ContentTypeIconProps,
  EmptyStateProps,
} from "./ApprovalComponents";
