import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tweetId = params.id;
    
    // データベースから動画URL取得
    const tweet = await prisma.tweet.findFirst({
      where: { tweetId: tweetId },
      select: { videoUrl: true }
    });
    
    if (!tweet || !tweet.videoUrl) {
      console.error(`動画URLが見つかりません: tweetId=${tweetId}`);
      return new NextResponse('動画が見つかりません', { status: 404 });
    }

    // リダイレクト方式 - 最も簡単な解決法
    return NextResponse.redirect(tweet.videoUrl, { status: 302 });
    
  } catch (error) {
    console.error('Video proxy error:', error);
    return new NextResponse('内部サーバーエラー', { status: 500 });
  }
}