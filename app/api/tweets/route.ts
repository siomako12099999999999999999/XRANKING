import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// BigIntをシリアライズ可能な形に変換するヘルパー関数
function serializeBigInt(data: any): any {
  if (data === null || data === undefined) return data;
  
  if (typeof data === 'bigint') {
    return Number(data); // BigIntを数値に変換（安全な範囲内）
  }
  
  if (Array.isArray(data)) {
    return data.map(item => serializeBigInt(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const result: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = serializeBigInt(data[key]);
      }
    }
    return result;
  }
  
  return data;
}

// select句の型を定義
type TweetSelect = {
  id: boolean;
  tweetId: boolean; // tweetIdを必ず含める
  content: boolean;
  videoUrl: boolean;
  likes: boolean;
  retweets: boolean;
  views: boolean;
  timestamp: boolean;
  authorName: boolean;
  authorUsername: boolean;
  authorProfileImageUrl: boolean;
  createdAt: boolean;
};

const selectFields: TweetSelect = {
  id: true,
  tweetId: true, // tweetIdを必ず含める
  content: true,
  videoUrl: true,
  likes: true,
  retweets: true,
  views: true,
  timestamp: true,
  authorName: true,
  authorUsername: true,
  authorProfileImageUrl: true,
  createdAt: true,
};

// Prismaの型を使用してソート条件の型を定義
type OrderByInput = {
  [K in keyof Prisma.TweetOrderByWithRelationInput]?: Prisma.SortOrder;
};

// ソート条件のマッピングを定義
const sortMapping: Record<string, keyof Prisma.TweetOrderByWithRelationInput> = {
  latest: 'timestamp',
  trending: 'views',
  likes: 'likes'
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';
    const sort = searchParams.get('sort') || 'likes';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // ソート条件の設定
    const orderBy: OrderByInput = {
      [sortMapping[sort as keyof typeof sortMapping] || 'likes']: 'desc'
    };

    // まず合計数を取得
    const totalCount = await prisma.tweet.count({
      where: {
        ...(period !== 'all' && {
          timestamp: {
            gte: new Date(Date.now() - getPeriodInMilliseconds(period))
          }
        })
      }
    });

    // ツイートを取得
    const tweets = await prisma.tweet.findMany({
      take: limit,
      skip: (page - 1) * limit,
      orderBy,
      where: {
        ...(period !== 'all' && {
          timestamp: {
            gte: new Date(Date.now() - getPeriodInMilliseconds(period))
          }
        })
      },
      select: selectFields
    });

    return NextResponse.json(
      { 
        tweets,
        totalCount,
        page,
        limit,
        hasMore: totalCount > (page * limit)
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
  } catch (error: any) {
    console.error('データベースクエリエラー:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

function getPeriodInMilliseconds(period: string): number {
  switch (period) {
    case 'day': return 24 * 60 * 60 * 1000;
    case 'week': return 7 * 24 * 60 * 60 * 1000;
    case 'month': return 30 * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
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