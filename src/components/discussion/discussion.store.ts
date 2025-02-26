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
} from "./discussion.action";

interface DiscussionState {
  thread: ThreadWithPostCount | null;
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  currentUserId?: string;
  currentPage: number;
  currentThreadId: string | null;
  replyPages: Record<string, number>;
  repliesMap: Record<string, Post[]>;
  setCurrentUserId: (userId: string) => void;
  setCurrentThreadId: (threadId: string) => void;
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
}

const POSTS_PER_PAGE = 5;
const REPLIES_PER_PAGE = 3;

export const useDiscussionStore = create<DiscussionState>()((set, get) => ({
  thread: null,
  posts: [],
  isLoading: false,
  error: null,
  currentUserId: undefined,
  currentPage: 1,
  currentThreadId: null,
  replyPages: {},
  repliesMap: {},

  setCurrentUserId: (userId) => set({ currentUserId: userId }),
  setCurrentThreadId: (threadId) => set({ currentThreadId: threadId }),

  fetchThread: async () => {
    const { currentThreadId } = get();
    if (!currentThreadId) return;

    try {
      set({ isLoading: true, error: null });
      const thread = await getThread(currentThreadId);
      set({
        thread,
        posts: thread.posts || [],
        currentPage: 1,
        isLoading: false,
      });
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
      // Update UI immediately for better UX
      set((state) => ({
        posts: state.posts.map((post) => {
          if (post.id === postId) {
            // Check if user already has a reaction
            const existingReaction = post.reactions.find(
              (r) => r.userId === currentUserId,
            );

            // Create a new reaction object
            const newReaction: Reaction = {
              id:
                existingReactionId ||
                existingReaction?.id ||
                Date.now().toString(), // Keep existing ID if updating
              postId,
              userId: currentUserId,
              type: reactionType,
              createdAt: existingReaction?.createdAt || new Date(),
              updatedAt: new Date(),
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

                  // Create a new reaction for reply
                  const newReaction: Reaction = {
                    id:
                      existingReactionId ||
                      existingReaction?.id ||
                      Date.now().toString(), // Keep existing ID if updating
                    postId,
                    userId: currentUserId,
                    type: reactionType,
                    createdAt: existingReaction?.createdAt || new Date(),
                    updatedAt: new Date(),
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

      // Send request to server in the background
      if (existingReactionId) {
        await updateReaction(existingReactionId, reactionType);
      } else {
        await addReaction(postId, currentUserId, reactionType);
      }
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
      await deletePost(postId, currentUserId);
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
                  replies: (post._count?.replies || 0) - 1,
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
            posts: state.thread._count.posts - 1,
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
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete post";
      set({ error: errorMessage });
    }
  },
}));
