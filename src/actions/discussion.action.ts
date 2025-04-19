// "use server"
import { AxiosFactory } from "@/lib/axios";

import {
  DiscussionType,
  Post,
  ReactionType,
  ThreadWithPostCount,
} from "../components/discussion/type";

const discussionAxios = await AxiosFactory.getApiInstance("discussion");

export async function getAllThreads(): Promise<ThreadWithPostCount[]> {
  const { data } = await discussionAxios.get(`/threads`);
  return data;
}

export async function getThread(
  threadId: string,
): Promise<ThreadWithPostCount> {
  const { data } = await discussionAxios.get(`/threads/${threadId}`);
  return data;
}

export async function getPosts(
  threadId: string,
  page?: number,
  limit?: number,
): Promise<Post[]> {
  const { data } = await discussionAxios.get(
    `/threads/${threadId}/posts${page ? `?page=${page}&limit=${limit}` : ""}`,
  );
  return data;
}

export async function createPost(
  threadId: string,
  authorId: string, // Keep this parameter for backward compatibility
  content: string,
  parentId?: string,
  rating?: number,
): Promise<Post> {
  console.log({
    content,
    parentId,
    rating,
    threadId,
  });
  // Based on Postman collection, the authorId should be in the header, not in the query params
  // But since we're using axios, we'll keep the current implementation
  const { data } = await discussionAxios.post(`/posts`, {
    threadId,
    content,
    parentId,
    rating,
    authorId, // Include authorId in the request body for now
  });
  return data;
}

export async function updatePost(
  postId: string,
  content: string,
  authorId: string,
  rating?: number,
): Promise<Post> {
  const { data } = await discussionAxios.patch(
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
  const response = await discussionAxios.delete(
    `/posts/${postId}?authorId=${authorId}`,
  );
  if (!response.status || response.status >= 400) {
    throw new Error("Failed to delete post");
  }
}

export async function addReaction(
  postId: string,
  userId: string, // Keep this parameter for backward compatibility
  type: ReactionType,
): Promise<void> {
  // Based on Postman collection, the userId should be in the header, not in the request body
  // But since we're using axios, we'll keep the current implementation for now
  const response = await discussionAxios.post(`/reactions`, {
    postId,
    type,
    userId, // Include userId in the request body for now
  });
  return response.data;
}

export async function removeReaction(reactionId: string): Promise<void> {
  await discussionAxios.delete(`/reactions/${reactionId}`);
}

export async function findReplies(
  postId: string,
  page?: number,
  limit?: number,
): Promise<Post[]> {
  const { data } = await discussionAxios.get(
    `/posts/${postId}/replies${page ? `?page=${page}&limit=${limit}` : ""}`,
  );
  return data;
}

export async function updateReaction(
  reactionId: string,
  reactionType: ReactionType,
) {
  const { data } = await discussionAxios.patch(`/reactions/${reactionId}`, {
    type: reactionType,
  });

  return data;
}

export async function checkUserReview(
  courseId: string,
  authorId: string,
): Promise<{ hasReviewed: boolean; reviewId?: string }> {
  const { data } = await discussionAxios.get(
    `/posts/check-review?courseId=${courseId}&authorId=${authorId}`,
  );
  return data;
}

/**
 * Gets threads by resource ID and type.
 *
 * Note: This function uses the getAllThreads endpoint and filters by resourceId and type
 * since there's no specific endpoint for getting threads by resource ID in the Postman collection.
 */
export async function getThreadByResourceId(
  resourceId: string,
  type: DiscussionType,
): Promise<ThreadWithPostCount | null> {
  try {
    // Get all threads and filter by resourceId and type
    const threads = await getAllThreads();
    const thread = threads.find(
      (t) => t.resourceId === resourceId && t.type === type,
    );
    return thread || null;
  } catch (error) {
    console.error(`Error fetching thread for resource ${resourceId}:`, error);
    return null;
  }
}

/**
 * Creates a new thread with the given resource ID, type, and title.
 *
 * Note: This function matches the Postman collection endpoint:
 * - POST /threads - to create a new thread with resourceId, type, and optional overallRating
 */
export async function createThread(
  resourceId: string,
  type: DiscussionType,
  title: string = "",
  overallRating?: number,
): Promise<ThreadWithPostCount | null> {
  try {
    console.log(`Creating thread for resource ${resourceId} with type ${type}`);
    const { data } = await discussionAxios.post(`/threads`, {
      resourceId,
      type,
      title,
      overallRating, // This matches the Postman collection
    });
    console.log(`Thread created successfully:`, data);
    return data;
  } catch (error: any) {
    console.error(`Error creating thread for resource ${resourceId}:`, error);
    console.error(`Error details:`, error.response?.data || error.message);
    console.error(`Error status:`, error.response?.status);
    return null;
  }
}
