export type Period = 'day' | 'week' | 'month' | 'all';
export type SortType = 'likes' | 'trending' | 'latest';
export type LoadingStatus = 'idle' | 'loading' | 'pending' | 'success' | 'error';

export type Tweet = {
  id: string;
  tweetId: string;
  content: string | null;
  videoUrl: string;
  likes: number;
  retweets: number;
  views: number;
  timestamp: string;
  authorName: string | null;
  authorUsername: string | null;
  authorProfileImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  
  // 追加のプロパティ
  thumbnailUrl?: string | null;
  originalUrl?: string | null;
  authorId?: string | null;
  isDemo?: boolean;
};

export type ProcessedTweet = Tweet & {
  isDemo?: boolean;
};