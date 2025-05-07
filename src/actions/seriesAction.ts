import axios from "axios";

const API_URL = "http://localhost:8080/api";

export interface Series {
  id: string;
  userId: string;
  title: string;
  description: string;
  coverImage: string;
  posts: {
    postId: string;
    order: number;
  }[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SeriesFilters {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const getAllSeries = async (
  filters: SeriesFilters = {},
): Promise<PaginatedResponse<Series>> => {
  try {
    const params = new URLSearchParams();
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.size) params.append("size", filters.size.toString());
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.sortDir) params.append("sortDir", filters.sortDir);

    const { data } = await axios.get(`${API_URL}/series?${params.toString()}`);
    return data;
  } catch (error) {
    throw error;
  }
};

export const getSeriesById = async (seriesId: string): Promise<Series> => {
  try {
    const { data } = await axios.get(`${API_URL}/series/${seriesId}`);
    return data;
  } catch (error) {
    throw error;
  }
};

export const createSeries = async (seriesData: {
  userId: string;
  title: string;
  description: string;
  coverImage: string;
  posts: { postId: string; order: number }[];
  isPublished: boolean;
}) => {
  try {
    const { data } = await axios.post(`${API_URL}/series`, seriesData);
    return {
      success: true,
      data,
      message: "Tạo series thành công",
    };
  } catch (error) {
    return {
      success: false,
      message: "Đã xảy ra lỗi khi tạo series",
      error,
    };
  }
};

export const updateSeries = async (
  seriesId: string,
  seriesData: {
    userId: string;
    title: string;
    description: string;
    coverImage: string;
    posts: { postId: string; order: number }[];
    isPublished: boolean;
  },
) => {
  try {
    const { data } = await axios.put(
      `${API_URL}/series/${seriesId}`,
      seriesData,
    );
    return {
      success: true,
      data,
      message: "Cập nhật series thành công",
    };
  } catch (error) {
    return {
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật series",
      error,
    };
  }
};

export const deleteSeries = async (seriesId: string, userId: string) => {
  try {
    const { data } = await axios.delete(
      `${API_URL}/series/${seriesId}?userId=${userId}`,
    );
    return {
      success: true,
      data,
      message: "Xóa series thành công",
    };
  } catch (error) {
    return {
      success: false,
      message: "Đã xảy ra lỗi khi xóa series",
      error,
    };
  }
};

export const addPostToSeries = async (
  seriesId: string,
  postId: string,
  order: number,
  userId: string,
) => {
  try {
    const { data } = await axios.post(
      `${API_URL}/series/${seriesId}/posts/${postId}?order=${order}&userId=${userId}`,
    );
    return {
      success: true,
      data,
      message: "Thêm bài viết vào series thành công",
    };
  } catch (error) {
    return {
      success: false,
      message: "Đã xảy ra lỗi khi thêm bài viết vào series",
      error,
    };
  }
};

export const removePostFromSeries = async (
  seriesId: string,
  postId: string,
  userId: string,
) => {
  try {
    const { data } = await axios.delete(
      `${API_URL}/series/${seriesId}/posts/${postId}?userId=${userId}`,
    );
    return {
      success: true,
      data,
      message: "Xóa bài viết khỏi series thành công",
    };
  } catch (error) {
    return {
      success: false,
      message: "Đã xảy ra lỗi khi xóa bài viết khỏi series",
      error,
    };
  }
};

export const updatePostOrderInSeries = async (
  seriesId: string,
  postId: string,
  newOrder: number,
  userId: string,
) => {
  try {
    const { data } = await axios.put(
      `${API_URL}/series/${seriesId}/posts/${postId}/order?newOrder=${newOrder}&userId=${userId}`,
    );
    return {
      success: true,
      data,
      message: "Cập nhật thứ tự bài viết thành công",
    };
  } catch (error) {
    return {
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật thứ tự bài viết",
      error,
    };
  }
};

export const searchSeries = async (
  keyword: string,
  filters: SeriesFilters = {},
): Promise<PaginatedResponse<Series>> => {
  try {
    const params = new URLSearchParams();
    params.append("keyword", keyword);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.size) params.append("size", filters.size.toString());

    const { data } = await axios.get(
      `${API_URL}/series/search?${params.toString()}`,
    );
    return data;
  } catch (error) {
    throw error;
  }
};
