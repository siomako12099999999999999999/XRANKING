/**
 * 機能概要：
 * アプリケーションの型定義ファイル
 * 
 * 主な機能：
 * 1. ツイートデータの型定義
 * 2. 処理済みツイートの型定義
 * 3. 期間とソート順の型定義
 * 4. ローディング状態の型定義
 * 
 * 用途：
 * - 型安全性の確保
 * - コード補完の提供
 * - インターフェースの定義
 * - データ構造の標準化
 */

// または該当するインターフェース定義ファイル

interface Tweet {
  id: string;
  tweetId: string;
  content: string | null;
  videoUrl: string | null;
  likes: number | null;
  retweets: number | null;
  views: number | null; // すでにnullを許容する型になっています
  timestamp: string;
  authorName?: string | null;
  authorUsername?: string | null;
  authorProfileImageUrl?: string | null;
  originalUrl?: string | null;
}

interface ProcessedTweet {
  id: string;
  tweetId: string;
  content: string | null;
  videoUrl: string | null;
  processedVideoUrl: string | null;
  likes: number | null;
  retweets: number | null;
  views: number | null; // nullを許容するように変更
  timestamp: string;
  authorName: string;
  authorUsername: string;
  authorProfileImageUrl: string | null;
  originalUrl?: string | null;
  // 他のプロパティ
}

// エクスポート
export type { Tweet, ProcessedTweet };

export type Period = 'all' | 'day' | 'week' | 'month';
export type SortType = 'likes' | 'latest' | 'trending' | 'retweets' | 'views';
export type LoadingStatus = 'idle' | 'loading' | 'success' | 'error' | 'pending';