import { create } from "zustand";
import { Post, ReactionType, Reaction } from "./type";
import {
  getPosts,
  createPost,
  updatePost,
  deletePost,
  addReaction,
  removeReaction,
} from "./discussion.action";

interface DiscussionState {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  currentUserId: string | null;
  threadId: string | null;
  setPosts: (posts: Post[]) => void;
  setCurrentUserId: (userId: string) => void;
  setThreadId: (threadId: string) => void;
  fetchPosts: (threadId: string) => Promise<void>;
  addReaction: (postId: string, reactionType: ReactionType) => Promise<void>;
  removeReaction: (postId: string) => Promise<void>;
  addReply: (parentId: string | null, content: string) => Promise<void>;
  editPost: (postId: string, content: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
}

export const useDiscussionStore = create<DiscussionState>((set, get) => ({
  posts: [],
  isLoading: false,
  error: null,
  currentUserId: null,
  threadId: null,
  setPosts: (posts) => set({ posts }),
  setCurrentUserId: (userId) => set({ currentUserId: userId }),
  setThreadId: (threadId) => set({ threadId }),
  fetchPosts: async (threadId) => {
    set({ isLoading: true, error: null, threadId });
    try {
      const posts = await getPosts(threadId);
      set({ posts, isLoading: false });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch posts";
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
  addReply: async (parentId, content) => {
    const { currentUserId, threadId } = get();
    if (!currentUserId) {
      set({ error: "Please log in to post replies" });
      return;
    }
    if (!threadId) {
      set({ error: "Thread ID not found" });
      return;
    }

    try {
      const newPost = await createPost(
        threadId,
        currentUserId,
        content,
        parentId || undefined,
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
        error: null,
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add reply";
      set({ error: errorMessage });
    }
  },
  editPost: async (postId, content) => {
    const { currentUserId } = get();
    if (!currentUserId) {
      set({ error: "Please log in to edit posts" });
      return;
    }

    try {
      const updatedPost = await updatePost(postId, content, currentUserId);
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
