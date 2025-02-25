import { create } from "zustand";
import type { Post, ReactionType, Reaction, ThreadWithPostCount } from "./type";
import {
  createPost,
  updatePost,
  deletePost,
  addReaction,
  removeReaction,
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
  addReaction: (postId: string, reactionType: ReactionType) => Promise<void>;
  removeReaction: (reactionId: string) => Promise<void>;
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

  addReaction: async (postId, reactionType) => {
    const { currentUserId } = get();
    if (!currentUserId) {
      set({ error: "Please log in to react to posts" });
      return;
    }

    try {
      await addReaction(postId, currentUserId, reactionType);
      set((state) => ({
        posts: state.posts.map((post) => {
          if (post.id === postId) {
            const newReaction: Reaction = {
              id: Date.now().toString(),
              postId,
              userId: currentUserId,
              type: reactionType,
              createdAt: new Date(),
              updatedAt: new Date(),
              post,
            };
            return {
              ...post,
              reactions: [...post.reactions, newReaction],
            };
          }
          if (post.replies) {
            return {
              ...post,
              replies: post.replies.map((reply) =>
                reply.id === postId
                  ? {
                      ...reply,
                      reactions: [
                        ...reply.reactions,
                        {
                          id: Date.now().toString(),
                          postId,
                          userId: currentUserId,
                          type: reactionType,
                          createdAt: new Date(),
                          updatedAt: new Date(),
                          post: reply,
                        },
                      ],
                    }
                  : reply,
              ),
            };
          }
          return post;
        }),
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add reaction";
      set({ error: errorMessage });
    }
  },

  removeReaction: async (reactionId) => {
    const { currentUserId } = get();
    if (!currentUserId) {
      set({ error: "Please log in to remove reactions" });
      return;
    }

    try {
      await removeReaction(reactionId);
      set((state) => ({
        posts: state.posts.map((post) => {
          if (post.reactions) {
            return {
              ...post,
              reactions: post.reactions.filter(
                (r) => r.userId !== currentUserId,
              ),
            };
          }
          if (post.replies) {
            return {
              ...post,
              replies: post.replies.map((reply) =>
                reply.reactions
                  ? {
                      ...reply,
                      reactions: reply.reactions.filter(
                        (r) => r.userId !== currentUserId,
                      ),
                    }
                  : reply,
              ),
            };
          }
          return post;
        }),
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to remove reaction";
      set({ error: errorMessage });
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
      set((state) => ({
        posts: state.posts.filter((post) => {
          if (post.id === postId) return false;
          if (post.replies) {
            post.replies = post.replies.filter((reply) => reply.id !== postId);
          }
          return true;
        }),
        error: null,
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete post";
      set({ error: errorMessage });
    }
  },
}));
