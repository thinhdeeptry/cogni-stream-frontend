// "use server"

import axios from "axios";
import { Post, ReactionType } from "./type";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_DISCUSSION_API_URL,
});

export async function getPosts(threadId: string): Promise<Post[]> {
  const { data } = await axiosInstance.get(`/threads/${threadId}/posts`);
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
): Promise<Post> {
  const { data } = await axiosInstance.patch(
    `/posts/${postId}?authorId=${authorId}`,
    {
      content,
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
