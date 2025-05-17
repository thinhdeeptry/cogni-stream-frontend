import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  addReaction,
  checkUserReview,
  createPost,
  deletePost,
  findReplies,
  getPosts,
  getThread,
  removeReaction,
  updatePost,
  updateReaction,
} from "../actions/discussion.action";
import socketService from "../components/discussion/discussion.socket";
import type {
  Post,
  Reaction,
  ReactionCounts,
  ReactionType,
  ThreadWithPostCount,
} from "../components/discussion/type";

// Constants
const POSTS_PER_PAGE = 5;
const REPLIES_PER_PAGE = 3;

// Helper Types
interface ThreadUser {
  userId: string;
  userName: string;
}

interface DiscussionState {
  thread: ThreadWithPostCount | null;
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  currentUserId?: string;
  currentUserName?: string;
  currentPage: number;
  currentThreadId: string | null;
  replyPages: Record<string, number>;
  repliesMap: Record<string, Post[]>;
  hasReviewed: boolean;
  reviewId?: string;
  threadUsers: ThreadUser[];
  isConnected: boolean;
  connectionError: string | null;
  isReconnecting: boolean;
  lastFetchedThreadId: string | null;
  lastFetchedUserId: string | null;

  // UI States added from component
  showReplies: Record<string, boolean>;
  isLoadingMore: boolean;
  loadingReplies: Record<string, boolean>;

  // Setters
  setCurrentUserId: (userId: string) => void;
  setCurrentUserName: (userName: string) => void;
  setCurrentThreadId: (threadId: string) => void;

  // Socket management
  initializeSocket: () => void;
  cleanupSocket: () => void;

  // Data fetching
  fetchThread: () => Promise<void>;
  fetchPosts: (page?: number) => Promise<void>;
  fetchReplies: (postId: string, page?: number) => Promise<void>;
  checkUserReview: (courseId: string) => Promise<void>;

  // Post actions
  addReply: (
    parentId: string | null,
    content: string,
    rating?: number,
  ) => Promise<void>;
  editPost: (postId: string, content: string, rating?: number) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;

  // Reaction actions
  addReaction: (
    postId: string,
    reactionType: ReactionType,
    existingReactionId?: string,
  ) => Promise<void>;
  removeReaction: (
    reactionId: string,
    reactionType: ReactionType,
  ) => Promise<void>;

  // UI Management
  toggleReplies: (postId: string) => Promise<void>;
  loadMoreReplies: (postId: string) => Promise<void>;
  loadMorePosts: () => Promise<void>;

  // Socket callbacks
  onNewReply: (postId: string) => void;
}

// Utility functions
const createDefaultReactionCounts = (): ReactionCounts => ({
  LIKE: 0,
  LOVE: 0,
  CARE: 0,
  HAHA: 0,
  WOW: 0,
  SAD: 0,
  ANGRY: 0,
  total: 0,
});

// Utility function to play notification sound
const playNotificationSound = () => {
  // Chỉ thực hiện trên trình duyệt (client-side)
  if (typeof window !== "undefined") {
    try {
      const audio = new Audio("/assets/sounds/notify-sound.mp3");
      audio.play().catch((error) => {
        console.error("Không thể phát âm thanh thông báo:", error);
      });
    } catch (error) {
      console.error("Lỗi khi tạo đối tượng Audio:", error);
    }
  }
};

const updateReactionCountsForAdd = (
  counts: ReactionCounts,
  newType: ReactionType,
  oldType?: ReactionType,
): ReactionCounts => {
  const updated = { ...counts };

  // If replacing an existing reaction, decrement old type
  if (oldType) {
    updated[oldType] = Math.max(0, updated[oldType] - 1);
  } else {
    // Only increment total if adding a new reaction (not replacing)
    updated.total += 1;
  }

  // Increment the new reaction type
  updated[newType] += 1;

  return updated;
};

const updateReactionCountsForRemove = (
  counts: ReactionCounts,
  typeToRemove: ReactionType,
): ReactionCounts => {
  const updated = { ...counts };

  // Decrement the specific reaction count
  if (updated[typeToRemove] > 0) {
    updated[typeToRemove] -= 1;
  }

  // Update the total count
  if (updated.total > 0) {
    updated.total -= 1;
  }

  return updated;
};

// Post Tree Utilities
const findPostInTree = (posts: Post[], targetId: string): Post | null => {
  for (const post of posts) {
    if (post.id === targetId) return post;
    if (post.replies && post.replies.length > 0) {
      const found = findPostInTree(post.replies, targetId);
      if (found) return found;
    }
  }
  return null;
};

const updatePostsTree = (
  posts: Post[],
  updater: (post: Post) => Post | null,
): Post[] => {
  return posts.reduce<Post[]>((acc, post) => {
    const updatedPost = updater(post);

    if (updatedPost === null) {
      // Post should be removed
      return acc;
    }

    // If post has replies, process them recursively
    if (updatedPost.replies && updatedPost.replies.length > 0) {
      updatedPost.replies = updatePostsTree(updatedPost.replies, updater);
    }

    acc.push(updatedPost);
    return acc;
  }, []);
};

