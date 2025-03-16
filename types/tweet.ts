// XRANKINGアプリケーションのツイート関連の型定義

/**
 * 基本的なツイートデータ構造
 */
export interface Tweet {
  id: string;
  tweetId: string;
  content: string | null;
  videoUrl: string | null;
  likes: number;
  retweets: number;
  views: number;
  timestamp: string;
  authorName: string | null;
  authorUsername: string | null;
  authorProfileImageUrl: string | null;
  createdAt: string;
}

/**
 * 処理後のツイート型（プロキシ対応したURLを含む）
 */
export interface ProcessedTweet {
  id: string;
  tweetId: string;
  content: string | null;
  videoUrl: string | null;
  likes: number;
  retweets: number;
  views: number;
  timestamp: string;
  authorName: string | null;
  authorUsername: string | null;
  authorProfileImageUrl: string | null;
  createdAt: string;
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