import axios from "axios";

const API_URL = "http://localhost:8080/api";

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
  order: number;
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
    const response = await axios.get<ApiResponse<PaginatedResponse<Series>>>(
      `${API_URL}/series`,
      {
        params: {
          page: filters?.page || 0,
          size: filters?.size || 10,
          sortBy: filters?.sortBy || "createdAt",
          sortDir: filters?.sortDir || "desc",
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSeriesById = async (id: string) => {
  try {
    const response = await axios.get<ApiResponse<Series>>(
      `${API_URL}/series/${id}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSeriesByUserId = async (
  userId: string,
  filters?: SeriesFilters,
) => {
  try {
    const response = await axios.get<ApiResponse<PaginatedResponse<Series>>>(
      `${API_URL}/series/user/${userId}`,
      {
        params: {
          page: filters?.page || 0,
          size: filters?.size || 10,
          sortBy: filters?.sortBy || "createdAt",
          sortDir: filters?.sortDir || "desc",
        },
      },
    );
    return response.data;
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
    const response = await axios.post<ApiResponse<Series>>(
      `${API_URL}/series`,
      {
        ...data,
        posts: [],
      },
    );
    return response.data;
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
    const response = await axios.put<ApiResponse<Series>>(
      `${API_URL}/series/${id}`,
      data,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteSeries = async (id: string, userId: string) => {
  try {
    const response = await axios.delete<ApiResponse<void>>(
      `${API_URL}/series/${id}`,
      {
        params: { userId },
      },
    );
    return response.data;
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
    const response = await axios.post<ApiResponse<Series>>(
      `${API_URL}/series/${seriesId}/posts/${postId}`,
      null,
      {
        params: { order, userId },
      },
    );
    return response.data;
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
    const response = await axios.delete<ApiResponse<Series>>(
      `${API_URL}/series/${seriesId}/posts/${postId}`,
      {
        params: { userId },
      },
    );
    return response.data;
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
    const response = await axios.put<ApiResponse<Series>>(
      `${API_URL}/series/${seriesId}/posts/${postId}/order`,
      null,
      {
        params: { newOrder, userId },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const searchSeries = async (
  keyword: string,
  filters?: SeriesFilters,
) => {
  try {
    const response = await axios.get<ApiResponse<PaginatedResponse<Series>>>(
      `${API_URL}/series/search`,
      {
        params: {
          keyword,
          page: filters?.page || 0,
          size: filters?.size || 10,
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
