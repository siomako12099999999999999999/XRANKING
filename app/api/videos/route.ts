import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  console.log('Fetching video data from DB');
  // Log the DATABASE_URL being used by the Node.js process
  console.log(`[API /api/videos] DATABASE_URL: ${process.env.DATABASE_URL}`);
  try {
    const videos = await prisma.tweet.findMany({
      where: {
        videoUrl: {
          not: null, // 動画URLが存在するもののみ
        },
      },
      select: {
        id: true,
        content: true,
        videoUrl: true,
        views: true,
        authorName: true,
        authorUsername: true,
        timestamp: true,
      },
      orderBy: {
        views: 'desc', // 閲覧数が多い順にソート
      },
      take: 50, // 念のため取得件数を制限
    });
    console.log(`Fetched ${videos.length} videos`); // 取得件数ログ
    return NextResponse.json({ success: true, videos });
  } catch (error) {
    console.error('Failed to fetch videos:', error); // エラーログ
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message: '動画データの取得に失敗しました。', error: errorMessage }, { status: 500 });
  }
}
