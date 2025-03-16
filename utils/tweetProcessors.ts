import type { Tweet, ProcessedTweet } from '../types/tweet';

/**
 * ツイートデータを処理して、表示用のデータに変換します
 */
export function processTwitterResponse(tweet: any): ProcessedTweet {
  // videoUrlとvideo_urlのどちらかから値を取得
  const videoUrl = tweet.videoUrl || tweet.video_url || null;
  
  return {
    id: tweet.id,
    tweetId: tweet.tweetId,
    content: tweet.content,
    videoUrl: videoUrl, // 標準化された値を使用
    processedVideoUrl: videoUrl ? `/api/videoproxy?url=${encodeURIComponent(videoUrl)}` : null,
    likes: tweet.likes ?? 0,
    retweets: tweet.retweets ?? 0,
    views: tweet.views ?? 0,
    timestamp: tweet.timestamp,
    authorName: tweet.authorName || '不明なユーザー',
    authorUsername: tweet.authorUsername || 'unknown',
    authorProfileImageUrl: tweet.authorProfileImageUrl || null,
    originalUrl: tweet.originalUrl || `https://twitter.com/i/status/${tweet.tweetId}`,
    mediaType: tweet.mediaType || 'video',
    mediaCount: tweet.mediaCount || 1,
    text: tweet.content || '',
    createdAt: tweet.timestamp,
    updatedAt: tweet.updatedAt,
    thumbnail_url: tweet.thumbnail_url || null // サムネイル画像のURLをそのまま渡す
  };
}

/**
 * 動画URLを適切に変換する（プロキシを使用するかどうかを判断）
 */
export function getProcessedVideoUrl(videoUrl: string | null, useProxy: boolean = true): string | null {
  if (!videoUrl) return null;
  
  // video.twimg.com形式のURLの場合はプロキシを使用
  if (useProxy && videoUrl.includes('video.twimg.com')) {
    return `/api/videoproxy?url=${encodeURIComponent(videoUrl)}`;
  }
  
  // それ以外のURLはそのまま返す
  return videoUrl;
}

/**
 * 数値を省略表記に変換（例: 1200 → 1.2K）
 */
export function formatNumber(num: number | null): string {
  if (num === null || num === undefined) return '0';
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * タイムスタンプを読みやすい形式にフォーマット
 */
export function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (e) {
    return '日時不明';
  }
}