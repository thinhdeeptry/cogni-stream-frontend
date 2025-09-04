"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { toast } from "@/hooks/use-toast";
import { Video } from "lucide-react";

import { getMyClasses } from "@/actions/enrollmentActions";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ClassData {
  id: string;
  course: {
    id: string;
    title: string;
    thumbnailUrl: string;
  };
}

interface CourseData {
  id: string;
  title: string;
  thumbnailUrl: string;
}

interface MyClassesListProps {
  userId: string;
}

export default function MyClassesList({ userId }: MyClassesListProps) {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchMyClasses = async () => {
      try {
        setLoading(true);
        const result = await getMyClasses(userId);
        console.log("res: ", result);

        if (result.success && result.data && result.data.data) {
          setClasses(result.data.data.classes || []);
          setCourses(result.data.data.courses || []);
        } else {
          toast({
            title: "Lỗi",
            description: result.message || "Không thể tải dữ liệu",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching my classes:", error);
        toast({
          title: "Lỗi",
          description: "Có lỗi xảy ra khi tải dữ liệu",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchMyClasses();
    }
  }, [userId]);

  const handleViewCourse = (courseId: string) => {
    router.push(`/course/${courseId}`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse h-48" />
        ))}
      </div>
    );
  }

  if (classes.length === 0 && courses.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Chưa có lớp hoặc khóa học
          </h3>
          <p className="text-muted-foreground mb-4">
            Bạn chưa tham gia lớp học trực tiếp nào. Khám phá các khóa học để
            bắt đầu!
          </p>
          <Button onClick={() => router.push("/courses")}>
            Khám phá khóa học
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Gộp classes + courses lại để render chung
  const allItems = [
    ...classes.map((c) => ({
      id: c.id,
      title: c.course.title,
      thumbnailUrl: c.course.thumbnailUrl,
    })),
    ...courses,
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {allItems.map((item) => (
        <Card
          key={item.id}
          className="cursor-pointer hover:shadow-lg"
          onClick={() => handleViewCourse(item.id)}
        >
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="w-full h-40 object-cover rounded-t-lg"
          />
          <CardContent className="p-4">
            <h4 className="font-semibold text-lg text-center">{item.title}</h4>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
