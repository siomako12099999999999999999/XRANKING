import { PrismaClient } from '@prisma/client';
import { Client } from 'twitter-api-sdk';
import * as winston from 'winston';

// 型定義
interface TweetMetrics {
  like_count: number;
  retweet_count: number;
  reply_count: number;
  quote_count?: number;
}

// カスタムエラー型定義
interface TwitterApiError {
  status: number;
  data?: any;
  message: string;
  detail?: string; // ← 新規追加
}

interface Tweet {
  id: string;
  public_metrics?: TweetMetrics;
  created_at?: string;
}

// ロガーの設定
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/collector-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/collector.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const prisma = new PrismaClient();

// Twitter APIクライアントの初期化を修正
const initializeTwitterClient = () => {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) {
    throw new Error('TWITTER_BEARER_TOKEN is not set');
  }
  return new Client(bearerToken);
};

const twitterClient = initializeTwitterClient();

// 認証キャッシュの導入
let lastAuthTime = 0;
const AUTH_CACHE_TTL = 10 * 60 * 1000; // 10分

// エラーの型ガード
function isTwitterError(error: unknown): error is TwitterApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as any).status === 'number'
  );
}

// 認証チェックを追加
async function validateTwitterAuth() {
  const now = Date.now();
  if (now - lastAuthTime < AUTH_CACHE_TTL) {
    logger.info('Using cached Twitter API authentication result');
    return true;
  }
  try {
    const testQuery = await twitterClient.tweets.tweetsRecentSearch({
      query: "lang:ja",
      max_results: 1
    });
    if (testQuery.data) {
      logger.info('Twitter API authentication successful', {
        rateLimits: {
          remaining: testQuery.meta?.result_count,
          reset: new Date().toISOString()
        }
      });
      lastAuthTime = now;
      return true;
    }
    return false;
  } catch (error: any) {
    if (isTwitterError(error)) {
      if (error.status === 429) {
        logger.error('Rate limit exceeded during authentication. Retrying after 60 seconds...', {
          status: error.status,
          detail: error.detail
        });
        await new Promise(resolve => setTimeout(resolve, 60000)); // 60秒待機
        try {
          const retryQuery = await twitterClient.tweets.tweetsRecentSearch({
            query: "lang:ja",
            max_results: 1
          });
          if (retryQuery.data) {
            logger.info('Retry successful: Twitter API authentication successful', {
              rateLimits: {
                remaining: retryQuery.meta?.result_count,
                reset: new Date().toISOString()
              }
            });
            lastAuthTime = Date.now();
            return true;
          }
        } catch (retryError: any) {
          logger.error('Retry failed during authentication', {
            status: isTwitterError(retryError) ? retryError.status : 'unknown',
            message: retryError?.message || String(retryError)
          });
          return false;
        }
      } else if (error.status === 401) {
        logger.error('Twitter API authentication failed', {
          status: error.status,
          message: error.message
        });
      } else {
        logger.error('Twitter API Authentication Error', {
          status: error.status,
          message: error.message
        });
      }
    } else {
      logger.error('Unexpected error during authentication', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
    return false;
  }
}

async function collectTweets() {
  try {
    logger.info('Starting tweet collection', {
      bearerToken: process.env.TWITTER_BEARER_TOKEN ? 'Present' : 'Missing',
      timestamp: new Date().toISOString()
    });

    // 認証チェックを実行
    const isAuthenticated = await validateTwitterAuth();
    if (!isAuthenticated) {
      throw new Error('Failed to authenticate with Twitter API');
    }

    // クエリパラメータの修正
    const response = await twitterClient.tweets.tweetsRecentSearch({
      query: "has:videos -is:retweet -is:reply lang:ja",
      max_results: 10, // 開発中は少なめに
      expansions: ["attachments.media_keys"],
      "media.fields": ["type", "url"],
      "tweet.fields": ["public_metrics", "created_at"]
    });

    if (!response.data || response.data.length === 0) {
      logger.warn('No tweets found matching criteria');
      return;
    }

    const tweetsToCreate = response.data
      .filter(tweet => tweet.public_metrics)
      .map(tweet => {
        const metrics = tweet.public_metrics!;
        
        return {
          id: tweet.id,
          videoUrl: `https://twitter.com/i/status/${tweet.id}`,
          likes: metrics.like_count || 0,
          retweets: metrics.retweet_count || 0,
          views: metrics.quote_count || 0, // quote_countを使用
          timestamp: tweet.created_at ? new Date(tweet.created_at) : new Date()
        };
      });

    if (tweetsToCreate.length === 0) {
      logger.warn('No valid tweets to process');
      return;
    }

    await prisma.$transaction(async (tx) => {
      for (const tweet of tweetsToCreate) {
        await tx.tweet.upsert({
          where: { id: tweet.id },
          update: tweet,
          create: tweet
        });
      }
    });
      
    logger.info(`Successfully processed ${tweetsToCreate.length} tweets`, {
      sampleIds: tweetsToCreate.slice(0, 3).map(t => t.id)
    });

  } catch (error) {
    if (error instanceof Error) {
      logger.error('Collection Error', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    } else {
      logger.error('Unknown Error', {
        error: String(error),
        timestamp: new Date().toISOString()
      });
    }
  }
}

// エラーハンドリングを改善した実行部分
collectTweets()
  .then(() => {
    logger.info('Collection complete');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Fatal error occurred', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  });
