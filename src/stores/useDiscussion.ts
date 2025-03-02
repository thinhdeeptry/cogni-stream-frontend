import { create } from "zustand";

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
import socketService from "../components/discussion/socket";
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

export const useDiscussionStore = create<DiscussionState>()((set, get) => ({
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

  // UI States
  showReplies: {},
  isLoadingMore: false,
  loadingReplies: {},

  // Setters
  setCurrentUserId: (userId) => set({ currentUserId: userId }),
  setCurrentUserName: (userName) => set({ currentUserName: userName }),
  setCurrentThreadId: (threadId) => set({ currentThreadId: threadId }),

  // Data fetching methods
  checkUserReview: async (courseId) => {
    const { currentUserId, thread } = get();
    if (!currentUserId || !courseId) return;

    // Only check for user reviews if this is a COURSE_REVIEW thread
    if (!thread || thread.type !== "COURSE_REVIEW") {
      set({ hasReviewed: false });
      return;
    }

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

  fetchPosts: async (page = 1) => {
    const { currentThreadId } = get();
    if (!currentThreadId) return;

    try {
      set({ isLoading: true, error: null });
      const posts = await getPosts(currentThreadId, page, POSTS_PER_PAGE);

      if (page > 1) {
        set((state) => ({
          posts: [...state.posts, ...posts],
          currentPage: page,
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

  fetchReplies: async (postId: string, page = 1) => {
    try {
      set((state) => ({
        loadingReplies: { ...state.loadingReplies, [postId]: true },
        error: null,
      }));

      const replies = await findReplies(postId, page, REPLIES_PER_PAGE);

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
            [postId]: page === 1 ? replies : [...existingReplies, ...replies],
          },
          replyPages: {
            ...state.replyPages,
            [postId]: page,
          },
          loadingReplies: { ...state.loadingReplies, [postId]: false },
        };
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load replies";
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

  removeReaction: async (reactionId: string, reactionType: ReactionType) => {
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
          const hasReaction = post.reactions.some((r) => r.id === reactionId);

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
                  reactions: reply.reactions.filter((r) => r.id !== reactionId),
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

        // If this is a course review (top-level post with rating), update hasReviewed
        const hasReviewed =
          thread.type === "COURSE_REVIEW" && !parentId && rating !== undefined
            ? true
            : state.hasReviewed;

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
            updatedRepliesMap[parentId]?.some((reply) => reply.id === postId)
          ) {
            updatedRepliesMap[parentId] = updatedRepliesMap[parentId].filter(
              (reply) => reply.id !== postId,
            );
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
    if (!currentThreadId || !currentUserId || !currentUserName) return;

    // Clean up existing socket connection before initializing a new one
    get().cleanupSocket();
    set({ isReconnecting: false });

    const socket = socketService.connect();

    // Connection event handlers
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

    // Handle real-time post events
    socketService.onNewPost((post) => {
      set((state) => {
        // Ignore own posts
        if (post.authorId === state.currentUserId) return state;

        // Phát âm thanh thông báo khi có bài đăng mới từ người khác
        playNotificationSound();

        // Check if post already exists in state
        const existingPost = findPostInTree(state.posts, post.id);
        if (existingPost) return state;

        // If it's a reply to a post, handle it
        if (post.parentId) {
          // Find the parent post
          const parentPost = findPostInTree(state.posts, post.parentId);

          // For parent posts that belong to current user, automatically show replies
          if (parentPost && parentPost.authorId === state.currentUserId) {
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

          if (!parentPost) return state;

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
                replies: [...replies, { ...post, replies: [] }],
              };
            }
            return p;
          });

          // Update replies map
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

        // It's a top-level post
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
        // Don't update if this is our own post update (should already be reflected in UI)
        if (post.authorId === state.currentUserId) return state;

        // Ensure we have the complete post object with necessary fields for UI
        const enhancedPost = {
          ...post,
          reactions: post.reactions || [],
          reactionCounts: post.reactionCounts || createDefaultReactionCounts(),
          _count: post._count || { replies: 0 },
          replies: post.replies || [],
        };

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
          updatedRepliesMap[post.parentId] = updatedRepliesMap[
            post.parentId
          ].map((reply) =>
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
        // If we're deleting our own post, we've already handled it optimistically
        // Find the post to get more details before removing
        const postToDelete = findPostInTree(state.posts, postId);
        if (!postToDelete) return state;

        // Find parent post if this is a reply
        const parentId = postToDelete.parentId;

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
              replies: post.replies.filter((reply) => reply.id !== postId),
            };
          }

          return post;
        });

        // Clean up repliesMap
        const updatedRepliesMap = { ...state.repliesMap };

        // Remove the post's own replies map if it had replies
        delete updatedRepliesMap[postId];

        // If it was a reply, remove it from its parent's repliesMap
        if (parentId && updatedRepliesMap[parentId]) {
          updatedRepliesMap[parentId] = updatedRepliesMap[parentId].filter(
            (reply) => reply.id !== postId,
          );
        }

        // Clean up showReplies state too
        const updatedShowReplies = { ...state.showReplies };
        delete updatedShowReplies[postId];

        return {
          ...state,
          posts: updatedPosts,
          repliesMap: updatedRepliesMap,
          showReplies: updatedShowReplies,
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
      // Ignore if it's the current user joining
      if (user.userId === currentUserId) return;

      // Remove the sound notification for user joining
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
      // Reset UI states
      showReplies: {},
      isLoadingMore: false,
      loadingReplies: {},
    });
  },
}));
