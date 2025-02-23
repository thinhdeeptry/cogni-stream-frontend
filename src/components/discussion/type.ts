export enum DiscussionType {
  COURSE_REVIEW = "COURSE_REVIEW",
  LESSON_DISCUSSION = "LESSON_DISCUSSION",
}

export enum ReactionType {
  LIKE = "LIKE", // 👍
  LOVE = "LOVE", // ❤️
  CARE = "CARE", // 🤗
  HAHA = "HAHA", // 😄
  WOW = "WOW", // 😮
  SAD = "SAD", // 😢
  ANGRY = "ANGRY", // 😠
}

export interface Thread {
  id: string;
  type: DiscussionType;
  resourceId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  overallRating?: number;
  posts: Post[];
}

export interface Post {
  id: string;
  threadId: string;
  thread: Thread;
  parentId?: string;
  parent?: Post;
  replies: PostWithReplyCount[];
  authorId: string;
  content: string;
  rating?: number;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  reactions: Reaction[];
  _count: {
    replies: number;
  };
}

export interface Reaction {
  id: string;
  postId: string;
  post: Post;
  userId: string;
  type: ReactionType;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostWithReplyCount extends Post {
  _count: {
    replies: number;
  };
}

export interface ThreadWithPostCount extends Thread {
  posts: PostWithReplyCount[];
  _count: {
    posts: number;
  };
}
