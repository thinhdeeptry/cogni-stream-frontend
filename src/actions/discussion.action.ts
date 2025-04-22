// "use server"
import { AxiosFactory } from "@/lib/axios";

import {
  DiscussionType,
  Post,
  ReactionType,
  ThreadWithPostCount,
} from "../components/discussion/type";

const discussionAxios = await AxiosFactory.getApiInstance("discussion");

// Create a simple in-memory cache to prevent infinite loops
const threadCache = new Map<string, ThreadWithPostCount>();

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
  resourceId: string,
  authorId: string,
): Promise<{ hasReviewed: boolean; reviewId?: string }> {
  try {
    console.log(
      `Checking user review for resourceId=${resourceId}, authorId=${authorId}`,
    );
    const { data } = await discussionAxios.get(
      `/posts/check-review?resourceId=${resourceId}&authorId=${authorId}`,
    );
    return data;
  } catch (error) {
    console.error("Error in checkUserReview:", error);
    // Return default values if the API call fails
    return { hasReviewed: false };
  }
}

/**
 * Gets a thread by resource ID and type.
 * This function simply fetches the thread from the backend without creating a new one.
 * The backend will handle the creation logic if needed.
 */
export async function getThreadByResourceId(
  resourceId: string,
  type: DiscussionType,
): Promise<ThreadWithPostCount | null> {
  // Use a cache to prevent infinite loops
  const cacheKey = `${resourceId}-${type}`;
  const cachedThread = threadCache.get(cacheKey);
  if (cachedThread) {
    console.log(`Using cached thread for resource ${resourceId}`);
    return cachedThread;
  }

  try {
    // Try to get thread by resource ID and type
    console.log(`Finding thread for resource ID: ${resourceId}, type: ${type}`);

    // Get the thread from the backend
    const response = await discussionAxios.get(
      `/threads/resource/${resourceId}/ensure?type=${type}`,
    );

    const { data } = response;

    // If we got a valid thread object back, cache and return it
    if (data && typeof data === "object" && !Array.isArray(data) && data.id) {
      console.log(`Found existing thread for resource ${resourceId}`);
      threadCache.set(cacheKey, data);
      return data;
    }

    // If no valid thread data was returned
    return null;
  } catch (error: any) {
    console.error(`Error finding thread for resource ${resourceId}:`, error);
    // For all errors, return null and let the caller handle it
    return null;
  }
}

/**
 * Creates a new thread with the given resource ID, type, and title.
 *
 * Note: This function matches the backend's create method:
 * - POST /threads - to create a new thread with resourceId, type, and optional overallRating
 * - The backend will throw a ConflictException if a thread with the same resourceId already exists
 */
export async function createThread(
  resourceId: string,
  type: DiscussionType,
  title: string = "",
  overallRating?: number,
): Promise<ThreadWithPostCount | null> {
  try {
    console.log(`Creating thread for resource ${resourceId} with type ${type}`);
    console.log("Request payload:", { resourceId, type, title, overallRating });

    const response = await discussionAxios.post(`/threads`, {
      resourceId,
      type,
      title,
      overallRating, // This matches the backend's create method
    });

    const { data } = response;
    console.log(`Thread created successfully:`, data);
    return data;
  } catch (error: any) {
    // If the error is a 409 (conflict), it means a thread with this resourceId already exists
    if (error.response?.status === 409) {
      console.warn(
        `Thread already exists for resource ${resourceId}, attempting to fetch it`,
      );
      // Try to fetch the existing thread
      try {
        const existingResponse = await discussionAxios.get(
          `/threads/resource/${resourceId}?type=${type}`,
        );
        return existingResponse.data;
      } catch (fetchError) {
        console.error(
          `Failed to fetch existing thread after conflict:`,
          fetchError,
        );
        return null;
      }
    }

    console.error(`Error creating thread for resource ${resourceId}:`, error);
    console.error(`Error details:`, error.response?.data || error.message);
    console.error(`Error status:`, error.response?.status);
    return null;
  }
}
