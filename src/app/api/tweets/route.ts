import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import axios from 'axios';

export async function GET(request: Request) {
  try {
    // URLからクエリパラメータを取得
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '200', 10);
    const sort = url.searchParams.get('sort') || 'likes';
    const direction = url.searchParams.get('direction') || 'desc';
    const period = url.searchParams.get('period') || 'all';
    
    // 期間に基づいてフィルタリング条件を設定
    let dateFilter = {};
    if (period !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '1h':
          startDate.setHours(now.getHours() - 1);
          break;
        case '12h':
          startDate.setHours(now.getHours() - 12);
          break;
        case '24h':
          startDate.setDate(now.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        default:
          break;
      }
      
      dateFilter = {
        timestamp: {
          gte: startDate
        }
      };
    }
    
    // ソート条件を設定
    let orderBy = {};
    if (['likes', 'retweets', 'views'].includes(sort)) {
      orderBy = {
        [sort]: direction.toLowerCase()
      };
    } else {
      orderBy = {
        likes: 'desc' // デフォルトのソート
      };
    }
    
    // データベースからツイートを取得
    const tweets = await prisma.tweet.findMany({
      select: {
        id: true,
        likes: true,
        retweets: true,
        views: true,
        content: true,
        videoUrl: true,
        timestamp: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy,
      take: 300, // フィルタリング前に多めに取得
      where: {
        videoUrl: {
          not: null, // videoUrlがnullでないものだけ取得
        },
        ...dateFilter // 期間フィルタを追加
      }
    });

    console.log('取得されたツイート数:', tweets.length);
    console.log('検索条件:', { limit, sort, direction, period });
    
    // 有効な動画URLを持つツイートのみをフィルタリング
    const validTweets = tweets.filter(tweet => {
      if (!tweet.videoUrl) return false;
      
      // TwitterのビデオURLの形式をチェック
      const validUrlPattern = /twitter\.com\/(?:[^\/]+)\/status\/\d+/i;
      
      // 既知の無効なツイートアカウントを除外
      const blockedAccounts = ['asd20137']; // 無効なアカウントのリスト
      
      // URLにブロックするアカウントが含まれている場合は除外
      for (const account of blockedAccounts) {
        if (tweet.videoUrl.includes(`twitter.com/${account}/`)) {
          console.log(`除外されたツイート (ブロックアカウント): ${tweet.videoUrl}`);
          return false;
        }
      }
      
      return validUrlPattern.test(tweet.videoUrl);
    });

    console.log('有効な動画URLを持つツイート数:', validTweets.length);
    
    if (validTweets.length === 0) {
      return NextResponse.json(
        { message: '表示可能な動画ツイートが見つかりませんでした。' },
        { status: 404 }
      );
    }

    // 指定された件数のみ返す
    const limitedTweets = validTweets.slice(0, limit);

    return NextResponse.json({
      tweets: limitedTweets,
      hasMore: validTweets.length > limit,
      nextPage: null
    });
  } catch (error) {
    console.error('ツイート取得エラー:', error);
    return NextResponse.json(
      { error: 'ツイートの取得に失敗しました' },
      { status: 500 }
    );
  }
}