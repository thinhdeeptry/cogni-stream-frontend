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
} from "./discussion.action";

interface DiscussionState {
  thread: ThreadWithPostCount | null;
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  currentUserId?: string;
  currentPage: number;
  currentThreadId: string | null;
  setCurrentUserId: (userId: string) => void;
  setCurrentThreadId: (threadId: string) => void;
  fetchThread: () => Promise<void>;
  fetchPosts: (page?: number) => Promise<void>;
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

export const useDiscussionStore = create<DiscussionState>()((set, get) => ({
  thread: null,
  posts: [],
  isLoading: false,
  error: null,
  currentUserId: undefined,
  currentPage: 1,
  currentThreadId: null,

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

      set((state) => ({
        posts: parentId
          ? state.posts.map((post) => {
              if (post.id === parentId) {
                return { ...post, replies: [...(post.replies || []), newPost] };
              }
              return post;
            })
          : [newPost, ...state.posts],
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
      }));
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
