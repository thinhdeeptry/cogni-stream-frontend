import { create } from "zustand";
import type { Post, ReactionType, Reaction, ThreadWithPostCount } from "./type";
import {
  createPost,
  updatePost,
  deletePost,
  addReaction,
  removeReaction,
  updateReaction,
  getThread,
  getPosts,
  findReplies,
  checkUserReview,
} from "./discussion.action";
import socketService from "./socket";

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
  setCurrentUserId: (userId: string) => void;
  setCurrentUserName: (userName: string) => void;
  setCurrentThreadId: (threadId: string) => void;
  initializeSocket: () => void;
  cleanupSocket: () => void;
  fetchThread: () => Promise<void>;
  fetchPosts: (page?: number) => Promise<void>;
  fetchReplies: (postId: string, page?: number) => Promise<void>;
  addReply: (
    parentId: string | null,
    content: string,
    rating?: number,
  ) => Promise<void>;
  editPost: (postId: string, content: string, rating?: number) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  addReaction: (
    postId: string,
    reactionType: ReactionType,
    existingReactionId?: string,
  ) => Promise<void>;
  removeReaction: (
    reactionId: string,
    reactionType: ReactionType,
  ) => Promise<void>;
  checkUserReview: (courseId: string) => Promise<void>;
  onNewReply: (postId: string) => void;
}

const POSTS_PER_PAGE = 5;
const REPLIES_PER_PAGE = 3;

