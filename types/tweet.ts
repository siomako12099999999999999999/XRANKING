// XRANKINGアプリケーションのツイート関連の型定義

/**
 * 基本的なツイートデータ構造
 */
export interface Tweet {
  id: string;
  tweetId: string;
  content: string | null;
  videoUrl: string | null;
  originalUrl?: string | null;
  likes: number | null;
  retweets: number | null;
  views: number | null;
  timestamp: string;
  authorId?: string;
  authorName?: string;
  authorUsername?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 処理後のツイート型（プロキシ対応したURLを含む）
 */
export interface ProcessedTweet {
  id: string;
  text: string;
  authorName: string;
  authorUsername: string;
  authorProfileImageUrl: string;
  createdAt: string;
  mediaCount: number;
  videoUrl: string;
  direct_video_url?: string; // すでに存在
  video_url?: string;        // すでに存在
  thumbnail_url?: string;
  likes: number;
  retweets: number;
  views: number;
  mediaType: string;
  processedVideoUrl?: string;
  // directVideoUrlはdirect_video_urlと重複するため不要です
}

/**
 * API レスポンスの型定義
 */
export interface TweetsResponse {
  tweets: Tweet[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pageCount: number;
  };
}