"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import {
  PaginatedRatings,
  RatingStats,
  Rating as RatingType,
} from "@/types/rating/types";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Filter, Search, Star, ThumbsUp, User, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import {
  createRating,
  getCourseRatingStats,
  getCourseRatings,
  getUserRatingForCourse,
  updateRating,
} from "@/actions/ratingActions";

import { Rating } from "@/components/rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseName: string;
  classId?: string;
}

export function RatingModal({
  isOpen,
  onClose,
  courseId,
  courseName,
  classId,
}: RatingModalProps) {
  const { data: session } = useSession();
  const [ratings, setRatings] = useState<RatingType[]>([]);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [userRating, setUserRating] = useState<RatingType | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState<number | null>(null);

  // Rating form states
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [ratingFormData, setRatingFormData] = useState({
    stars: 0,
    content: "",
  });
  const [submittingRating, setSubmittingRating] = useState(false);

  const fetchData = async (pageNum = 1) => {
    if (!isOpen) return;

    setLoading(true);
    try {
      const [ratingsResponse, statsResponse, userRatingResponse] =
        await Promise.all([
          getCourseRatings(courseId, pageNum, 10),
          getCourseRatingStats(courseId),
          session?.user ? getUserRatingForCourse(courseId, classId) : null,
        ]);

      setRatings(ratingsResponse.ratings);
      setTotalPages(ratingsResponse.pagination.totalPages);
      setStats(statsResponse);
      setUserRating(userRatingResponse);

      // Pre-fill form if user has existing rating
      if (userRatingResponse) {
        setRatingFormData({
          stars: userRatingResponse.stars,
          content: userRatingResponse.content || "",
        });
      }
    } catch (error) {
      console.error("Error fetching rating data:", error);
      toast.error("Không thể tải dữ liệu đánh giá");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!session?.user) {
      toast.error("Vui lòng đăng nhập để đánh giá");
      return;
    }

    if (ratingFormData.stars === 0) {
      toast.error("Vui lòng chọn số sao đánh giá");
      return;
    }

    setSubmittingRating(true);
    try {
      const ratingData = {
        stars: ratingFormData.stars,
        content: ratingFormData.content.trim(),
        courseId,
        ...(classId && { classId }),
      };

      let result;
      if (userRating) {
        // Update existing rating
        result = await updateRating(userRating.id, {
          stars: ratingFormData.stars,
          content: ratingFormData.content.trim(),
        });
      } else {
        // Create new rating
        result = await createRating(ratingData);
      }

      if (result.success) {
        toast.success(
          userRating ? "Cập nhật đánh giá thành công" : "Đánh giá thành công",
        );
        setShowRatingForm(false);
        setUserRating(result.data || null);
        fetchData(1); // Refresh ratings
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("Có lỗi xảy ra khi đánh giá");
    } finally {
      setSubmittingRating(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setPage(1);
    }
  }, [isOpen, courseId, classId]);

  const filteredRatings = ratings.filter((rating) => {
    const matchesSearch =
      !searchTerm ||
      rating.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rating.student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterRating || rating.stars === filterRating;
    return matchesSearch && matchesFilter;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-4xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Đánh giá khóa học
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">{courseName}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-10 w-10 rounded-full hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Stats Summary */}
              {stats && (
                <div className="mt-4 flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-5 w-5",
                            i < Math.floor(stats.avgRating)
                              ? "text-yellow-500 fill-current"
                              : "text-gray-300",
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-semibold">
                      {stats.avgRating.toFixed(1)}
                    </span>
                    <span className="text-gray-500">
                      ({stats.totalRatings} đánh giá)
                    </span>
                  </div>

                  {session?.user && (
                    <Button
                      onClick={() => setShowRatingForm(!showRatingForm)}
                      variant="outline"
                      size="sm"
                      className="ml-auto"
                    >
                      {userRating ? "Sửa đánh giá" : "Viết đánh giá"}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Rating Distribution */}
            {stats && (
              <div className="px-6 py-4 bg-gray-50 border-b">
                <div className="grid grid-cols-5 gap-2">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <button
                      key={star}
                      onClick={() =>
                        setFilterRating(filterRating === star ? null : star)
                      }
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-md transition-colors",
                        filterRating === star
                          ? "bg-orange-100 text-orange-700"
                          : "hover:bg-gray-100",
                      )}
                    >
                      <span className="text-sm font-medium">{star}</span>
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{
                            width: `${
                              stats.totalRatings > 0
                                ? (stats.ratingDistribution[
                                    star.toString() as
                                      | "1"
                                      | "2"
                                      | "3"
                                      | "4"
                                      | "5"
                                  ] /
                                    stats.totalRatings) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {stats.ratingDistribution[
                          star.toString() as "1" | "2" | "3" | "4" | "5"
                        ] || 0}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search & Filter */}
            <div className="px-6 py-4 border-b bg-white">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm đánh giá..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {filterRating && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 px-3 py-2"
                  >
                    {filterRating} <Star className="h-3 w-3" />
                    <button
                      onClick={() => setFilterRating(null)}
                      className="ml-1 hover:text-gray-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </div>

            {/* Rating Form */}
            <AnimatePresence>
              {showRatingForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b bg-orange-50 overflow-hidden"
                >
                  <div className="p-6">
                    <h3 className="font-semibold mb-4">
                      {userRating ? "Sửa đánh giá của bạn" : "Viết đánh giá"}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Đánh giá sao
                        </label>
                        <Rating
                          value={ratingFormData.stars}
                          onChange={(value) =>
                            setRatingFormData((prev) => ({
                              ...prev,
                              stars: value,
                            }))
                          }
                          size="lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Nội dung đánh giá (tùy chọn)
                        </label>
                        <Textarea
                          placeholder="Chia sẻ trải nghiệm của bạn về khóa học..."
                          value={ratingFormData.content}
                          onChange={(e) =>
                            setRatingFormData((prev) => ({
                              ...prev,
                              content: e.target.value,
                            }))
                          }
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSubmitRating}
                          disabled={
                            submittingRating || ratingFormData.stars === 0
                          }
                          className="bg-orange-500 hover:bg-orange-600"
                        >
                          {submittingRating ? "Đang gửi..." : "Gửi đánh giá"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowRatingForm(false)}
                        >
                          Hủy
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Ratings List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-6">
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full" />
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded mb-2" />
                            <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                            <div className="h-16 bg-gray-200 rounded" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : filteredRatings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Star className="h-12 w-12 mb-4" />
                  <p>
                    {searchTerm || filterRating
                      ? "Không tìm thấy đánh giá phù hợp"
                      : "Chưa có đánh giá nào"}
                  </p>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {filteredRatings.map((rating) => (
                    <motion.div
                      key={rating.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={rating.student.image} />
                        <AvatarFallback>
                          {rating.student.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{rating.student.name}</h4>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-4 w-4",
                                  i < rating.stars
                                    ? "text-yellow-500 fill-current"
                                    : "text-gray-300",
                                )}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(rating.createdAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </span>
                        </div>
                        {rating.content && (
                          <p className="text-gray-700 leading-relaxed">
                            {rating.content}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="sticky bottom-0 bg-white border-t p-4">
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                  >
                    Trước
                  </Button>
                  <span className="px-4 py-2 text-sm">
                    Trang {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                  >
                    Tiếp
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
