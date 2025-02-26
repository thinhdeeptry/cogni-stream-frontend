// "use server"

import axios from "axios";
import { Post, ReactionType, ThreadWithPostCount } from "./type";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_DISCUSSION_API_URL,
});

export async function getThread(
  threadId: string,
): Promise<ThreadWithPostCount> {
  const { data } = await axiosInstance.get(`/threads/${threadId}`);
  return data;
}

export async function getPosts(
  threadId: string,
  page?: number,
  limit?: number,
): Promise<Post[]> {
  const { data } = await axiosInstance.get(
    `/threads/${threadId}/posts${page ? `?page=${page}&limit=${limit}` : ""}`,
  );
  return data;
}

export async function createPost(
  threadId: string,
  authorId: string,
  content: string,
  parentId?: string,
  rating?: number,
): Promise<Post> {
  const { data } = await axiosInstance.post(`/posts?authorId=${authorId}`, {
    content,
    parentId,
    rating,
    threadId,
  });
  return data;
}

export async function updatePost(
  postId: string,
  content: string,
  authorId: string,
  rating?: number,
): Promise<Post> {
  const { data } = await axiosInstance.patch(
    `/posts/${postId}?authorId=${authorId}`,
    {
      content,
      rating,
    },
  );
  return data;
}

export async function deletePost(
  postId: string,
  authorId: string,
): Promise<void> {
  await axiosInstance.delete(`/posts/${postId}?authorId=${authorId}`);
}

export async function addReaction(
  postId: string,
  userId: string,
  type: ReactionType,
): Promise<void> {
  await axiosInstance.post(`/reactions`, {
    userId,
    postId,
    type,
  });
}

export async function removeReaction(reactionId: string): Promise<void> {
  await axiosInstance.delete(`/reactions/${reactionId}`);
}

export async function findReplies(
  postId: string,
  page?: number,
  limit?: number,
): Promise<Post[]> {
  const { data } = await axiosInstance.get(
    `/posts/${postId}/replies${page ? `?page=${page}&limit=${limit}` : ""}`,
  );
  return data;
}

export async function updateReaction(
  reactionId: string,
  reactionType: ReactionType,
) {
  const { data } = await axiosInstance.patch(`/reactions/${reactionId}`, {
    type: reactionType,
  });

  return data;
}
