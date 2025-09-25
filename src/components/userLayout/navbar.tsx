"use client";

import Link from "next/link";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { Course } from "@/types/course/types";
import {
  Bell,
  BookOpen,
  Clock,
  LogOut,
  Search,
  Settings,
  User,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";

// import { checkEnrollmentStatus } from "@/actions/enrollmentActions";
import { getMyClasses } from "@/actions/enrollmentActions";

import { useProgressStore } from "@/stores/useProgressStore";

import CourseProgress from "@/components/course/CourseProgress";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface NavbarProps {
  isLoggedIn?: boolean;
  image?: string;
  userName?: string;
  onLogout?: () => void;
}

export default function Navbar({
  isLoggedIn = false,
  image = "",
  userName = "User",
  onLogout,
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);
  const { data: session } = useSession();
  const { enrollmentId, currentCourseId } = useProgressStore();
  const [isCurrentCourseEnrolled, setIsCurrentCourseEnrolled] = useState(false);
  const [myClasses, setMyClasses] = useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Fetch my classes
  useEffect(() => {
    const fetchMyClasses = async () => {
      if (session?.user?.id && isLoggedIn) {
        setLoadingClasses(true);
        try {
          const result = await getMyClasses(session.user.id);
          if (result.success) {
            // API trả về { data: { data: [...] } }, nên cần lấy result.data.data
            const classesData = result.data?.data || result.data || [];
            setMyClasses(
              Array.isArray(classesData.data) ? classesData.data : [],
            );
          } else {
            setMyClasses([]);
          }
        } catch (error) {
          console.error("Error fetching my classes:", error);
          setMyClasses([]);
        } finally {
          setLoadingClasses(false);
        }
      }
    };

    fetchMyClasses();
  }, [session?.user?.id, isLoggedIn]);

  // Check if we're in a lesson page
  const isLessonPage =
    pathname?.includes("/course/") && pathname?.includes("/lesson/");

  // Check if we're on the home page
  const isHomePage = pathname === "/";
  const clearSearch = () => {
    setSearchQuery("");
    if (searchParams.has("q")) {
      router.push("/");
    }
  };

  // Initialize search query from URL on mount
  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  // Check enrollment status for current course and compare with store
  // useEffect(() => {
  //   const pageCourseId = params?.courseId as string;

  //   const checkCurrentCourseEnrollment = async () => {
  //     if (pageCourseId && session?.user?.id && isLessonPage) {
  //       try {
  //         // Chỉ hiển thị progress nếu khóa học đang xem trùng với khóa học trong store
  //         // và có enrollmentId (đã đăng ký)
  //         if (pageCourseId === currentCourseId && enrollmentId) {
  //           setIsCurrentCourseEnrolled(true);
  //         } else {
  //           const result = await checkEnrollmentStatus(
  //             pageCourseId,
  //             session.user.id,
  //           );
  //           setIsCurrentCourseEnrolled(
  //             result.data && pageCourseId === currentCourseId,
  //           );
  //         }
  //       } catch (err) {
  //         console.error("Error checking enrollment for current course:", err);
  //         setIsCurrentCourseEnrolled(false);
  //       }
  //     } else {
  //       setIsCurrentCourseEnrolled(false);
  //     }
  //   };

  //   checkCurrentCourseEnrollment();
  // }, [
  //   params.courseId,
  //   session?.user?.id,
  //   isLessonPage,
  //   currentCourseId,
  //   enrollmentId,
  // ]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirect to home page with search query
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      return "Vừa học";
    } else if (diffInHours < 24) {
      return `${diffInHours} giờ trước`;
    } else if (diffInDays < 7) {
      return `${diffInDays} ngày trước`;
    } else {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} tuần trước`;
    }
  };

  const handleCourseClick = (courseId: string) => {
    router.push(`/course/${courseId}`);
  };

  const handleViewAllClasses = () => {
    router.push("/user/profile?tab=classes");
  };

  return (
    <header className="w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo and Brand */}
        <Link href="/" className="flex items-center gap-3">
          {/* <div className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-500 text-white font-bold text-xl">
            EF
          </div> */}
          <img
            src="/images/logo.jpg"
            alt="logo"
            className="h-10 w-10 rounded-lg"
          />
          <h1 className="hidden text-lg font-semibold md:block hover:cursor-pointer text-orange-400">
            CogniStream
          </h1>
        </Link>

        {/* Search Bar and Progress */}
        <div className="relative mx-4 flex-1 max-w-md flex items-center gap-4 ">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Tìm kiếm khóa học, bài viết, video, ..."
              className="w-full rounded-full border-gray-200 pl-10 pr-10"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                // Clear search results and redirect to home page if search field is empty
                if (e.target.value === "" && searchParams.has("q")) {
                  router.push("/");
                }
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 hover:text-gray-600 rounded-full flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>
          {isLessonPage &&
            isLoggedIn &&
            isCurrentCourseEnrolled &&
            enrollmentId && <CourseProgress />}
        </div>

        {/* Auth Buttons or User Info */}
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-sm font-medium hover:bg-gray-100"
                  >
                    {/* <BookOpen className="mr-2 h-4 w-4" /> */}
                    <span className="hidden md:block">Khóa học của tôi</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="p-3 border-b">
                    <h4 className="font-semibold text-sm">Khóa học của tôi</h4>
                  </div>
                  <div className="max-h-96">
                    {loadingClasses ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Đang tải...
                      </div>
                    ) : !Array.isArray(myClasses) || myClasses.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Chưa có khóa học nào
                      </div>
                    ) : (
                      <>
                        {myClasses.slice(0, 5).map((enrollment) => {
                          const courseData =
                            enrollment.class?.course || enrollment.course;
                          return (
                            <DropdownMenuItem
                              key={enrollment.id}
                              className="p-3 cursor-pointer"
                              onClick={() => handleCourseClick(courseData?.id)}
                            >
                              <div className="flex items-center gap-3 w-full">
                                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                  <img
                                    src={
                                      courseData?.thumbnailUrl ||
                                      "/placeholder-course.jpg"
                                    }
                                    alt={courseData?.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-medium text-sm truncate">
                                    {courseData?.title}
                                  </h5>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                      <div
                                        className="bg-orange-500 h-1.5 rounded-full transition-all"
                                        style={{
                                          width: `${enrollment.progress || 0}%`,
                                        }}
                                      />
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {enrollment.progress || 0}%
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 mt-1">
                                    <Clock className="h-3 w-3 text-gray-400" />
                                    <span className="text-xs text-gray-500">
                                      {formatTimeAgo(enrollment.updatedAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </DropdownMenuItem>
                          );
                        })}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="p-3 text-center cursor-pointer text-orange-600 hover:text-orange-700"
                          onClick={handleViewAllClasses}
                        >
                          Xem tất cả
                        </DropdownMenuItem>
                      </>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* <NotificationBell userId={session?.user?.id || ""} /> */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 rounded-full"
                  >
                    <Avatar className="h-8 w-8 border cursor-pointer">
                      <AvatarImage
                        src={image}
                        alt={userName}
                        onError={(e) => {
                          console.error("Avatar load error:", e);
                          // Use a more reliable fallback mechanism
                          const target = e.currentTarget as HTMLImageElement;
                          target.onerror = null; // Prevent infinite error loop
                          target.src = "/default-avatar.png";
                        }}
                      />
                      <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="hidden text-sm font-medium md:block">
                      {userName}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{userName}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      router.push("/user/profile");
                    }}
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Trang cá nhân</span>
                  </DropdownMenuItem>
                  {/* <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Cài đặt</span>
                  </DropdownMenuItem> */}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/auth/register">
                <Button variant="ghost" className="text-sm font-medium">
                  Đăng ký
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button className="bg-orange-500 text-white hover:bg-orange-600">
                  Đăng nhập
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
