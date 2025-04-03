/**
 * 機能概要：
 * ツイートデータの型定義ファイル
 * 
 * 主な機能：
 * 1. ツイートの基本情報の型定義
 * 2. メタデータの型定義
 * 3. 作者情報の型定義
 * 4. タイムスタンプの型定義
 * 
 * 用途：
 * - ツイートデータの型安全性
 * - データベースとの連携
 * - APIレスポンスの型定義
 * - フロントエンドでの型チェック
 */

export interface Tweet {
  id: string;
  tweetId: string | null;
  content: string | null;
  videoUrl: string | null;
  likes: number;
  retweets: number;
  views: number;
  timestamp: Date;
  authorName: string | null;
  authorUsername: string | null;
  authorProfileImageUrl: string | null;
  createdAt: Date;
}