export const useDiscussionStore = create<DiscussionState>()(
  persist(
    (set, get) => ({
      // State
      thread: null,
      posts: [],
      isLoading: false,
      error: null,
      currentUserId: undefined,
      currentUserName: undefined,
      currentPage: 1,
      currentThreadId: null,
      replyPages: {},
      repliesMap: {},
      hasReviewed: false,
      reviewId: undefined,
      threadUsers: [],
      isConnected: false,
      connectionError: null,
      isReconnecting: false,
      lastFetchedThreadId: null,
      lastFetchedUserId: null,

      // UI States
      showReplies: {},
      isLoadingMore: false,
      loadingReplies: {},

      // Setters
      setCurrentUserId: (userId) => {
        const currentState = get();
        const shouldFetchData =
          userId !== currentState.currentUserId && currentState.currentThreadId;

        set({ currentUserId: userId });

        if (shouldFetchData) {
          get().fetchThread();
          get().fetchPosts();
        }
      },

      setCurrentUserName: (userName) => set({ currentUserName: userName }),

      setCurrentThreadId: (threadId) => {
        const currentState = get();
        const shouldFetchData = threadId !== currentState.currentThreadId;

        set({ currentThreadId: threadId });

        if (shouldFetchData) {
          get().fetchThread();
          get().fetchPosts();
        }
      },

      // Data fetching methods
      checkUserReview: async (resourceId) => {
        const { currentUserId, thread, posts } = get();
        if (!currentUserId || !resourceId) {
          console.log("Missing userId or resourceId for review check");
          return;
        }

        // Only check for user reviews if this is a COURSE_REVIEW thread
        if (!thread || thread.type !== "COURSE_REVIEW") {
          set({ hasReviewed: false });
          return;
        }

        // First, check if we can find a review in the existing posts
        if (posts && posts.length > 0) {
          const existingReview = posts.find(
            (post) =>
              post.authorId === currentUserId &&
              !post.parentId &&
              post.rating !== undefined,
          );

          if (existingReview) {
            console.log(`Found existing review in posts: ${existingReview.id}`);
            set({ hasReviewed: true, reviewId: existingReview.id });
            return;
          }
        }

        try {
          console.log(
            `Checking if user ${currentUserId} has reviewed resource ${resourceId}`,
          );
          const { hasReviewed, reviewId } = await checkUserReview(
            resourceId, // For course reviews, resourceId is the courseId
            currentUserId,
          );

          console.log(
            `Review check result: hasReviewed=${hasReviewed}, reviewId=${reviewId || "none"}`,
          );
          set({ hasReviewed, reviewId });

          // If user has reviewed, try to find the review post in the current posts
          if (hasReviewed && reviewId && get().posts.length > 0) {
            const reviewPost = get().posts.find((post) => post.id === reviewId);
            if (!reviewPost) {
              // If the review post isn't in the current posts, refresh posts to get it
              console.log(
                "Review post not found in current posts, refreshing posts",
              );
              await get().fetchPosts();
            }
          }
        } catch (err: any) {
          console.error("Error checking user review:", err);
          // Provide more specific error messages based on status code
          let errorMessage = "Failed to check review status";
          if (err.response?.status === 404) {
            errorMessage = "Resource not found for review check";
            set({ hasReviewed: false, reviewId: undefined });
          } else if (err.response?.status === 400) {
            errorMessage = "Invalid parameters for review check";
            set({ hasReviewed: false, reviewId: undefined });
          } else if (err.message) {
            errorMessage = err.message;
          }

          // Don't set error for the UI to avoid disrupting the user experience
          console.error(errorMessage);
          // set({ error: errorMessage });

          // Even if the API check fails, check the posts directly as a fallback
          if (posts && posts.length > 0) {
            const existingReview = posts.find(
              (post) =>
                post.authorId === currentUserId &&
                !post.parentId &&
                post.rating !== undefined,
            );

            if (existingReview) {
              console.log(
                `Found existing review in posts after API error: ${existingReview.id}`,
              );
              set({ hasReviewed: true, reviewId: existingReview.id });
            }
          }
        }
      },

      fetchThread: async () => {
        const {
          currentThreadId,
          currentUserId,
          lastFetchedThreadId,
          lastFetchedUserId,
        } = get();
        if (!currentThreadId) {
          set({ error: "No thread ID provided" });
          return;
        }

        // Skip fetching if we've already fetched for this thread and user
        if (
          currentThreadId === lastFetchedThreadId &&
          currentUserId === lastFetchedUserId &&
          get().thread
        ) {
          console.log("Using cached thread data");
          return;
        }

        try {
          set({ isLoading: true, error: null });
          const thread = await getThread(currentThreadId);

          // Validate thread data
          if (!thread) {
            set({
              error: "Thread not found or has been deleted",
              isLoading: false,
              thread: null,
              posts: [],
            });
            return;
          }

          // Check for user review if it's a course review thread
          if (thread.type === "COURSE_REVIEW" && currentUserId) {
            try {
              console.log(
                `Checking review for thread type ${thread.type} with resourceId ${thread.resourceId}`,
              );
              const { hasReviewed, reviewId } = await checkUserReview(
                thread.resourceId, // For course reviews, resourceId is the courseId
                currentUserId,
              );
              console.log(
                `Review check result: hasReviewed=${hasReviewed}, reviewId=${reviewId || "none"}`,
              );

              // If the API says the user hasn't reviewed, check the posts manually
              let manualHasReviewed = hasReviewed;
              let manualReviewId = reviewId;

              if (!hasReviewed && thread.posts && thread.posts.length > 0) {
                // Look for a top-level post by this user with a rating
                const userReview = thread.posts.find(
                  (post) =>
                    post.authorId === currentUserId &&
                    !post.parentId &&
                    post.rating !== undefined,
                );

                if (userReview) {
                  console.log(`Found manual review in posts: ${userReview.id}`);
                  manualHasReviewed = true;
                  manualReviewId = userReview.id;
                }
              }

              set({
                thread,
                posts: thread.posts || [],
                currentPage: 1,
                isLoading: false,
                hasReviewed: manualHasReviewed,
                reviewId: manualReviewId,
                lastFetchedThreadId: currentThreadId,
                lastFetchedUserId: currentUserId,
              });
            } catch (reviewErr) {
              // If review check fails, still set thread data but without review info
              console.error("Error checking user review:", reviewErr);

              // Even if the API check fails, try to determine review status from posts
              let manualHasReviewed = false;
              let manualReviewId = undefined;

              if (thread.posts && thread.posts.length > 0) {
                // Look for a top-level post by this user with a rating
                const userReview = thread.posts.find(
                  (post) =>
                    post.authorId === currentUserId &&
                    !post.parentId &&
                    post.rating !== undefined,
                );

                if (userReview) {
                  console.log(
                    `Found manual review in posts despite API error: ${userReview.id}`,
                  );
                  manualHasReviewed = true;
                  manualReviewId = userReview.id;
                }
              }

              set({
                thread,
                posts: thread.posts || [],
                currentPage: 1,
                isLoading: false,
                hasReviewed: manualHasReviewed,
                reviewId: manualReviewId,
                lastFetchedThreadId: currentThreadId,
                lastFetchedUserId: currentUserId,
              });
            }
          } else {
            set({
              thread,
              posts: thread.posts || [],
              currentPage: 1,
              isLoading: false,
              lastFetchedThreadId: currentThreadId,
              lastFetchedUserId: currentUserId,
            });
          }
        } catch (err: any) {
          console.error("Error fetching thread:", err);
          // Provide more specific error messages based on status code
          if (err.response?.status === 404) {
            set({
              error: "Discussion thread not found",
              isLoading: false,
              thread: null,
              posts: [],
            });
          } else {
            set({
              error: `Failed to load discussion thread: ${err.message || "Unknown error"}`,
              isLoading: false,
            });
          }
        }
      },

      fetchPosts: async (page = 1) => {
        const {
          currentThreadId,
          currentUserId,
          lastFetchedThreadId,
          lastFetchedUserId,
          thread,
        } = get();

        if (!currentThreadId) {
          set({ error: "No thread ID provided" });
          return;
        }

        // If thread doesn't exist, don't try to fetch posts
        if (!thread) {
          console.log("Thread not available, skipping post fetch");
          return;
        }

        // If loading more pages, always fetch
        // If loading first page, check if we need to fetch
        if (
          page === 1 &&
          currentThreadId === lastFetchedThreadId &&
          currentUserId === lastFetchedUserId &&
          get().posts.length > 0
        ) {
          console.log("Using cached posts data");
          return;
        }

        try {
          set({ isLoading: page === 1, isLoadingMore: page > 1, error: null });
          const posts = await getPosts(currentThreadId, page, POSTS_PER_PAGE);

          // Handle empty posts array
          if (!posts || posts.length === 0) {
            if (page === 1) {
              // If first page is empty, set empty posts array
              set({
                posts: [],
                currentPage: 1,
                isLoading: false,
                isLoadingMore: false,
                lastFetchedThreadId: currentThreadId,
                lastFetchedUserId: currentUserId,
              });
            } else {
              // If subsequent page is empty, just update loading state
              set({
                isLoading: false,
                isLoadingMore: false,
              });
            }
            return;
          }

          // Check if any of the posts is a review by the current user
          if (thread.type === "COURSE_REVIEW" && currentUserId && page === 1) {
            const userReview = posts.find(
              (post) =>
                post.authorId === currentUserId &&
                !post.parentId &&
                post.rating !== undefined,
            );

            if (userReview) {
              console.log(
                `Found user review in fetched posts: ${userReview.id}`,
              );
              set({ hasReviewed: true, reviewId: userReview.id });
            }
          }

          if (page > 1) {
            set((state) => ({
              posts: [...state.posts, ...posts],
              currentPage: page,
              isLoading: false,
              isLoadingMore: false,
            }));
          } else {
            set({
              posts,
              currentPage: 1,
              isLoading: false,
              isLoadingMore: false,
              lastFetchedThreadId: currentThreadId,
              lastFetchedUserId: currentUserId,
            });
          }
        } catch (err: any) {
          console.error("Error fetching posts:", err);
          // Provide more specific error messages based on status code
          if (err.response?.status === 404) {
            set({
              error: "Discussion thread not found",
              isLoading: false,
              isLoadingMore: false,
              posts: [],
            });
          } else {
            set({
              error: `Failed to load posts: ${err.message || "Unknown error"}`,
              isLoading: false,
              isLoadingMore: false,
            });
          }
        }
      },

      fetchReplies: async (postId: string, page = 1) => {
        try {
          set((state) => ({
            loadingReplies: { ...state.loadingReplies, [postId]: true },
            error: null,
          }));

          const replies = await findReplies(postId, page, REPLIES_PER_PAGE);

          // Handle empty replies array
          if (!replies || replies.length === 0) {
            set((state) => ({
              loadingReplies: { ...state.loadingReplies, [postId]: false },
              // If it's the first page and no replies, set an empty array
              // If it's a subsequent page, keep existing replies
              repliesMap:
                page === 1
                  ? { ...state.repliesMap, [postId]: [] }
                  : state.repliesMap,
              replyPages: {
                ...state.replyPages,
                [postId]: page,
              },
            }));
            return;
          }

          set((state) => {
            // Update replies in both posts and repliesMap
            const updatedPosts = updatePostsTree(state.posts, (post) => {
              if (post.id === postId) {
                const existingReplies = state.repliesMap[postId] || [];
                const updatedReplies =
                  page === 1 ? replies : [...existingReplies, ...replies];

                return {
                  ...post,
                  replies: updatedReplies,
                };
              }
              return post;
            });

            const existingReplies = state.repliesMap[postId] || [];

            return {
              posts: updatedPosts,
              repliesMap: {
                ...state.repliesMap,
                [postId]:
                  page === 1 ? replies : [...existingReplies, ...replies],
              },
              replyPages: {
                ...state.replyPages,
                [postId]: page,
              },
              loadingReplies: { ...state.loadingReplies, [postId]: false },
            };
          });
        } catch (err: any) {
          console.error(`Error fetching replies for post ${postId}:`, err);

          // Provide more specific error messages based on status code
          let errorMessage = "Failed to load replies";
          if (err.response?.status === 404) {
            errorMessage = "Post not found or has been deleted";
          } else if (err.message) {
            errorMessage = err.message;
          }

          set((state) => ({
            error: errorMessage,
            loadingReplies: { ...state.loadingReplies, [postId]: false },
          }));
        }
      },

      // UI Management
      toggleReplies: async (postId: string) => {
        const { repliesMap } = get();

        // Toggle visibility
        set((state) => ({
          showReplies: {
            ...state.showReplies,
            [postId]: !state.showReplies[postId],
          },
        }));

        // Fetch replies if not already loaded and visibility is toggled on
        if (!repliesMap[postId] && get().showReplies[postId]) {
          await get().fetchReplies(postId);
        }
      },

      loadMoreReplies: async (postId: string) => {
        const { repliesMap } = get();
        const currentPage =
          Math.ceil((repliesMap[postId]?.length || 0) / REPLIES_PER_PAGE) + 1;
        await get().fetchReplies(postId, currentPage);
      },

      loadMorePosts: async () => {
        const { currentPage } = get();
        set({ isLoadingMore: true });
        try {
          await get().fetchPosts(currentPage + 1);
        } finally {
          set({ isLoadingMore: false });
        }
      },

      // Reaction methods
      addReaction: async (postId, reactionType, existingReactionId) => {
        const { currentUserId } = get();
        if (!currentUserId) {
          set({ error: "Please log in to react to posts" });
          return;
        }

        try {
          // Send request to server first
          let reactionResponse;
          if (existingReactionId) {
            reactionResponse = await updateReaction(
              existingReactionId,
              reactionType,
            );
          } else {
            reactionResponse = await addReaction(
              postId,
              currentUserId,
              reactionType,
            );
          }

          // Update UI after successful server response
          set((state) => {
            const updatedPosts = updatePostsTree(state.posts, (post) => {
              // If this is not the target post or its reply, return as is
              const isTargetPost = post.id === postId;
              const hasTargetReply = post.replies?.some(
                (reply) => reply.id === postId,
              );

              if (!isTargetPost && !hasTargetReply) {
                return post;
              }

              // Handle post or its reply
              if (isTargetPost) {
                // Check if user already has a reaction
                const existingReaction = post.reactions.find(
                  (r) => r.userId === currentUserId,
                );

                // Create a new reaction object using the server response
                const newReaction: Reaction = {
                  id: reactionResponse.id,
                  postId,
                  userId: currentUserId,
                  type: reactionType,
                  createdAt: reactionResponse.createdAt,
                  updatedAt: reactionResponse.updatedAt,
                  post,
                };

                // Create a safe copy of reactionCounts with default values
                const reactionCounts =
                  post.reactionCounts || createDefaultReactionCounts();
                const updatedReactionCounts = updateReactionCountsForAdd(
                  reactionCounts,
                  reactionType,
                  existingReaction?.type,
                );

                return {
                  ...post,
                  reactions: [
                    ...post.reactions.filter((r) => r.userId !== currentUserId),
                    newReaction,
                  ],
                  reactionCounts: updatedReactionCounts,
                };
              } else {
                // Post with target reply
                return {
                  ...post,
                  replies: post.replies.map((reply) => {
                    if (reply.id === postId) {
                      // Check if user already has a reaction
                      const existingReaction = reply.reactions.find(
                        (r) => r.userId === currentUserId,
                      );

                      // Create a new reaction using the server response
                      const newReaction: Reaction = {
                        id: reactionResponse.id,
                        postId,
                        userId: currentUserId,
                        type: reactionType,
                        createdAt: reactionResponse.createdAt,
                        updatedAt: reactionResponse.updatedAt,
                        post: reply,
                      };

                      // Create a safe copy of reactionCounts with default values
                      const reactionCounts =
                        reply.reactionCounts || createDefaultReactionCounts();
                      const updatedReactionCounts = updateReactionCountsForAdd(
                        reactionCounts,
                        reactionType,
                        existingReaction?.type,
                      );

                      return {
                        ...reply,
                        reactions: [
                          ...reply.reactions.filter(
                            (r) => r.userId !== currentUserId,
                          ),
                          newReaction,
                        ],
                        reactionCounts: updatedReactionCounts,
                      };
                    }
                    return reply;
                  }),
                };
              }
            });

            return { posts: updatedPosts };
          });
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to add reaction";
          set({ error: errorMessage });
        }
      },

      removeReaction: async (
        reactionId: string,
        reactionType: ReactionType,
      ) => {
        const { currentUserId } = get();
        if (!currentUserId) {
          set({ error: "Please log in to remove reactions" });
          return;
        }

        try {
          // Update UI immediately for better UX
          set((state) => {
            const updatedPosts = updatePostsTree(state.posts, (post) => {
              // Check if reaction is in this post
              const hasReaction = post.reactions.some(
                (r) => r.id === reactionId,
              );

              if (hasReaction) {
                // Get the reaction to determine its type if possible
                const reactionToRemove = post.reactions.find(
                  (r) => r.id === reactionId,
                );
                const typeToRemove = reactionToRemove?.type || reactionType;

                // Update reaction counts
                const reactionCounts =
                  post.reactionCounts || createDefaultReactionCounts();
                const updatedReactionCounts = updateReactionCountsForRemove(
                  reactionCounts,
                  typeToRemove,
                );

                return {
                  ...post,
                  reactions: post.reactions.filter((r) => r.id !== reactionId),
                  reactionCounts: updatedReactionCounts,
                };
              }

              // Check if reaction is in any of the replies
              if (post.replies) {
                let reactionFound = false;

                const updatedReplies = post.replies.map((reply) => {
                  if (reply.reactions.some((r) => r.id === reactionId)) {
                    reactionFound = true;

                    // Get the reaction to determine its type if possible
                    const reactionToRemove = reply.reactions.find(
                      (r) => r.id === reactionId,
                    );
                    const typeToRemove = reactionToRemove?.type || reactionType;

                    // Update reaction counts
                    const reactionCounts =
                      reply.reactionCounts || createDefaultReactionCounts();
                    const updatedReactionCounts = updateReactionCountsForRemove(
                      reactionCounts,
                      typeToRemove,
                    );

                    return {
                      ...reply,
                      reactions: reply.reactions.filter(
                        (r) => r.id !== reactionId,
                      ),
                      reactionCounts: updatedReactionCounts,
                    };
                  }
                  return reply;
                });

                if (reactionFound) {
                  return {
                    ...post,
                    replies: updatedReplies,
                  };
                }
              }

              // No changes to this post
              return post;
            });

            return { posts: updatedPosts };
          });

          // Send request to server in the background
          await removeReaction(reactionId);
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to remove reaction";
          set({ error: errorMessage });

          // If the server request fails, we would need to reload the data
          const { currentThreadId } = get();
          if (currentThreadId) {
            get().fetchPosts();
          }
        }
      },

      // Post methods
      addReply: async (parentId, content, rating) => {
        const { currentUserId, thread } = get();
        if (!currentUserId) {
          set({ error: "Please log in to post replies" });
          return;
        }
        if (!thread) {
          set({ error: "Thread not found" });
          return;
        }

        // Check if this is a course review (top-level post with rating)
        if (
          thread.type === "COURSE_REVIEW" &&
          !parentId &&
          rating !== undefined
        ) {
          // Check if user already has a review for this course by checking hasReviewed state
          // or by looking for an existing review in the posts
          const { hasReviewed } = get();

          if (hasReviewed) {
            set({ error: "You have already reviewed this course" });
            return;
          }

          // Double-check by looking at posts
          const existingReview = get().posts.find(
            (post) =>
              post.authorId === currentUserId &&
              !post.parentId &&
              post.rating !== undefined,
          );

          if (existingReview) {
            set({
              error: "You have already reviewed this course",
              hasReviewed: true,
              reviewId: existingReview.id,
            });
            return;
          }
        }

        try {
          console.log(`Creating post in thread ${thread.id}:`, {
            threadId: thread.id,
            authorId: currentUserId,
            content,
            parentId: parentId || undefined,
            rating,
          });

          const newPost = await createPost(
            thread.id,
            currentUserId,
            content,
            parentId || undefined,
            rating,
          );

          // Enhance the new post with required fields for UI
          const enhancedPost: Post = {
            ...newPost,
            reactions: [],
            reactionCounts: createDefaultReactionCounts(),
            _count: { replies: 0 },
            isEdited: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            replies: [],
          };

          set((state) => {
            let updatedPosts: Post[];
            let updatedRepliesMap = { ...state.repliesMap };
            let updatedShowReplies = { ...state.showReplies };

            // For top-level posts, add to the beginning of the list
            // For replies, update the tree structure
            if (parentId) {
              updatedPosts = updatePostsTree(state.posts, (post) => {
                if (post.id === parentId) {
                  return {
                    ...post,
                    _count: {
                      ...post._count,
                      replies: (post._count?.replies || 0) + 1,
                    },
                    replies: [...(post.replies || []), enhancedPost],
                  };
                }
                return post;
              });

              // Update repliesMap to ensure UI consistency
              updatedRepliesMap[parentId] = [
                ...(state.repliesMap[parentId] || []),
                enhancedPost,
              ];

              // Automatically show replies for the parent post
              updatedShowReplies[parentId] = true;
            } else {
              // Top-level post
              updatedPosts = [enhancedPost, ...state.posts];
            }

            // If this is a course review (top-level post with rating), update hasReviewed and reviewId
            let hasReviewed = state.hasReviewed;
            let reviewId = state.reviewId;

            if (
              thread.type === "COURSE_REVIEW" &&
              !parentId &&
              rating !== undefined
            ) {
              hasReviewed = true;
              reviewId = enhancedPost.id; // Store the review post ID

              // If this is a new review, also update the thread's overall rating
              if (state.thread && typeof rating === "number") {
                state.thread.overallRating = rating;
              }
            }

            return {
              posts: updatedPosts,
              repliesMap: updatedRepliesMap,
              showReplies: updatedShowReplies,
              thread: state.thread
                ? {
                    ...state.thread,
                    _count: {
                      ...state.thread._count,
                      posts: state.thread._count.posts + 1,
                    },
                  }
                : null,
              error: null,
              hasReviewed,
              reviewId,
            };
          });

          // If this was a course review, update the review status
          if (
            thread.type === "COURSE_REVIEW" &&
            !parentId &&
            rating !== undefined
          ) {
            // Explicitly set hasReviewed to true since we just added a review
            set({ hasReviewed: true, reviewId: enhancedPost.id });

            // Refresh the thread to get updated overall rating
            await get().fetchThread();
          }
        } catch (err: any) {
          console.error("Error adding reply:", err);

          // Provide more specific error messages based on status code
          let errorMessage = "Failed to add reply";
          if (err.response?.status === 409) {
            errorMessage = "You have already reviewed this course";
            // Update hasReviewed state since the backend indicates user already has a review
            set({ hasReviewed: true });
            // Try to refresh the thread to get the existing review
            await get().fetchPosts();
          } else if (err.message) {
            errorMessage = err.message;
          }

          set({ error: errorMessage });
        }
      },

      editPost: async (postId, content, rating) => {
        const { currentUserId } = get();
        if (!currentUserId) {
          set({ error: "Please log in to edit posts" });
          return;
        }

        try {
          const updatedPost = await updatePost(
            postId,
            content,
            currentUserId,
            rating,
          );

          set((state) => ({
            posts: updatePostsTree(state.posts, (post) => {
              if (post.id === postId) {
                return { ...post, ...updatedPost };
              }

              // Check replies if post has them
              if (
                post.replies &&
                post.replies.some((reply) => reply.id === postId)
              ) {
                return {
                  ...post,
                  replies: post.replies.map((reply) =>
                    reply.id === postId ? { ...reply, ...updatedPost } : reply,
                  ),
                };
              }

              return post;
            }),
            error: null,
          }));
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to edit post";
          set({ error: errorMessage });
        }
      },

      deletePost: async (postId) => {
        const { currentUserId } = get();
        if (!currentUserId) {
          set({ error: "Vui lòng đăng nhập để xóa bình luận" });
          return;
        }

        try {
          // Optimistically update UI first
          set((state) => {
            // Remove post from the tree
            const updatedPosts = updatePostsTree(state.posts, (post) => {
              // If this is the post to delete, return null to remove it
              if (post.id === postId) {
                return null;
              }

              // If this post has replies and one of them is the target, update the count
              if (
                post.replies &&
                post.replies.some((reply) => reply.id === postId)
              ) {
                return {
                  ...post,
                  _count: {
                    ...post._count,
                    replies: Math.max(0, (post._count?.replies || 0) - 1),
                  },
                  // Filter out the deleted reply explicitly
                  replies: post.replies.filter((reply) => reply.id !== postId),
                };
              }

              return post;
            });

            // Clean up repliesMap if needed
            const updatedRepliesMap = { ...state.repliesMap };

            // If post has replies, remove all its replies from repliesMap
            if (state.repliesMap[postId]) {
              delete updatedRepliesMap[postId];
            }

            // Also check if the post is a reply, remove it from its parent's repliesMap
            Object.keys(updatedRepliesMap).forEach((parentId) => {
              if (
                updatedRepliesMap[parentId]?.some(
                  (reply) => reply.id === postId,
                )
              ) {
                updatedRepliesMap[parentId] = updatedRepliesMap[
                  parentId
                ].filter((reply) => reply.id !== postId);
              }
            });

            // Update showReplies state
            const updatedShowReplies = { ...state.showReplies };

            // If deleted post had replies being shown, remove that entry
            if (updatedShowReplies[postId]) {
              delete updatedShowReplies[postId];
            }

            return {
              posts: updatedPosts,
              thread: state.thread
                ? {
                    ...state.thread,
                    _count: {
                      ...state.thread._count,
                      posts: Math.max(0, state.thread._count.posts - 1),
                    },
                  }
                : null,
              repliesMap: updatedRepliesMap,
              showReplies: updatedShowReplies,
              error: null,
            };
          });

          // Then send request to server
          await deletePost(postId, currentUserId);
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Không thể xóa bình luận";
          set({ error: errorMessage });

          // If deletion fails, refresh the posts to restore state
          const { currentThreadId } = get();
          if (currentThreadId) {
            await get().fetchPosts();
          }
        }
      },

      // Socket-related methods
      onNewReply: (postId: string) => {
        // Fetch replies for the parent post if they haven't been loaded yet
        const state = get();
        if (!state.repliesMap[postId]) {
          get().fetchReplies(postId);
        }

        // Find the parent post to check if it belongs to the current user
        const parentPost = findPostInTree(state.posts, postId);

        // Only automatically show replies if the parent post belongs to the current user
        if (parentPost && parentPost.authorId === state.currentUserId) {
          set((state) => ({
            showReplies: {
              ...state.showReplies,
              [postId]: true,
            },
          }));
        }
      },

      initializeSocket: () => {
        const { currentThreadId, currentUserId, currentUserName } = get();
        if (!currentThreadId || !currentUserId || !currentUserName) {
          console.error("Missing required data for socket initialization", {
            threadId: currentThreadId,
            userId: currentUserId,
            userName: currentUserName,
          });
          return;
        }

        console.log(
          "Initializing socket in store for thread:",
          currentThreadId,
        );

        // Clean up existing socket connection before initializing a new one
        // This ensures we don't have duplicate listeners
        get().cleanupSocket();
        set({ isReconnecting: false });

        try {
          // Connect to socket server
          const socket = socketService.connect();

          if (!socket) {
            console.error("Failed to create socket connection");
            set({
              isConnected: false,
              connectionError: "Failed to create socket connection",
              isReconnecting: false,
            });
            return;
          }

          // Connection event handlers
          socket.on("connect", () => {
            console.log("Socket connected event in store");
            set({
              isConnected: true,
              connectionError: null,
              isReconnecting: false,
            });

            // Join thread after successful connection
            socketService.joinThread(
              currentThreadId,
              currentUserId,
              currentUserName,
            );
          });

          socket.on("connect_error", (error: any) => {
            const errorMessage =
              error.message || "Failed to connect to discussion server";
            console.error("Socket connection error in store:", errorMessage);

            // Only set reconnecting if it's not a namespace error (which indicates a configuration issue)
            const isNamespaceError =
              error.message?.includes("Invalid namespace");
            set({
              isConnected: false,
              isReconnecting: !isNamespaceError,
              connectionError: errorMessage,
            });
          });

          socket.on("disconnect", (reason: string) => {
            console.log(`Socket disconnected in store: ${reason}`);
            const isManualDisconnect =
              reason === "io server disconnect" ||
              reason === "io client disconnect";

            set({
              isConnected: false,
              isReconnecting: !isManualDisconnect,
              connectionError: `Disconnected: ${reason}`,
            });
          });

          socket.on("reconnect", (attemptNumber: number) => {
            console.log(`Socket reconnected after ${attemptNumber} attempts`);
            set({
              isConnected: true,
              connectionError: null,
              isReconnecting: false,
            });

            // Re-join thread after reconnection
            socketService.joinThread(
              currentThreadId,
              currentUserId,
              currentUserName,
            );
          });

          socket.on("reconnect_error", (error: any) => {
            console.error("Socket reconnection error:", error);
          });

          socket.on("reconnect_failed", () => {
            console.error("Socket reconnection failed after all attempts");
            set({
              isReconnecting: false,
              connectionError: "Không thể kết nối lại sau nhiều lần thử",
            });
          });

          // Initial join thread attempt - only if socket is already connected
          // Otherwise the connect event handler will handle this
          if (socket.connected) {
            console.log("Socket already connected, joining thread immediately");
            socketService.joinThread(
              currentThreadId,
              currentUserId,
              currentUserName,
            );
          } else {
            console.log(
              "Socket not yet connected, will join thread on connect event",
            );
          }
        } catch (error) {
          console.error("Error during socket initialization:", error);
          set({
            isConnected: false,
            connectionError:
              error instanceof Error
                ? error.message
                : "Unknown socket initialization error",
            isReconnecting: false,
          });
        }

        // Handle real-time post events
        socketService.onNewPost((post) => {
          try {
            set((state) => {
              // Ignore own posts - we've already handled them optimistically
              if (post.authorId === state.currentUserId) return state;

              // Play notification sound when receiving posts from others
              playNotificationSound();

              // Ensure the post has all required fields for UI
              const enhancedPost = {
                ...post,
                reactions: post.reactions || [],
                reactionCounts:
                  post.reactionCounts || createDefaultReactionCounts(),
                _count: post._count || { replies: 0 },
                replies: post.replies || [],
              };

              // Check if post already exists in state to avoid duplicates
              const existingPost = findPostInTree(state.posts, post.id);
              if (existingPost) {
                console.log(
                  `Post ${post.id} already exists in state, ignoring`,
                );
                return state;
              }

              // If it's a reply to a post, handle it
              if (post.parentId) {
                console.log(`Received new reply to post ${post.parentId}`);

                // Find the parent post
                const parentPost = findPostInTree(state.posts, post.parentId);

                // For parent posts that belong to current user, automatically show replies
                if (parentPost && parentPost.authorId === state.currentUserId) {
                  console.log(
                    `Auto-showing replies for user's post ${post.parentId}`,
                  );

                  // Update showReplies directly here to ensure it happens
                  set((prevState) => ({
                    showReplies: {
                      ...prevState.showReplies,
                      [post.parentId as string]: true,
                    },
                  }));

                  // Also ensure replies are loaded for this parent
                  if (!state.repliesMap[post.parentId as string]) {
                    get().fetchReplies(post.parentId as string);
                  }
                }

                if (!parentPost) {
                  console.log(
                    `Parent post ${post.parentId} not found, ignoring reply`,
                  );
                  return state;
                }

                // Update posts tree
                const updatedPosts = updatePostsTree(state.posts, (p) => {
                  if (p.id === post.parentId) {
                    const replies = p.replies || [];
                    if (replies.some((r) => r.id === post.id)) return p;

                    return {
                      ...p,
                      _count: {
                        ...p._count,
                        replies: (p._count?.replies || 0) + 1,
                      },
                      replies: [...replies, enhancedPost],
                    };
                  }
                  return p;
                });

                // Update replies map
                const updatedRepliesMap = { ...state.repliesMap };
                if (
                  !updatedRepliesMap[post.parentId]?.some(
                    (r) => r.id === post.id,
                  )
                ) {
                  updatedRepliesMap[post.parentId] = [
                    ...(updatedRepliesMap[post.parentId] || []),
                    enhancedPost,
                  ];
                }

                return {
                  ...state,
                  posts: updatedPosts,
                  repliesMap: updatedRepliesMap,
                };
              }

              // It's a top-level post
              console.log(`Received new top-level post ${post.id}`);
              return {
                ...state,
                posts: [enhancedPost, ...state.posts],
                thread: state.thread
                  ? {
                      ...state.thread,
                      _count: {
                        ...state.thread._count,
                        posts: state.thread._count.posts + 1,
                      },
                    }
                  : null,
              };
            });
          } catch (error) {
            console.error("Error handling new post event:", error);
          }
        });

        socketService.onUpdatePost((post) => {
          try {
            set((state) => {
              // Don't update if this is our own post update (should already be reflected in UI)
              if (post.authorId === state.currentUserId) return state;

              console.log(`Received update for post ${post.id}`);

              // Ensure we have the complete post object with necessary fields for UI
              const enhancedPost = {
                ...post,
                reactions: post.reactions || [],
                reactionCounts:
                  post.reactionCounts || createDefaultReactionCounts(),
                _count: post._count || { replies: 0 },
                replies: post.replies || [],
              };

              // Check if the post exists in our state
              const existingPost = findPostInTree(state.posts, post.id);
              if (!existingPost) {
                console.log(
                  `Post ${post.id} not found in state, ignoring update`,
                );
                return state;
              }

              // Update post in tree
              const updatedPosts = updatePostsTree(state.posts, (p) => {
                if (p.id === post.id) {
                  // Preserve existing replies and reactions if they're not in the updated post
                  return {
                    ...enhancedPost,
                    replies: p.replies || [],
                    reactions: post.reactions || p.reactions || [],
                    reactionCounts:
                      post.reactionCounts ||
                      p.reactionCounts ||
                      createDefaultReactionCounts(),
                  };
                }
                return p;
              });

              // Update reply in maps if needed
              const updatedRepliesMap = { ...state.repliesMap };

              // If it's a reply (has a parentId), update in the parent's reply map
              if (post.parentId && updatedRepliesMap[post.parentId]) {
                const parentReplies = updatedRepliesMap[post.parentId];
                const replyExists = parentReplies.some(
                  (reply) => reply.id === post.id,
                );

                if (replyExists) {
                  updatedRepliesMap[post.parentId] = parentReplies.map(
                    (reply) =>
                      reply.id === post.id
                        ? {
                            ...enhancedPost,
                            replies: reply.replies || [],
                            reactions: post.reactions || reply.reactions || [],
                            reactionCounts:
                              post.reactionCounts ||
                              reply.reactionCounts ||
                              createDefaultReactionCounts(),
                          }
                        : reply,
                  );
                } else {
                  console.log(
                    `Reply ${post.id} not found in parent's repliesMap, skipping update`,
                  );
                }
              }

              return {
                ...state,
                posts: updatedPosts,
                repliesMap: updatedRepliesMap,
              };
            });
          } catch (error) {
            console.error("Error handling post update event:", error);
          }
        });

        socketService.onDeletePost(({ postId }) => {
          try {
            set((state) => {
              console.log(`Received delete event for post ${postId}`);

              // If we're deleting our own post, we've already handled it optimistically
              // Find the post to get more details before removing
              const postToDelete = findPostInTree(state.posts, postId);
              if (!postToDelete) {
                console.log(
                  `Post ${postId} not found in state, ignoring delete event`,
                );
                return state;
              }

              // Check if this is our own post (should already be handled optimistically)
              if (postToDelete.authorId === state.currentUserId) {
                console.log(
                  `Post ${postId} is our own post, already handled optimistically`,
                );
                return state;
              }

              // Find parent post if this is a reply
              const parentId = postToDelete.parentId;
              console.log(
                `Deleting post ${postId}${parentId ? ` (reply to ${parentId})` : " (top-level)"}`,
              );

              // Remove post from tree
              const updatedPosts = updatePostsTree(state.posts, (post) => {
                if (post.id === postId) {
                  return null; // Remove this post
                }

                // If this post has the target as a reply, update count and remove the reply
                if (
                  post.replies &&
                  post.replies.some((reply) => reply.id === postId)
                ) {
                  return {
                    ...post,
                    _count: {
                      ...post._count,
                      replies: Math.max(0, (post._count?.replies || 0) - 1),
                    },
                    replies: post.replies.filter(
                      (reply) => reply.id !== postId,
                    ),
                  };
                }

                return post;
              });

              // Clean up repliesMap
              const updatedRepliesMap = { ...state.repliesMap };

              // Remove the post's own replies map if it had replies
              if (updatedRepliesMap[postId]) {
                console.log(`Removing replies map for deleted post ${postId}`);
                delete updatedRepliesMap[postId];
              }

              // If it was a reply, remove it from its parent's repliesMap
              if (parentId && updatedRepliesMap[parentId]) {
                const beforeLength = updatedRepliesMap[parentId].length;
                updatedRepliesMap[parentId] = updatedRepliesMap[
                  parentId
                ].filter((reply) => reply.id !== postId);
                const afterLength = updatedRepliesMap[parentId].length;

                if (beforeLength !== afterLength) {
                  console.log(
                    `Removed reply ${postId} from parent ${parentId} repliesMap`,
                  );
                }
              }

              // Clean up showReplies state too
              const updatedShowReplies = { ...state.showReplies };
              if (updatedShowReplies[postId]) {
                console.log(
                  `Removing showReplies entry for deleted post ${postId}`,
                );
                delete updatedShowReplies[postId];
              }

              // Update thread post count if this was a top-level post
              const isTopLevelPost = !parentId;
              const updatedThread =
                state.thread && isTopLevelPost
                  ? {
                      ...state.thread,
                      _count: {
                        ...state.thread._count,
                        posts: Math.max(0, state.thread._count.posts - 1),
                      },
                    }
                  : state.thread;

              return {
                ...state,
                posts: updatedPosts,
                repliesMap: updatedRepliesMap,
                showReplies: updatedShowReplies,
                thread: updatedThread,
              };
            });
          } catch (error) {
            console.error("Error handling post delete event:", error);
          }
        });

        // Handle real-time reaction events
        socketService.onNewReaction((reaction) => {
          try {
            // Ignore reactions from the current user (already handled optimistically)
            if (reaction.userId === currentUserId) return;

            console.log(
              `Received new reaction from user ${reaction.userId} on post ${reaction.postId}`,
            );

            set((state) => {
              // Check if the post exists in our state
              const targetPost = findPostInTree(state.posts, reaction.postId);
              if (!targetPost) {
                console.log(
                  `Post ${reaction.postId} not found in state, ignoring reaction`,
                );
                return state;
              }

              // Check if this reaction already exists (to avoid duplicates)
              const existingReaction = targetPost.reactions.find(
                (r) =>
                  r.id === reaction.id ||
                  (r.userId === reaction.userId && r.type === reaction.type),
              );

              if (existingReaction) {
                console.log(`Reaction already exists, ignoring`);
                return state;
              }

              // Update posts tree to add the new reaction
              const updatedPosts = updatePostsTree(state.posts, (post) => {
                if (post.id === reaction.postId) {
                  // Create a safe copy of reactionCounts with default values
                  const reactionCounts =
                    post.reactionCounts || createDefaultReactionCounts();
                  const updatedReactionCounts = {
                    ...reactionCounts,
                    [reaction.type]: reactionCounts[reaction.type] + 1,
                    total: reactionCounts.total + 1,
                  };

                  return {
                    ...post,
                    reactions: [...post.reactions, reaction],
                    reactionCounts: updatedReactionCounts,
                  };
                }

                // Check if this is a reply
                if (post.replies) {
                  let hasUpdatedReply = false;
                  const updatedReplies = post.replies.map((reply) => {
                    if (reply.id === reaction.postId) {
                      // Check if this reaction already exists in the reply
                      const replyHasReaction = reply.reactions.some(
                        (r) =>
                          r.id === reaction.id ||
                          (r.userId === reaction.userId &&
                            r.type === reaction.type),
                      );

                      if (replyHasReaction) {
                        return reply;
                      }

                      hasUpdatedReply = true;
                      // Create a safe copy of reactionCounts with default values
                      const reactionCounts =
                        reply.reactionCounts || createDefaultReactionCounts();
                      const updatedReactionCounts = {
                        ...reactionCounts,
                        [reaction.type]: reactionCounts[reaction.type] + 1,
                        total: reactionCounts.total + 1,
                      };

                      return {
                        ...reply,
                        reactions: [...reply.reactions, reaction],
                        reactionCounts: updatedReactionCounts,
                      };
                    }
                    return reply;
                  });

                  if (hasUpdatedReply) {
                    return {
                      ...post,
                      replies: updatedReplies,
                    };
                  }
                }

                return post;
              });

              // Update repliesMap if needed
              const updatedRepliesMap = { ...state.repliesMap };
              Object.keys(updatedRepliesMap).forEach((parentId) => {
                const parentReplies = updatedRepliesMap[parentId];
                if (
                  parentReplies.some((reply) => reply.id === reaction.postId)
                ) {
                  updatedRepliesMap[parentId] = parentReplies.map((reply) => {
                    if (reply.id === reaction.postId) {
                      // Check if this reaction already exists in the reply
                      const replyHasReaction = reply.reactions.some(
                        (r) =>
                          r.id === reaction.id ||
                          (r.userId === reaction.userId &&
                            r.type === reaction.type),
                      );

                      if (replyHasReaction) {
                        return reply;
                      }

                      // Create a safe copy of reactionCounts with default values
                      const reactionCounts =
                        reply.reactionCounts || createDefaultReactionCounts();
                      const updatedReactionCounts = {
                        ...reactionCounts,
                        [reaction.type]: reactionCounts[reaction.type] + 1,
                        total: reactionCounts.total + 1,
                      };

                      return {
                        ...reply,
                        reactions: [...reply.reactions, reaction],
                        reactionCounts: updatedReactionCounts,
                      };
                    }
                    return reply;
                  });
                }
              });

              return {
                ...state,
                posts: updatedPosts,
                repliesMap: updatedRepliesMap,
              };
            });
          } catch (error) {
            console.error("Error handling new reaction event:", error);
          }
        });

        socketService.onUpdateReaction((reaction) => {
          // Ignore reactions from the current user (already handled)
          if (reaction.userId === currentUserId) return;

          set((state) => {
            // Update posts tree to update the reaction
            const updatedPosts = updatePostsTree(state.posts, (post) => {
              if (post.id === reaction.postId) {
                // Find the old reaction to determine type
                const oldReaction = post.reactions.find(
                  (r) => r.id === reaction.id,
                );

                if (oldReaction) {
                  const oldType = oldReaction.type;
                  // Update reaction counts
                  const reactionCounts =
                    post.reactionCounts || createDefaultReactionCounts();
                  const updatedReactionCounts = {
                    ...reactionCounts,
                    [oldType]: Math.max(0, reactionCounts[oldType] - 1),
                    [reaction.type]: reactionCounts[reaction.type] + 1,
                  };

                  return {
                    ...post,
                    reactions: post.reactions.map((r) =>
                      r.id === reaction.id ? reaction : r,
                    ),
                    reactionCounts: updatedReactionCounts,
                  };
                }
              }

              // Check if this is a reply
              if (post.replies) {
                let hasUpdatedReply = false;
                const updatedReplies = post.replies.map((reply) => {
                  if (reply.id === reaction.postId) {
                    // Find the old reaction to determine type
                    const oldReaction = reply.reactions.find(
                      (r) => r.id === reaction.id,
                    );

                    if (oldReaction) {
                      const oldType = oldReaction.type;
                      // Update reaction counts
                      const reactionCounts =
                        reply.reactionCounts || createDefaultReactionCounts();
                      const updatedReactionCounts = {
                        ...reactionCounts,
                        [oldType]: Math.max(0, reactionCounts[oldType] - 1),
                        [reaction.type]: reactionCounts[reaction.type] + 1,
                      };

                      hasUpdatedReply = true;
                      return {
                        ...reply,
                        reactions: reply.reactions.map((r) =>
                          r.id === reaction.id ? reaction : r,
                        ),
                        reactionCounts: updatedReactionCounts,
                      };
                    }
                  }
                  return reply;
                });

                if (hasUpdatedReply) {
                  return {
                    ...post,
                    replies: updatedReplies,
                  };
                }
              }

              return post;
            });

            // Update repliesMap if needed
            const updatedRepliesMap = { ...state.repliesMap };
            Object.keys(updatedRepliesMap).forEach((parentId) => {
              if (
                updatedRepliesMap[parentId].some(
                  (reply) => reply.id === reaction.postId,
                )
              ) {
                updatedRepliesMap[parentId] = updatedRepliesMap[parentId].map(
                  (reply) => {
                    if (reply.id === reaction.postId) {
                      // Find the old reaction to determine type
                      const oldReaction = reply.reactions.find(
                        (r) => r.id === reaction.id,
                      );

                      if (oldReaction) {
                        const oldType = oldReaction.type;
                        // Update reaction counts
                        const reactionCounts =
                          reply.reactionCounts || createDefaultReactionCounts();
                        const updatedReactionCounts = {
                          ...reactionCounts,
                          [oldType]: Math.max(0, reactionCounts[oldType] - 1),
                          [reaction.type]: reactionCounts[reaction.type] + 1,
                        };

                        return {
                          ...reply,
                          reactions: reply.reactions.map((r) =>
                            r.id === reaction.id ? reaction : r,
                          ),
                          reactionCounts: updatedReactionCounts,
                        };
                      }
                    }
                    return reply;
                  },
                );
              }
            });

            return {
              ...state,
              posts: updatedPosts,
              repliesMap: updatedRepliesMap,
            };
          });
        });

        socketService.onDeleteReaction(({ reactionId, postId }) => {
          set((state) => {
            // Update posts tree to remove the reaction
            const updatedPosts = updatePostsTree(state.posts, (post) => {
              if (post.id === postId) {
                // Find the reaction to determine its type
                const reactionToRemove = post.reactions.find(
                  (r) => r.id === reactionId,
                );

                if (reactionToRemove) {
                  const typeToRemove = reactionToRemove.type;
                  // Update reaction counts
                  const reactionCounts =
                    post.reactionCounts || createDefaultReactionCounts();
                  const updatedReactionCounts = updateReactionCountsForRemove(
                    reactionCounts,
                    typeToRemove,
                  );

                  return {
                    ...post,
                    reactions: post.reactions.filter(
                      (r) => r.id !== reactionId,
                    ),
                    reactionCounts: updatedReactionCounts,
                  };
                }
              }

              // Check if this is a reply
              if (post.replies) {
                let hasUpdatedReply = false;
                const updatedReplies = post.replies.map((reply) => {
                  if (reply.id === postId) {
                    // Find the reaction to determine its type
                    const reactionToRemove = reply.reactions.find(
                      (r) => r.id === reactionId,
                    );

                    if (reactionToRemove) {
                      const typeToRemove = reactionToRemove.type;
                      // Update reaction counts
                      const reactionCounts =
                        reply.reactionCounts || createDefaultReactionCounts();
                      const updatedReactionCounts =
                        updateReactionCountsForRemove(
                          reactionCounts,
                          typeToRemove,
                        );

                      hasUpdatedReply = true;
                      return {
                        ...reply,
                        reactions: reply.reactions.filter(
                          (r) => r.id !== reactionId,
                        ),
                        reactionCounts: updatedReactionCounts,
                      };
                    }
                  }
                  return reply;
                });

                if (hasUpdatedReply) {
                  return {
                    ...post,
                    replies: updatedReplies,
                  };
                }
              }

              return post;
            });

            // Update repliesMap if needed
            const updatedRepliesMap = { ...state.repliesMap };
            Object.keys(updatedRepliesMap).forEach((parentId) => {
              if (
                updatedRepliesMap[parentId].some((reply) => reply.id === postId)
              ) {
                updatedRepliesMap[parentId] = updatedRepliesMap[parentId].map(
                  (reply) => {
                    if (reply.id === postId) {
                      // Find the reaction to determine its type
                      const reactionToRemove = reply.reactions.find(
                        (r) => r.id === reactionId,
                      );

                      if (reactionToRemove) {
                        const typeToRemove = reactionToRemove.type;
                        // Update reaction counts
                        const reactionCounts =
                          reply.reactionCounts || createDefaultReactionCounts();
                        const updatedReactionCounts =
                          updateReactionCountsForRemove(
                            reactionCounts,
                            typeToRemove,
                          );

                        return {
                          ...reply,
                          reactions: reply.reactions.filter(
                            (r) => r.id !== reactionId,
                          ),
                          reactionCounts: updatedReactionCounts,
                        };
                      }
                    }
                    return reply;
                  },
                );
              }
            });

            return {
              ...state,
              posts: updatedPosts,
              repliesMap: updatedRepliesMap,
            };
          });
        });

        // Thread users handlers
        socketService.onThreadUsers((data) => {
          try {
            if (data.threadId === currentThreadId) {
              console.log(
                `Received thread users update for thread ${data.threadId}: ${data.users.length} users`,
              );
              set({ threadUsers: data.users });
            } else {
              console.log(
                `Received thread users for different thread ${data.threadId}, ignoring`,
              );
            }
          } catch (error) {
            console.error("Error handling thread users event:", error);
          }
        });

        socketService.onUserJoined((user) => {
          try {
            // Ignore if it's the current user joining
            if (user.userId === currentUserId) {
              console.log(`Ignoring our own join event`);
              return;
            }

            console.log(
              `User ${user.userName} (${user.userId}) joined the thread`,
            );

            // Update the thread users list
            set((state) => {
              // Check if user is already in the list
              const userExists = state.threadUsers.some(
                (u) => u.userId === user.userId,
              );

              if (userExists) {
                console.log(
                  `User ${user.userId} already in thread users list, updating`,
                );
                return {
                  threadUsers: state.threadUsers.map((u) =>
                    u.userId === user.userId ? user : u,
                  ),
                };
              } else {
                console.log(`Adding user ${user.userId} to thread users list`);
                return {
                  threadUsers: [...state.threadUsers, user],
                };
              }
            });
          } catch (error) {
            console.error("Error handling user joined event:", error);
          }
        });
      },

      cleanupSocket: () => {
        const { currentThreadId, currentUserId } = get();

        console.log("Cleaning up socket in store");

        // Only attempt to leave thread if we have both IDs and we're connected
        if (currentThreadId && currentUserId) {
          console.log(
            `Leaving thread ${currentThreadId} as user ${currentUserId}`,
          );
          socketService.leaveThread(currentThreadId, currentUserId);
        }

        // Remove all socket event listeners first to prevent memory leaks
        socketService.removeAllListeners();

        // Then disconnect the socket
        socketService.disconnect();

        // Reset all socket-related state
        set({
          isConnected: false,
          connectionError: null,
          isReconnecting: false,
          threadUsers: [],
          // Don't reset posts and data to keep cached state
          // Reset UI states
          showReplies: {},
          isLoadingMore: false,
          loadingReplies: {},
        });

        console.log("Socket cleanup complete");
      },
    }),
    {
      name: "discussion-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist these states
        thread: state.thread,
        posts: state.posts,
        currentUserId: state.currentUserId,
        currentUserName: state.currentUserName,
        currentThreadId: state.currentThreadId,
        repliesMap: state.repliesMap,
        hasReviewed: state.hasReviewed,
        reviewId: state.reviewId,
        lastFetchedThreadId: state.lastFetchedThreadId,
        lastFetchedUserId: state.lastFetchedUserId,
        // Don't persist UI states, socket states, and loading states
      }),
    },
  ),
);
