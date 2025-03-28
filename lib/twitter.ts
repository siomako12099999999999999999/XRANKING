import axios from 'axios';

// 環境変数から Twitter API の認証情報を取得
const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;
const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN;
const TWITTER_ACCESS_SECRET = process.env.TWITTER_ACCESS_SECRET;
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

// APIの基本URL
const API_BASE_URL = 'https://api.twitter.com/2';

/**
 * Twitter API v2 のクライアントを提供するクラス
 */
class TwitterClient {
  private bearerToken: string;

  constructor(bearerToken: string) {
    this.bearerToken = bearerToken;
  }

  /**
   * ベアラートークンを使用したヘッダーを取得
   */
  private getBearerHeader() {
    return {
      Authorization: `Bearer ${this.bearerToken}`,
    };
  }

  /**
   * ツイートIDに基づいてツイートを取得
   */
  async getTweet(id: string) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/tweets/${id}`,
        {
          headers: this.getBearerHeader(),
          params: {
            expansions: 'author_id,attachments.media_keys',
            'tweet.fields': 'created_at,public_metrics,entities',
            'user.fields': 'name,username,profile_image_url',
            'media.fields': 'url,preview_image_url,alt_text,duration_ms',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching tweet:', error);
      throw error;
    }
  }

  /**
   * クエリに基づいてツイートを検索
   */
  async searchTweets(query: string, maxResults: number = 10, nextToken?: string) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/tweets/search/recent`,
        {
          headers: this.getBearerHeader(),
          params: {
            query,
            max_results: maxResults,
            next_token: nextToken,
            expansions: 'author_id,attachments.media_keys',
            'tweet.fields': 'created_at,public_metrics,entities',
            'user.fields': 'name,username,profile_image_url',
            'media.fields': 'url,preview_image_url,duration_ms',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error searching tweets:', error);
      throw error;
    }
  }
}

/**
 * TwitterClientのインスタンスを取得
 */
export function getTwitterClient() {
  if (!TWITTER_BEARER_TOKEN) {
    throw new Error('Twitter API credentials are not properly configured');
  }

  return new TwitterClient(TWITTER_BEARER_TOKEN);
}

/**
 * ツイートの本文から動画URLを抽出する
 */
export function extractVideoUrl(tweetData: any): string | null {
  try {
    // メディア添付がある場合
    if (tweetData.includes && tweetData.includes.media) {
      const videoMedia = tweetData.includes.media.find(
        (media: any) => media.type === 'video' || media.type === 'animated_gif'
      );
      
      if (videoMedia && videoMedia.variants) {
        // MP4形式の動画URLを探し、最高画質のものを返す
        const mp4Variants = videoMedia.variants
          .filter((variant: any) => variant.content_type === 'video/mp4')
          .sort((a: any, b: any) => (b.bit_rate || 0) - (a.bit_rate || 0));
        
        if (mp4Variants.length > 0) {
          return mp4Variants[0].url;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting video URL:', error);
    return null;
  }
}

/**
 * ツイートの本文から動画URLを抽出する
 * 注: APIから取得できない場合はデータベースから検索する
 */
export async function getVideoUrl(tweetId: string): Promise<string | null> {
  try {
    // まずAPIから取得を試みる
    const client = getTwitterClient();
    const tweetData = await client.getTweet(tweetId);
    const apiVideoUrl = extractVideoUrl(tweetData);
    
    if (apiVideoUrl) {
      return apiVideoUrl;
    }
    
    // APIから取得できなかった場合、DBから検索
    const { getDbConnection } = require('../db');
    const pool = await getDbConnection();
    const result = await pool.request()
      .input('tweetId', tweetId)
      .query(`
        SELECT [videoUrl]
        FROM [xranking].[dbo].[Tweet]
        WHERE [tweetId] = @tweetId
      `);
    
    if (result.recordset[0] && result.recordset[0].videoUrl) {
      return result.recordset[0].videoUrl;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting video URL:', error);
    return null;
  }
}

/**
 * ツイートの公開メトリクスを取得
 */
export function getTweetMetrics(tweetData: any) {
  if (!tweetData.public_metrics) {
    return {
      likes: 0,
      retweets: 0,
      views: 0,
      replies: 0
    };
  }

  return {
    likes: tweetData.public_metrics.like_count || 0,
    retweets: tweetData.public_metrics.retweet_count || 0,
    views: tweetData.public_metrics.impression_count || 0,
    replies: tweetData.public_metrics.reply_count || 0
  };
}

export default {
  getTwitterClient,
  extractVideoUrl,
  getTweetMetrics
};