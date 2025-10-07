/**
 * Admin Approval System Test Page
 * Comprehensive testing interface for all approval components
 */

"use client";

import Link from "next/link";
import React from "react";

import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Eye,
  FileText,
  Users,
  X,
} from "lucide-react";

import {
  ApprovalActions,
  ApprovalEmptyState,
  ApprovalStatsCard,
  ApprovalTableSkeleton,
  ContentTypeIcon,
  InstructorInfo,
  StatusBadge,
  TimeAgo,
} from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Admin Approval System Test Page
 * Comprehensive testing interface for all approval components
 */

export default function AdminApprovalTestPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showSkeleton, setShowSkeleton] = React.useState(false);

  // Sample data for testing
  const sampleInstructor = {
    user: {
      id: "1",
      name: "Nguyễn Văn A",
      email: "instructor@example.com",
      image: undefined,
    },
    headline: "Chuyên gia phát triển web với 10 năm kinh nghiệm",
    avgRating: 4.8,
    totalRatings: 245,
  };

  const handleApprove = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const handleReject = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const handleViewDetails = () => {
    alert("Viewing details...");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin/approvals">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">
              Test Approval Components
            </h1>
          </div>
          <p className="text-slate-600">
            Trang test toàn bộ components của hệ thống duyệt content
          </p>
        </div>

        {/* Stats Cards Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Stats Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <ApprovalStatsCard
              title="Khóa học chờ duyệt"
              count={12}
              icon={<BookOpen className="h-5 w-5" />}
              color="yellow"
              href="/admin/approvals/courses"
              description="Cần xét duyệt trong tuần này"
              trend={{ value: 15, isPositive: true }}
            />
            <ApprovalStatsCard
              title="Lớp học chờ duyệt"
              count={8}
              icon={<Users className="h-5 w-5" />}
              color="blue"
              href="/admin/approvals/classes"
              description="Chờ duyệt xuất bản"
            />
            <ApprovalStatsCard
              title="Bài học chờ duyệt"
              count={25}
              icon={<FileText className="h-5 w-5" />}
              color="orange"
              href="/admin/approvals/lessons"
              description="Nội dung mới từ giảng viên"
              trend={{ value: 8, isPositive: false }}
            />
            <ApprovalStatsCard
              title="Đã duyệt hôm nay"
              count={6}
              icon={<CheckCircle className="h-5 w-5" />}
              color="green"
              description="Tổng số đã xử lý"
            />
          </div>

          {/* Loading State */}
          <div className="mb-4">
            <Button
              onClick={() => setShowSkeleton(!showSkeleton)}
              variant="outline"
              size="sm"
            >
              Toggle Loading State
            </Button>
          </div>
          {showSkeleton && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ApprovalStatsCard
                title=""
                count={0}
                icon={<></>}
                color="yellow"
                isLoading={true}
              />
              <ApprovalStatsCard
                title=""
                count={0}
                icon={<></>}
                color="blue"
                isLoading={true}
              />
            </div>
          )}
        </div>

        {/* Status Badges Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Status Badges</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Course Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Course Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <StatusBadge status="PENDING_APPROVAL" type="course" />
                  <StatusBadge status="APPROVED" type="course" />
                  <StatusBadge status="REJECTED" type="course" />
                  <StatusBadge status="PUBLISHED" type="course" />
                </div>
              </CardContent>
            </Card>

            {/* Class Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Class Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <StatusBadge status="UPCOMING" type="class" />
                  <StatusBadge status="ONGOING" type="class" />
                  <StatusBadge status="COMPLETED" type="class" />
                  <StatusBadge status="CANCELLED" type="class" />
                </div>
              </CardContent>
            </Card>

            {/* Class Active Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Class Active Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <StatusBadge status="PENDING_APPROVAL" type="class-active" />
                  <StatusBadge status="APPROVED" type="class-active" />
                  <StatusBadge status="REJECTED" type="class-active" />
                  <StatusBadge status="PUBLISHED" type="class-active" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Content Type Icons */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Content Type Icons</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <ContentTypeIcon type="course" size="lg" showLabel />
                </div>
                <div className="text-center">
                  <ContentTypeIcon type="class" size="lg" showLabel />
                </div>
                <div className="text-center">
                  <ContentTypeIcon type="VIDEO" size="lg" showLabel />
                </div>
                <div className="text-center">
                  <ContentTypeIcon type="QUIZ" size="lg" showLabel />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructor Info */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Instructor Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Small Size</CardTitle>
              </CardHeader>
              <CardContent>
                <InstructorInfo instructor={sampleInstructor} size="sm" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Medium Size</CardTitle>
              </CardHeader>
              <CardContent>
                <InstructorInfo
                  instructor={sampleInstructor}
                  size="md"
                  showRating
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Large Size</CardTitle>
              </CardHeader>
              <CardContent>
                <InstructorInfo
                  instructor={sampleInstructor}
                  size="lg"
                  showRating
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Approval Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Approval Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Default Variant</CardTitle>
              </CardHeader>
              <CardContent>
                <ApprovalActions
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onViewDetails={handleViewDetails}
                  isProcessing={isLoading}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Compact Variant</CardTitle>
              </CardHeader>
              <CardContent>
                <ApprovalActions
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onViewDetails={handleViewDetails}
                  isProcessing={isLoading}
                  variant="compact"
                  size="sm"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Time Ago */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Time Ago</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <TimeAgo date={new Date()} />
                <TimeAgo date={new Date(Date.now() - 2 * 60 * 60 * 1000)} />
                <TimeAgo date={new Date(Date.now() - 24 * 60 * 60 * 1000)} />
                <TimeAgo
                  date={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
                />
                <TimeAgo date="2024-01-01" showIcon={false} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading Skeleton */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Loading Skeleton</h2>
          <ApprovalTableSkeleton rows={3} />
        </div>

        {/* Empty States */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Empty States</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <ApprovalEmptyState
                  type="course"
                  action={{
                    text: "Làm mới",
                    onClick: () => alert("Refreshing..."),
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <ApprovalEmptyState type="class" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <ApprovalEmptyState type="lesson" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
