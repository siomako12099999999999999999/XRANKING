import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Twitterの動画URLにアクセスする際のヘッダー設定
const fetchHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': '*/*',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Referer': 'https://twitter.com/'
};

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
      return new NextResponse('動画が見つかりません', { status: 404 });
    }
    
    // Twitterから動画を取得
    const response = await fetch(tweet.videoUrl, {
      headers: fetchHeaders,
      // メソッドをHEADから修正
    });
    
    if (!response.ok) {
      console.error(`Twitter video fetch failed: ${response.status} ${response.statusText}`);
      return new NextResponse('動画の取得に失敗しました', { status: 502 });
    }
    
    // レスポンスヘッダーを準備
    const headers = new Headers();
    
    // コンテンツタイプとサイズを設定
    const contentType = response.headers.get('Content-Type');
    if (contentType) {
      headers.set('Content-Type', contentType);
    } else {
      // デフォルトのMP4コンテンツタイプ
      headers.set('Content-Type', 'video/mp4');
    }
    
    // キャッシュヘッダー
    headers.set('Cache-Control', 'public, max-age=86400'); // 24時間キャッシュ
    
    // レンジリクエストのサポート
    const rangeHeader = request.headers.get('range');
    if (rangeHeader && response.headers.has('Content-Length')) {
      // レンジリクエストの場合は元のレンジヘッダーと同じレンジヘッダーを設定
      headers.set('Accept-Ranges', 'bytes');
      headers.set('Content-Range', response.headers.get('Content-Range') || '');
    }
    
    // ストリームレスポンスを返す
    return new NextResponse(response.body, {
      headers,
      status: response.status,
    });
    
  } catch (error) {
    console.error('Video proxy error:', error);
    return new NextResponse('内部サーバーエラー', { status: 500 });
  }
}