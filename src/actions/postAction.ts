import axios from "axios";

const API_URL = "http://localhost:8080/api";

export interface Post {
  id: string;
  userId: string;
  title: string;
  content: string;
  coverImage: string;
  tags: string[];
  isPublished: boolean;
  seriesId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PostFilters {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  currentUserId?: string;
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

export const getAllPosts = async (
  filters: PostFilters = {},
): Promise<PaginatedResponse<Post>> => {
  try {
    const params = new URLSearchParams();
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.size) params.append("size", filters.size.toString());
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.sortDir) params.append("sortDir", filters.sortDir);
    if (filters.currentUserId)
      params.append("currentUserId", filters.currentUserId);

    const { data } = await axios.get(`${API_URL}/posts?${params.toString()}`);
    return data;
  } catch (error) {
    throw error;
  }
};

export const getPostById = async (
  postId: string,
  currentUserId?: string,
): Promise<Post> => {
  try {
    const params = new URLSearchParams();
    if (currentUserId) params.append("currentUserId", currentUserId);

    const { data } = await axios.get(
      `${API_URL}/posts/${postId}?${params.toString()}`,
    );
    return data;
  } catch (error) {
    throw error;
  }
};

export const createPost = async (postData: {
  userId: string;
  title: string;
  content: string;
  coverImage: string;
  tags: string[];
  isPublished: boolean;
  seriesId?: string;
}) => {
  try {
    const { data } = await axios.post(`${API_URL}/posts`, postData);
    return {
      success: true,
      data,
      message: "Tạo bài viết thành công",
    };
  } catch (error) {
    return {
      success: false,
      message: "Đã xảy ra lỗi khi tạo bài viết",
      error,
    };
  }
};

export const updatePost = async (
  postId: string,
  postData: {
    userId: string;
    title: string;
    content: string;
    coverImage: string;
    tags: string[];
    isPublished: boolean;
    seriesId?: string;
  },
) => {
  try {
    const { data } = await axios.put(`${API_URL}/posts/${postId}`, postData);
    return {
      success: true,
      data,
      message: "Cập nhật bài viết thành công",
    };
  } catch (error) {
    return {
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật bài viết",
      error,
    };
  }
};

export const deletePost = async (postId: string, userId: string) => {
  try {
    const { data } = await axios.delete(
      `${API_URL}/posts/${postId}?userId=${userId}`,
    );
    return {
      success: true,
      data,
      message: "Xóa bài viết thành công",
    };
  } catch (error) {
    return {
      success: false,
      message: "Đã xảy ra lỗi khi xóa bài viết",
      error,
    };
  }
};

export const searchPosts = async (
  keyword: string,
  filters: PostFilters = {},
): Promise<PaginatedResponse<Post>> => {
  try {
    const params = new URLSearchParams();
    params.append("keyword", keyword);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.size) params.append("size", filters.size.toString());
    if (filters.currentUserId)
      params.append("currentUserId", filters.currentUserId);

    const { data } = await axios.get(
      `${API_URL}/posts/search?${params.toString()}`,
    );
    return data;
  } catch (error) {
    throw error;
  }
};

export const getPostsByTag = async (
  tag: string,
  filters: PostFilters = {},
): Promise<PaginatedResponse<Post>> => {
  try {
    const params = new URLSearchParams();
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.size) params.append("size", filters.size.toString());
    if (filters.currentUserId)
      params.append("currentUserId", filters.currentUserId);

    const { data } = await axios.get(
      `${API_URL}/posts/tag/${tag}?${params.toString()}`,
    );
    return data;
  } catch (error) {
    throw error;
  }
};
