import { Client } from 'twitter-api-sdk';
import { PrismaClient } from '@prisma/client';
import * as winston from 'winston';

// ロガー設定
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/fetchTweets-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/fetchTweets.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

const twitter = new Client(process.env.TWITTER_BEARER_TOKEN!);
const prisma = new PrismaClient();

async function fetchTrendingVideos(retryCount = 0) {
  try {
    logger.info('Fetching trending videos...');
    const tweets = await twitter.tweets.tweetsRecentSearch({
      query: "has:videos -is:retweet lang:ja", // 修正: filter:videosをhas:videosに変更
      max_results: 100,
      "media.fields": ["url", "type"],
      "tweet.fields": ["public_metrics", "created_at"]
    });

    for (const tweet of tweets.data || []) {
      if (!tweet.public_metrics) continue;
      
      await prisma.tweet.upsert({
        where: { id: tweet.id },
        update: {
          likes: tweet.public_metrics.like_count,
          retweets: tweet.public_metrics.retweet_count,
          views: tweet.public_metrics.quote_count || 0 // 修正: impression_countをquote_countに変更
        },
        create: {
          id: tweet.id,
          videoUrl: tweet.attachments?.media_keys ? tweet.attachments.media_keys[0] : '', // 修正: undefinedチェックを追加
          likes: tweet.public_metrics.like_count,
          retweets: tweet.public_metrics.retweet_count,
          views: tweet.public_metrics.quote_count || 0, // 修正: impression_countをquote_countに変更
          timestamp: new Date(tweet.created_at!)
        }
      });
    }
    logger.info('Successfully fetched and saved trending videos');
  } catch (error: any) {
    if (error.status === 429 && retryCount < 3) {
      const resetTime = parseInt(error.headers['x-rate-limit-reset']) * 1000;
      const waitTime = resetTime - Date.now();
      logger.warn(`Rate limit exceeded. Retrying after ${waitTime / 1000} seconds...`);
      setTimeout(() => fetchTrendingVideos(retryCount + 1), waitTime);
    } else {
      logger.error('Error fetching tweets:', error);
    }
  }
}

// 1時間ごとに実行
setInterval(fetchTrendingVideos, 3600000);
fetchTrendingVideos();
