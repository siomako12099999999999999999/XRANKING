import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Tweet } from '@prisma/client';

// モックデータ
const mockTweets = Array.from({ length: 20 }, (_, i) => ({
  id: `${i + 1}`,
  tweetId: `1350${i + 1}`,
  content: `サンプルツイート #${i + 1} - これは動画ツイートのサンプルコンテンツです。`,
  videoUrl: `https://example.com/video${i + 1}.mp4`,
  likes: Math.floor(Math.random() * 10000),
  retweets: Math.floor(Math.random() * 5000),
  views: Math.floor(Math.random() * 50000),
  timestamp: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
  authorId: `user${i % 5 + 1}`,
  authorName: `サンプルユーザー${i % 5 + 1}`,
  authorUsername: `sample_user${i % 5 + 1}`,
  authorProfileImageUrl: `https://randomuser.me/api/portraits/men/${i % 10}.jpg`,
}));

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'week';
    const sort = searchParams.get('sort') || 'likes';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // ここでPrismaを使わずにモックデータをフィルタリング
    let filteredTweets = [...mockTweets];

    // 期間フィルタリング
    if (period !== 'all') {
      const now = new Date();
      let dateFrom = new Date();
      
      switch (period) {
        case 'day':
          dateFrom.setDate(now.getDate() - 1);
          break;
        case 'week':
          dateFrom.setDate(now.getDate() - 7);
          break;
        case 'month':
          dateFrom.setMonth(now.getMonth() - 1);
          break;
      }
      
      filteredTweets = filteredTweets.filter(tweet => 
        new Date(tweet.timestamp) >= dateFrom
      );
    }

    // ソート
    switch (sort) {
      case 'likes':
        filteredTweets.sort((a, b) => b.likes - a.likes);
        break;
      case 'retweets':
        filteredTweets.sort((a, b) => b.retweets - a.retweets);
        break;
      case 'views':
        filteredTweets.sort((a, b) => b.views - a.views);
        break;
      case 'latest':
        filteredTweets.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        break;
    }

    // ページネーション
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedTweets = filteredTweets.slice(start, end);
    const total = filteredTweets.length;

    return NextResponse.json({
      tweets: paginatedTweets,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'ツイートの取得中にエラーが発生しました', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const data = await request.json();
  console.log("Received data:", data); // データをログに出力して確認

  // データバリデーションを追加
  if (!data.tweetId) {
    return NextResponse.json(
      { error: 'tweetIdは必須です' },
      { status: 400 }
    );
  }

  try {
    const newTweet = await prisma.tweet.create({
      data: {
        tweetId: data.tweetId,
        likes: data.likes || 0,
        retweets: data.retweets || 0,
        views: data.views || 0,
        content: data.content || null,
        videoUrl: data.videoUrl || null,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      },
    });
    return NextResponse.json(newTweet);
  } catch (error) {
    console.error("Failed to create tweet:", error);
    return NextResponse.json(
      { error: 'ツイートの作成に失敗しました' },
      { status: 500 }
    );
  }
}