export const useDiscussionStore = create<DiscussionState>()((set, get) => ({
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

  setCurrentUserId: (userId) => set({ currentUserId: userId }),
  setCurrentUserName: (userName) => set({ currentUserName: userName }),
  setCurrentThreadId: (threadId) => set({ currentThreadId: threadId }),

  checkUserReview: async (courseId) => {
    const { currentUserId } = get();
    if (!currentUserId || !courseId) return;

    try {
      const { hasReviewed, reviewId } = await checkUserReview(
        courseId,
        currentUserId,
      );
      set({ hasReviewed, reviewId });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to check review status";
      set({ error: errorMessage });
    }
  },

  fetchThread: async () => {
    const { currentThreadId, currentUserId } = get();
    if (!currentThreadId) return;

    try {
      set({ isLoading: true, error: null });
      const thread = await getThread(currentThreadId);

      // Check for user review if it's a course review thread
      if (thread.type === "COURSE_REVIEW" && currentUserId) {
        const { hasReviewed, reviewId } = await checkUserReview(
          currentThreadId,
          currentUserId,
        );
        set({
          thread,
          posts: thread.posts || [],
          currentPage: 1,
          isLoading: false,
          hasReviewed,
          reviewId,
        });
      } else {
        set({
          thread,
          posts: thread.posts || [],
          currentPage: 1,
          isLoading: false,
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchPosts: async (page?: number) => {
    const { currentThreadId } = get();
    if (!currentThreadId) return;

    try {
      set({ isLoading: true, error: null });
      const currentPage = page || 1;
      const posts = await getPosts(
        currentThreadId,
        currentPage,
        POSTS_PER_PAGE,
      );

      if (page && page > 1) {
        set((state) => ({
          posts: [...state.posts, ...posts],
          currentPage,
          isLoading: false,
        }));
      } else {
        set({
          posts,
          currentPage: 1,
          isLoading: false,
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchReplies: async (postId: string, page?: number) => {
    try {
      set({ isLoading: true, error: null });
      const currentPage = page || 1;
      const replies = await findReplies(postId, currentPage, REPLIES_PER_PAGE);

      set((state) => {
        // Helper function to update replies in the tree
        const updateRepliesInTree = (
          posts: Post[],
          targetId: string,
          newReplies: Post[],
          page: number,
        ): Post[] => {
          return posts.map((post) => {
            if (post.id === targetId) {
              const existingReplies = state.repliesMap[targetId] || [];
              const updatedReplies =
                page === 1 ? newReplies : [...existingReplies, ...newReplies];
              return {
                ...post,
                replies: updatedReplies,
              };
            }
            if (post.replies && post.replies.length > 0) {
              return {
                ...post,
                replies: updateRepliesInTree(
                  post.replies,
                  targetId,
                  newReplies,
                  page,
                ),
              };
            }
            return post;
          });
        };

        // Update replies in both posts and repliesMap
        const updatedPosts = updateRepliesInTree(
          state.posts,
          postId,
          replies,
          currentPage,
        );
        const existingReplies = state.repliesMap[postId] || [];
        const updatedRepliesMap = {
          ...state.repliesMap,
          [postId]:
            currentPage === 1 ? replies : [...existingReplies, ...replies],
        };

        return {
          posts: updatedPosts,
          repliesMap: updatedRepliesMap,
          replyPages: {
            ...state.replyPages,
            [postId]: currentPage,
          },
          isLoading: false,
        };
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load replies";
      set({ error: errorMessage, isLoading: false });
    }
  },

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
      set((state) => ({
        posts: state.posts.map((post) => {
          if (post.id === postId) {
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
            const updatedReactionCounts = {
              LIKE: post.reactionCounts?.LIKE || 0,
              LOVE: post.reactionCounts?.LOVE || 0,
              CARE: post.reactionCounts?.CARE || 0,
              HAHA: post.reactionCounts?.HAHA || 0,
              WOW: post.reactionCounts?.WOW || 0,
              SAD: post.reactionCounts?.SAD || 0,
              ANGRY: post.reactionCounts?.ANGRY || 0,
              total: post.reactionCounts?.total || 0,
            };

            // If there's an existing reaction, decrement its count first
            if (existingReaction) {
              updatedReactionCounts[existingReaction.type] = Math.max(
                0,
                updatedReactionCounts[existingReaction.type] - 1,
              );
            } else {
              // Only increment total if we're not replacing an existing reaction
              updatedReactionCounts.total += 1;
            }

            // Increment the new reaction type count
            updatedReactionCounts[reactionType] += 1;

            return {
              ...post,
              reactions: [
                ...post.reactions.filter((r) => r.userId !== currentUserId),
                newReaction,
              ],
              reactionCounts: updatedReactionCounts,
            };
          }

          if (post.replies) {
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
                  const updatedReactionCounts = {
                    LIKE: reply.reactionCounts?.LIKE || 0,
                    LOVE: reply.reactionCounts?.LOVE || 0,
                    CARE: reply.reactionCounts?.CARE || 0,
                    HAHA: reply.reactionCounts?.HAHA || 0,
                    WOW: reply.reactionCounts?.WOW || 0,
                    SAD: reply.reactionCounts?.SAD || 0,
                    ANGRY: reply.reactionCounts?.ANGRY || 0,
                    total: reply.reactionCounts?.total || 0,
                  };

                  // If there's an existing reaction, decrement its count first
                  if (existingReaction) {
                    updatedReactionCounts[existingReaction.type] = Math.max(
                      0,
                      updatedReactionCounts[existingReaction.type] - 1,
                    );
                  } else {
                    // Only increment total if we're not replacing an existing reaction
                    updatedReactionCounts.total += 1;
                  }

                  // Increment the new reaction type count
                  updatedReactionCounts[reactionType] += 1;

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
          return post;
        }),
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add reaction";
      set({ error: errorMessage });

      // If the server request fails, revert the optimistic update
      set((state) => ({
        posts: state.posts.map((post) => {
          if (post.id === postId) {
            const filteredReactions = post.reactions.filter(
              (r) => !(r.userId === currentUserId && r.type === reactionType),
            );

            // Create a safe copy of reactionCounts with default values
            const updatedReactionCounts = {
              LIKE: post.reactionCounts?.LIKE || 0,
              LOVE: post.reactionCounts?.LOVE || 0,
              CARE: post.reactionCounts?.CARE || 0,
              HAHA: post.reactionCounts?.HAHA || 0,
              WOW: post.reactionCounts?.WOW || 0,
              SAD: post.reactionCounts?.SAD || 0,
              ANGRY: post.reactionCounts?.ANGRY || 0,
              total: post.reactionCounts?.total || 0,
            };

            // Decrement the specific reaction count if needed
            if (updatedReactionCounts[reactionType] > 0) {
              updatedReactionCounts[reactionType] -= 1;
            }

            // Update the total count
            if (updatedReactionCounts.total > 0) {
              updatedReactionCounts.total -= 1;
            }

            return {
              ...post,
              reactions: filteredReactions,
              reactionCounts: updatedReactionCounts,
            };
          }

          if (post.replies) {
            return {
              ...post,
              replies: post.replies.map((reply) => {
                if (reply.id === postId) {
                  const filteredReactions = reply.reactions.filter(
                    (r) =>
                      !(r.userId === currentUserId && r.type === reactionType),
                  );

                  // Create a safe copy of reactionCounts with default values
                  const updatedReactionCounts = {
                    LIKE: reply.reactionCounts?.LIKE || 0,
                    LOVE: reply.reactionCounts?.LOVE || 0,
                    CARE: reply.reactionCounts?.CARE || 0,
                    HAHA: reply.reactionCounts?.HAHA || 0,
                    WOW: reply.reactionCounts?.WOW || 0,
                    SAD: reply.reactionCounts?.SAD || 0,
                    ANGRY: reply.reactionCounts?.ANGRY || 0,
                    total: reply.reactionCounts?.total || 0,
                  };

                  // Decrement the specific reaction count if needed
                  if (updatedReactionCounts[reactionType] > 0) {
                    updatedReactionCounts[reactionType] -= 1;
                  }

                  // Update the total count
                  if (updatedReactionCounts.total > 0) {
                    updatedReactionCounts.total -= 1;
                  }

                  return {
                    ...reply,
                    reactions: filteredReactions,
                    reactionCounts: updatedReactionCounts,
                  };
                }
                return reply;
              }),
            };
          }
          return post;
        }),
      }));
    }
  },

  removeReaction: async (reactionId: string, reactionType: ReactionType) => {
    const { currentUserId } = get();
    if (!currentUserId) {
      set({ error: "Please log in to remove reactions" });
      return;
    }

    try {
      // Update UI immediately for better UX
      set((state) => ({
        posts: state.posts.map((post) => {
          // Update top-level post reactions
          if (
            post.reactions &&
            post.reactions.some((r) => r.id === reactionId)
          ) {
            // Get the reaction to determine its type if possible
            const reactionToRemove = post.reactions.find(
              (r) => r.id === reactionId,
            );
            const typeToRemove = reactionToRemove?.type || reactionType;

            // Create a safe copy of reactionCounts with default values
            const updatedReactionCounts = {
              LIKE: post.reactionCounts?.LIKE || 0,
              LOVE: post.reactionCounts?.LOVE || 0,
              CARE: post.reactionCounts?.CARE || 0,
              HAHA: post.reactionCounts?.HAHA || 0,
              WOW: post.reactionCounts?.WOW || 0,
              SAD: post.reactionCounts?.SAD || 0,
              ANGRY: post.reactionCounts?.ANGRY || 0,
              total: post.reactionCounts?.total || 0,
            };

            // Decrement the specific reaction count (ensure it doesn't go below 0)
            if (updatedReactionCounts[typeToRemove] > 0) {
              updatedReactionCounts[typeToRemove] -= 1;
            }

            // Update the total count
            if (updatedReactionCounts.total > 0) {
              updatedReactionCounts.total -= 1;
            }

            return {
              ...post,
              reactions: post.reactions.filter((r) => r.id !== reactionId),
              reactionCounts: updatedReactionCounts,
            };
          }

          // Check for reactions in replies
          if (post.replies) {
            return {
              ...post,
              replies: post.replies.map((reply) => {
                if (
                  reply.reactions &&
                  reply.reactions.some((r) => r.id === reactionId)
                ) {
                  // Get the reaction to determine its type if possible
                  const reactionToRemove = reply.reactions.find(
                    (r) => r.id === reactionId,
                  );
                  const typeToRemove = reactionToRemove?.type || reactionType;

                  // Create a safe copy of reactionCounts with default values
                  const updatedReactionCounts = {
                    LIKE: reply.reactionCounts?.LIKE || 0,
                    LOVE: reply.reactionCounts?.LOVE || 0,
                    CARE: reply.reactionCounts?.CARE || 0,
                    HAHA: reply.reactionCounts?.HAHA || 0,
                    WOW: reply.reactionCounts?.WOW || 0,
                    SAD: reply.reactionCounts?.SAD || 0,
                    ANGRY: reply.reactionCounts?.ANGRY || 0,
                    total: reply.reactionCounts?.total || 0,
                  };

                  // Decrement the specific reaction count (ensure it doesn't go below 0)
                  if (updatedReactionCounts[typeToRemove] > 0) {
                    updatedReactionCounts[typeToRemove] -= 1;
                  }

                  // Update the total count
                  if (updatedReactionCounts.total > 0) {
                    updatedReactionCounts.total -= 1;
                  }

                  return {
                    ...reply,
                    reactions: reply.reactions.filter(
                      (r) => r.id !== reactionId,
                    ),
                    reactionCounts: updatedReactionCounts,
                  };
                }
                return reply;
              }),
            };
          }
          return post;
        }),
      }));

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
    if (thread.type === "COURSE_REVIEW" && !parentId && rating !== undefined) {
      // Check if user already has a review for this course
      const existingReview = get().posts.find(
        (post) =>
          post.authorId === currentUserId &&
          !post.parentId &&
          post.rating !== undefined,
      );

      if (existingReview) {
        set({ error: "You have already reviewed this course" });
        return;
      }
    }

    try {
      const newPost = await createPost(
        thread.id,
        currentUserId,
        content,
        parentId || undefined,
        rating,
      );

      // Enhance the new post with required fields for UI
      const enhancedPost = {
        ...newPost,
        reactions: [],
        reactionCounts: {
          LIKE: 0,
          LOVE: 0,
          CARE: 0,
          HAHA: 0,
          WOW: 0,
          SAD: 0,
          ANGRY: 0,
          total: 0,
        },
        _count: { replies: 0 },
        isEdited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Post;

      set((state) => {
        // Helper function to update replies in the tree
        const updateRepliesInTree = (
          posts: Post[],
          targetId: string,
          newReply: Post,
        ): Post[] => {
          return posts.map((post) => {
            // If this is the parent post, add the reply directly
            if (post.id === targetId) {
              return {
                ...post,
                _count: {
                  ...post._count,
                  replies: (post._count?.replies || 0) + 1,
                },
                replies: [...(post.replies || []), newReply],
              };
            }

            // If this post has replies, recursively search in them
            if (post.replies && post.replies.length > 0) {
              const updatedReplies = updateRepliesInTree(
                post.replies,
                targetId,
                newReply,
              );

              // Only update if something changed in the replies
              if (
                JSON.stringify(updatedReplies) !== JSON.stringify(post.replies)
              ) {
                return {
                  ...post,
                  replies: updatedReplies,
                };
              }
            }

            return post;
          });
        };

        // For top-level posts, add to the beginning of the list
        // For replies, update the tree structure
        const updatedPosts = parentId
          ? updateRepliesInTree(state.posts, parentId, enhancedPost)
          : [enhancedPost, ...state.posts];

        // Update repliesMap to ensure UI consistency
        const updatedRepliesMap = { ...state.repliesMap };
        if (parentId) {
          updatedRepliesMap[parentId] = [
            ...(state.repliesMap[parentId] || []),
            enhancedPost,
          ];
        }

        return {
          posts: updatedPosts,
          repliesMap: updatedRepliesMap,
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
        };
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add reply";
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
        posts: state.posts.map((post) => {
          if (post.id === postId) {
            return { ...post, ...updatedPost };
          }
          if (post.replies) {
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
      set({ error: "Please log in to delete posts" });
      return;
    }

    try {
      // Optimistically update UI first
      set((state) => {
        // Helper function to remove post and update counts
        const removePostFromArray = (posts: Post[]): Post[] => {
          return posts.filter((post) => {
            if (post.id === postId) {
              return false; // Remove this post
            }
            if (post.replies) {
              // Update replies array and _count
              const filteredReplies = removePostFromArray(post.replies);
              if (filteredReplies.length !== post.replies.length) {
                post.replies = filteredReplies;
                post._count = {
                  ...post._count,
                  replies: Math.max(0, (post._count?.replies || 0) - 1),
                };
              }
            }
            return true;
          });
        };

        const updatedPosts = removePostFromArray(state.posts);

        // Update thread post count if needed
        const threadUpdate = state.thread && {
          ...state.thread,
          _count: {
            ...state.thread._count,
            posts: Math.max(0, state.thread._count.posts - 1),
          },
        };

        // Clean up repliesMap if needed
        const updatedRepliesMap = { ...state.repliesMap };
        delete updatedRepliesMap[postId];

        return {
          posts: updatedPosts,
          thread: threadUpdate || null,
          repliesMap: updatedRepliesMap,
          error: null,
        };
      });

      // Then send request to server
      await deletePost(postId, currentUserId);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete post";
      set({ error: errorMessage });

      // If deletion fails, refresh the posts to restore state
      const { currentThreadId } = get();
      if (currentThreadId) {
        await get().fetchPosts();
      }
    }
  },

  onNewReply: (postId: string) => {
    // Fetch replies for the parent post if they haven't been loaded yet
    const state = get();
    if (!state.repliesMap[postId]) {
      get().fetchReplies(postId);
    }
  },

  initializeSocket: () => {
    const { currentThreadId, currentUserId, currentUserName } = get();
    if (!currentThreadId || !currentUserId || !currentUserName) return;

    // Clean up existing socket connection before initializing a new one
    get().cleanupSocket();
    set({ isReconnecting: false });

    const socket = socketService.connect();

    socket.on("connect", () => {
      set({
        isConnected: true,
        connectionError: null,
        isReconnecting: false,
      });
      socketService.joinThread(currentThreadId, currentUserId, currentUserName);
    });

    socket.on("connect_error", (error) => {
      const errorMessage =
        error.message || "Failed to connect to discussion server";
      set({
        isConnected: false,
        isReconnecting: !error.message.includes("Invalid namespace"),
        connectionError: errorMessage,
      });
    });

    socket.on("disconnect", (reason) => {
      const isManualDisconnect =
        reason === "io server disconnect" || reason === "io client disconnect";
      set({
        isConnected: false,
        isReconnecting: !isManualDisconnect,
        connectionError: `Disconnected: ${reason}`,
      });
    });

    socketService.joinThread(currentThreadId, currentUserId, currentUserName);

    // Post event listeners
    socketService.onNewPost((post) => {
      set((state) => {
        if (post.authorId === state.currentUserId) return state;
        if (post.parentId) get().onNewReply(post.parentId);

        const findPost = (posts: Post[], targetId: string): Post | null => {
          for (const p of posts) {
            if (p.id === targetId) return p;
            if (p.replies) {
              const found = findPost(p.replies, targetId);
              if (found) return found;
            }
          }
          return null;
        };

        const existingPost = findPost(state.posts, post.id);
        if (existingPost) return state;

        if (post.parentId) {
          const parentPost = findPost(state.posts, post.parentId);
          if (!parentPost) return state;

          const updatedPosts = state.posts.map((p) => {
            if (p.id === post.parentId) {
              const replies = p.replies || [];
              if (replies.some((r) => r.id === post.id)) return p;
              return {
                ...p,
                _count: {
                  ...p._count,
                  replies: (p._count?.replies || 0) + 1,
                },
                replies: [...replies, { ...post, replies: [] }],
              };
            }
            return p;
          });

          const updatedRepliesMap = { ...state.repliesMap };
          if (
            !updatedRepliesMap[post.parentId]?.some((r) => r.id === post.id)
          ) {
            updatedRepliesMap[post.parentId] = [
              ...(updatedRepliesMap[post.parentId] || []),
              { ...post, replies: [] },
            ];
          }

          return {
            ...state,
            posts: updatedPosts,
            repliesMap: updatedRepliesMap,
          };
        }

        return {
          ...state,
          posts: [{ ...post, replies: [] }, ...state.posts],
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
    });

    socketService.onUpdatePost((post) => {
      set((state) => {
        const updatedPosts = state.posts.map((p) => {
          if (p.id === post.id) {
            return { ...p, ...post, replies: p.replies || [] };
          }
          if (p.replies) {
            return {
              ...p,
              replies: p.replies.map((reply) =>
                reply.id === post.id
                  ? { ...reply, ...post, replies: reply.replies || [] }
                  : reply,
              ),
            };
          }
          return p;
        });

        const updatedRepliesMap = { ...state.repliesMap };
        if (post.parentId && updatedRepliesMap[post.parentId]) {
          updatedRepliesMap[post.parentId] = updatedRepliesMap[
            post.parentId
          ].map((reply) =>
            reply.id === post.id
              ? { ...reply, ...post, replies: reply.replies || [] }
              : reply,
          );
        }

        return {
          ...state,
          posts: updatedPosts,
          repliesMap: updatedRepliesMap,
        };
      });
    });

    socketService.onDeletePost(({ postId }) => {
      set((state) => {
        const removePostFromArray = (posts: Post[]): Post[] => {
          return posts.filter((post) => {
            if (post.id === postId) return false;
            if (post.replies) {
              const filteredReplies = removePostFromArray(post.replies);
              if (filteredReplies.length !== post.replies.length) {
                post.replies = filteredReplies;
                post._count = {
                  ...post._count,
                  replies: Math.max(0, (post._count?.replies || 0) - 1),
                };
              }
            }
            return true;
          });
        };

        const updatedPosts = removePostFromArray(state.posts);
        const updatedRepliesMap = { ...state.repliesMap };
        delete updatedRepliesMap[postId];

        return {
          ...state,
          posts: updatedPosts,
          repliesMap: updatedRepliesMap,
          thread: state.thread
            ? {
                ...state.thread,
                _count: {
                  ...state.thread._count,
                  posts: Math.max(0, state.thread._count.posts - 1),
                },
              }
            : null,
        };
      });
    });

    // Thread users handlers
    socketService.onThreadUsers((data) => {
      if (data.threadId === currentThreadId) {
        set({ threadUsers: data.users });
      }
    });

    socketService.onUserJoined((user) => {
      set((state) => ({
        threadUsers: [
          ...state.threadUsers.filter((u) => u.userId !== user.userId),
          user,
        ],
      }));
    });
  },

  cleanupSocket: () => {
    const { currentThreadId, currentUserId } = get();
    if (currentThreadId && currentUserId) {
      socketService.leaveThread(currentThreadId, currentUserId);
    }
    // Remove all socket event listeners first
    socketService.removeAllListeners();
    // Then disconnect the socket
    socketService.disconnect();
    // Reset all socket-related state
    set({
      isConnected: false,
      connectionError: null,
      isReconnecting: false,
      threadUsers: [],
      posts: [],
      repliesMap: {},
      currentPage: 1,
    });
  },
}));
