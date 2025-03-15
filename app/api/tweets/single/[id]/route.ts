import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tweetId = params.id;
    
    // データベースからツイートを探す
    const tweet = await prisma.tweet.findFirst({
      where: {
        tweetId: tweetId
      }
    });

    if (!tweet) {
      // DBに存在しない場合、実際にスクレイピングするか、Twitter APIから取得する処理が必要
      return NextResponse.json(
        { error: 'ツイートが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({ tweet });
  } catch (error) {
    console.error('Error fetching tweet:', error);
    return NextResponse.json(
      { error: 'ツイートの取得中にエラーが発生しました' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}