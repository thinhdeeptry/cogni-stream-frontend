"use server";

import { AxiosFactory } from "@/lib/axios";
import { Category, Course } from "@/types/course/types";

const courseApi = AxiosFactory.getApiInstance("course");

export const getAllCourses = async (): Promise<Course[]> => {
  try {
    const { data } = await courseApi.get("/courses");
    return data;
  } catch (error) {
    throw error;
  }
};

export const getCourseById = async (courseId: string): Promise<Course> => {
  try {
    const { data } = await courseApi.get(`/courses/${courseId}`);
    return data;
  } catch (error) {
    throw error;
  }
};

export const getCoursesByCategory = async (
  categoryId: string,
): Promise<Course[]> => {
  try {
    const { data } = await courseApi.get(`/courses/category/${categoryId}`);
    return data;
  } catch (error) {
    throw error;
  }
};

export const getCourseStructure = async (courseId: string) => {
  try {
    const { data } = await courseApi.get(`/courses/${courseId}/structure`);
    return data;
  } catch (error) {
    throw error;
  }
};

export const getUserCourseStructure = async (userId: string) => {
  try {
    const { data } = await courseApi.get(`/courses/user/${userId}/structure`);
    return data;
  } catch (error) {
    throw error;
  }
};

export const publishCourse = async (courseId: string) => {
  try {
    const { data } = await courseApi.patch(`/courses/${courseId}/publish`);
    return data;
  } catch (error) {
    throw error;
  }
};
export const createCourse = async (courseData: {
  title: string;
  description: string;
  categoryId: string;
  level: string;
  price: number;
  currency: string;
  isPublished: boolean;
  isHasCertificate: boolean;
  tags: string[];
  learningOutcomes: string[];
  requirements: string[];
  targetAudience: string;
  thumbnailUrl?: string;
}) => {
  try {
    const { data } = await courseApi.post("/courses", courseData);
    return {
      error: false,
      success: true,
      data,
      message: "Tạo khóa học thành công",
    };
  } catch (error) {
    return {
      error: true,
      success: false,
      message: "Đã xảy ra lỗi khi tạo khóa học",
      data: null,
    };
  }
};

export const unpublishCourse = async (courseId: string) => {
  try {
    const { data } = await courseApi.patch(`/courses/${courseId}/unpublish`);
    return data;
  } catch (error) {
    throw error;
  }
};
export const updateCourse = async (
  courseId: string,
  courseData: {
    title: string;
    description: string;
    categoryId: string;
    level: string;
    price: number;
    promotionPrice?: number;
    currency: string;
    isPublished: boolean;
    isHasCertificate: boolean;
    tags: string[];
    learningOutcomes: string[];
    requirements: string[];
    targetAudience: string;
    thumbnailUrl?: string;
  },
) => {
  try {
    const { data } = await courseApi.patch(`/courses/${courseId}`, courseData);
    return {
      error: false,
      success: true,
      data,
      message: "Cập nhật khóa học thành công",
    };
  } catch (error) {
    return {
      error: true,
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật khóa học",
      data: null,
    };
  }
};
export const createChapter = async (courseId: string, chapterData: any) => {
  try {
    const { data } = await courseApi.post(
      `/courses/${courseId}/chapters`,
      chapterData,
    );
    return data;
  } catch (error) {
    throw error;
  }
};

export const getChapters = async (courseId: string) => {
  try {
    const { data } = await courseApi.get(`/courses/${courseId}/chapters`);
    return data;
  } catch (error) {
    throw error;
  }
};

export const getChapterById = async (chapterId: string) => {
  try {
    const { data } = await courseApi.get(`/chapters/${chapterId}`);
    return data;
  } catch (error) {
    throw error;
  }
};

export const updateChapter = async (chapterId: string, chapterData: any) => {
  try {
    const { data } = await courseApi.patch(
      `/chapters/${chapterId}`,
      chapterData,
    );
    return data;
  } catch (error) {
    throw error;
  }
};

export const deleteChapter = async (chapterId: string) => {
  try {
    const { data } = await courseApi.delete(`/chapters/${chapterId}`);
    return data;
  } catch (error) {
    throw error;
  }
};

export const createLesson = async (
  courseId: string,
  chapterId: string,
  lessonData: any,
) => {
  try {
    const { data } = await courseApi.post(
      `/lessons/courses/${courseId}/chapters/${chapterId}`,
      lessonData,
    );
    return data;
  } catch (error) {
    throw error;
  }
};

export const getLessonsByChapter = async (chapterId: string) => {
  try {
    const { data } = await courseApi.get(`/lessons/chapters/${chapterId}`);
    return data;
  } catch (error) {
    throw error;
  }
};

export const getLessonsByCourse = async (courseId: string) => {
  try {
    const { data } = await courseApi.get(`/lessons/courses/${courseId}`);
    return data;
  } catch (error) {
    throw error;
  }
};

export const getLessonById = async (lessonId: string) => {
  try {
    const { data } = await courseApi.get(`/lessons/${lessonId}`);
    return data;
  } catch (error) {
    throw error;
  }
};

export const updateLesson = async (lessonId: string, lessonData: any) => {
  try {
    const { data } = await courseApi.put(`/lessons/${lessonId}`, lessonData);
    return data;
  } catch (error) {
    throw error;
  }
};

export const deleteLesson = async (lessonId: string) => {
  try {
    const { data } = await courseApi.delete(`/lessons/${lessonId}`);
    return data;
  } catch (error) {
    throw error;
  }
};
export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const { data } = await courseApi.get("/categories");
    return data;
  } catch (error) {
    throw error;
  }
};
