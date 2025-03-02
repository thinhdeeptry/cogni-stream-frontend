// "use server"
import { AxiosFactory } from "@/lib/axios";

import {
  Post,
  ReactionType,
  ThreadWithPostCount,
} from "../components/discussion/type";

const discussionAxios = AxiosFactory.getApiInstance("discussion");

export async function getThread(
  threadId: string,
): Promise<ThreadWithPostCount> {
  const { data } = await discussionAxios.get(`/api/v1/threads/${threadId}`);
  return data;
}

export async function getPosts(
  threadId: string,
  page?: number,
  limit?: number,
): Promise<Post[]> {
  const { data } = await discussionAxios.get(
    `/api/v1/threads/${threadId}/posts${page ? `?page=${page}&limit=${limit}` : ""}`,
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
  const { data } = await discussionAxios.post(
    `/api/v1/posts?authorId=${authorId}`,
    {
      content,
      parentId,
      rating,
      threadId,
    },
  );
  return data;
}

export async function updatePost(
  postId: string,
  content: string,
  authorId: string,
  rating?: number,
): Promise<Post> {
  const { data } = await discussionAxios.patch(
    `/api/v1/posts/${postId}?authorId=${authorId}`,
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
  const response = await discussionAxios.delete(
    `/api/v1/posts/${postId}?authorId=${authorId}`,
  );
  if (!response.status || response.status >= 400) {
    throw new Error("Failed to delete post");
  }
}

export async function addReaction(
  postId: string,
  userId: string,
  type: ReactionType,
): Promise<void> {
  const response = await discussionAxios.post(`/api/v1/reactions`, {
    userId,
    postId,
    type,
  });
  return response.data;
}

export async function removeReaction(reactionId: string): Promise<void> {
  await discussionAxios.delete(`/api/v1/reactions/${reactionId}`);
}

export async function findReplies(
  postId: string,
  page?: number,
  limit?: number,
): Promise<Post[]> {
  const { data } = await discussionAxios.get(
    `/api/v1/posts/${postId}/replies${page ? `?page=${page}&limit=${limit}` : ""}`,
  );
  return data;
}

export async function updateReaction(
  reactionId: string,
  reactionType: ReactionType,
) {
  const { data } = await discussionAxios.patch(
    `/api/v1/reactions/${reactionId}`,
    {
      type: reactionType,
    },
  );

  return data;
}

export async function checkUserReview(
  courseId: string,
  authorId: string,
): Promise<{ hasReviewed: boolean; reviewId?: string }> {
  const { data } = await discussionAxios.get(
    `/api/v1/posts/check-review?courseId=${courseId}&authorId=${authorId}`,
  );
  return data;
}
