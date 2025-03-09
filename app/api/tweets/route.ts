import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

export async function GET(request: NextRequest) {
  try {
    console.log("API: /api/tweets が呼び出されました");
    
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'week';
    const sort = searchParams.get('sort') || 'likes';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    console.log(`クエリパラメータ: period=${period}, sort=${sort}, page=${page}, limit=${limit}`);

    // 期間に基づいてフィルタリング条件を設定
    let dateFilter = {};
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
        default:
          break;
      }
      
      dateFilter = {
        timestamp: {
          gte: dateFrom
        }
      };
    }

    // ソート条件を設定
    let orderBy: any = {};
    switch (sort) {
      case 'likes':
        orderBy = { likes: 'desc' };
        break;
      case 'retweets':
        orderBy = { retweets: 'desc' };
        break;
      case 'views':
        orderBy = { views: 'desc' };
        break;
      case 'latest':
        orderBy = { timestamp: 'desc' };
        break;
      default:
        orderBy = { likes: 'desc' };
    }

    console.log("データベースクエリを実行中...");

    try {
      // データベースからツイートを取得
      const tweets = await prisma.tweet.findMany({
        where: dateFilter,
        orderBy,
        skip,
        take: limit,
        // 必要なフィールドだけを選択
        select: {
          id: true,
          tweetId: true,
          content: true,
          videoUrl: true,
          likes: true,
          retweets: true,
          views: true,
          timestamp: true,
          authorId: true,
          authorName: true,
          authorUsername: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // 合計件数を取得
      const total = await prisma.tweet.count({
        where: dateFilter,
      });

      console.log(`取得結果: ${tweets.length}件のツイート, 合計${total}件`);

      return NextResponse.json({
        tweets,
        meta: {
          total,
          page,
          limit,
          pageCount: Math.ceil(total / limit)
        }
      });
    } catch (dbError: any) {
      console.error('データベースクエリエラー:', dbError);
      return NextResponse.json(
        { error: 'データベースクエリの実行中にエラーが発生しました', details: dbError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Tweet fetch error:', error);
    return NextResponse.json(
      { error: 'ツイートの取得中にエラーが発生しました', details: error.message },
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