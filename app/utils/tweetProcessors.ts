/**
 * 機能概要：
 * ツイートデータの処理ユーティリティ
 * 
 * 主な機能：
 * 1. Twitterレスポンスの処理
 * 2. データの正規化
 * 3. デフォルト値の設定
 * 4. URLの生成
 * 
 * 用途：
 * - データの標準化
 * - フロントエンド表示の最適化
 * - エラー値の処理
 * - リンクの生成
 */

import type { Tweet, ProcessedTweet } from '../types';

export function processTwitterResponse(tweet: Tweet): ProcessedTweet {
  return {
    id: tweet.id,
    tweetId: tweet.tweetId,
    content: tweet.content,
    videoUrl: tweet.videoUrl,
    processedVideoUrl: tweet.videoUrl ? `/api/videoproxy?url=${encodeURIComponent(tweet.videoUrl)}` : null,
    likes: tweet.likes ?? 0,
    retweets: tweet.retweets ?? 0,
    views: tweet.views ?? 0,
    timestamp: tweet.timestamp,
    authorName: tweet.authorName || '不明なユーザー',
    authorUsername: tweet.authorUsername || 'unknown',
    authorProfileImageUrl: tweet.authorProfileImageUrl || null,
    originalUrl: tweet.originalUrl || `https://twitter.com/i/status/${tweet.tweetId}`
  };
}