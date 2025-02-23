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
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  posts: Post[];
  overallRating?: number;
}

export interface Post {
  id: string;
  threadId: string;
  thread: Thread;
  parentId?: string;
  parent?: Post;
  replies: Post[];
  authorId: string;
  content: string;
  rating?: number;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  reactions: Reaction[];
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
