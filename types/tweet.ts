// XRANKINGアプリケーションのツイート関連の型定義

/**
 * 基本的なツイートデータ構造
 */
export interface Tweet {
  id: string;
  tweetId: string;
  content: string | null;
  videoUrl: string | null;
  likes: number | null;
  retweets: number | null;
  views: number | null;
  timestamp: string;
  authorName?: string | null;
  authorUsername?: string | null;
  authorProfileImageUrl?: string | null;
  originalUrl?: string | null;
  mediaType?: string;
  mediaCount?: number;
  updatedAt?: string;
}

/**
 * 処理後のツイート型（プロキシ対応したURLを含む）
 */
export interface ProcessedTweet {
  id: string;
  tweetId: string;
  content: string | null;
  videoUrl: string | null;
  processedVideoUrl: string | null;
  likes: number;
  retweets: number;
  views: number;
  timestamp: string;
  authorName: string;
  authorUsername: string;
  authorProfileImageUrl: string | null;
  originalUrl: string;
  mediaType: string;
  mediaCount: number;
  text: string;
  createdAt: string;
  updatedAt?: string;
  thumbnail_url?: string; // サムネイル画像のURL（任意）
}

/**
 * API レスポンスの型定義
 */
export interface TweetsResponse {
  tweets: Tweet[];
  meta: {
    page: number;
    pageCount: number;
    totalItems: number;
  };
}

export interface TweetListProps {
  tweets: ProcessedTweet[];
  useProxy: boolean;
}