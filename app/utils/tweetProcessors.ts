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