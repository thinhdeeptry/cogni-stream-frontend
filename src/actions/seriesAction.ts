"use server";

import { AxiosFactory } from "@/lib/axios";

const seriesApi = await AxiosFactory.getApiInstance("series");

export interface Series {
  id: string;
  userId: string;
  title: string;
  description: string;
  coverImage: string;
  posts: SeriesPost[];
  createdAt: string;
  updatedAt: string;
  published: boolean;
}

export interface SeriesPost {
  postId: string;
  postTitle: string;
  postCoverImage: string;
  content: string;
  order: number;
  totalLikes: number;
  totalViews: number;
  likedByCurrentUser: boolean;
  viewedByCurrentUser: boolean;
}

export interface SeriesFilters {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      unsorted: boolean;
      sorted: boolean;
    };
    offset: number;
    unpaged: boolean;
    paged: boolean;
  };
  last: boolean;
  totalElements: number;
  totalPages: number;
  first: boolean;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    unsorted: boolean;
    sorted: boolean;
  };
  numberOfElements: number;
  empty: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export const getAllSeries = async (filters?: SeriesFilters) => {
  try {
    const { data } = await seriesApi.get<
      ApiResponse<PaginatedResponse<Series>>
    >(`/series`, {
      params: {
        page: filters?.page || 0,
        size: filters?.size || 10,
        sortBy: filters?.sortBy || "createdAt",
        sortDir: filters?.sortDir || "desc",
      },
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const getSeriesById = async (id: string, currentUserId?: string) => {
  try {
    const { data } = await seriesApi.get<ApiResponse<Series>>(`/series/${id}`, {
      params: {
        currentUserId,
      },
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const getSeriesByUserId = async (
  userId: string,
  filters?: SeriesFilters,
) => {
  try {
    const { data } = await seriesApi.get<
      ApiResponse<PaginatedResponse<Series>>
    >(`/series/user/${userId}`, {
      params: {
        page: filters?.page || 0,
        size: filters?.size || 10,
        sortBy: filters?.sortBy || "createdAt",
        sortDir: filters?.sortDir || "desc",
      },
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const createSeries = async (data: {
  userId: string;
  title: string;
  description: string;
  coverImage: string;
  isPublished: boolean;
}) => {
  try {
    const { data: responseData } = await seriesApi.post<ApiResponse<Series>>(
      `/series`,
      {
        ...data,
        posts: [],
      },
    );
    return responseData;
  } catch (error) {
    throw error;
  }
};

export const updateSeries = async (
  id: string,
  data: {
    userId: string;
    title: string;
    description: string;
    coverImage: string;
    posts: { postId: string; order: number }[];
    isPublished: boolean;
  },
) => {
  try {
    const { data: responseData } = await seriesApi.put<ApiResponse<Series>>(
      `/series/${id}`,
      data,
    );
    return responseData;
  } catch (error) {
    throw error;
  }
};

export const deleteSeries = async (id: string, userId: string) => {
  try {
    const { data } = await seriesApi.delete<ApiResponse<void>>(
      `/series/${id}`,
      {
        params: { userId },
      },
    );
    return data;
  } catch (error) {
    throw error;
  }
};

export const addPostToSeries = async (
  seriesId: string,
  postId: string,
  order: number,
  userId: string,
) => {
  try {
    const { data } = await seriesApi.post<ApiResponse<Series>>(
      `/series/${seriesId}/posts/${postId}`,
      null,
      {
        params: { order, userId },
      },
    );
    return data;
  } catch (error) {
    throw error;
  }
};

export const removePostFromSeries = async (
  seriesId: string,
  postId: string,
  userId: string,
) => {
  try {
    const { data } = await seriesApi.delete<ApiResponse<Series>>(
      `/series/${seriesId}/posts/${postId}`,
      {
        params: { userId },
      },
    );
    return data;
  } catch (error) {
    throw error;
  }
};

export const updatePostOrderInSeries = async (
  seriesId: string,
  postId: string,
  newOrder: number,
  userId: string,
) => {
  try {
    const { data } = await seriesApi.put<ApiResponse<Series>>(
      `/series/${seriesId}/posts/${postId}/order`,
      null,
      {
        params: { newOrder, userId },
      },
    );
    return data;
  } catch (error) {
    throw error;
  }
};

export const searchSeries = async (
  keyword: string,
  filters?: SeriesFilters,
) => {
  try {
    const { data } = await seriesApi.get<
      ApiResponse<PaginatedResponse<Series>>
    >(`/series/search`, {
      params: {
        keyword,
        page: filters?.page || 0,
        size: filters?.size || 10,
      },
    });
    return data;
  } catch (error) {
    throw error;
  }
};
