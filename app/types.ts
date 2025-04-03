export type Period = 'day' | 'week' | 'month' | 'all';
export type SortType = 'likes' | 'trending' | 'latest' | 'combined';
export type LoadingStatus = 'idle' | 'loading' | 'pending' | 'success' | 'error';

export type Tweet = {
  id: string;
  tweetId: string;
  content: string | undefined;
  videoUrl: string;
  likes: number;
  retweets: number;
  views: number;
  timestamp: string;
  authorName: string | undefined;
  authorUsername: string | undefined;
  authorProfileImageUrl: string | undefined;
  createdAt: string;
  updatedAt: string;
  
  // 追加のプロパティ
  thumbnailUrl?: string | undefined;
  originalUrl?: string | undefined;
  authorId?: string | undefined;
  isDemo?: boolean;
};

export type ProcessedTweet = Tweet & {
  isDemo?: boolean;
};