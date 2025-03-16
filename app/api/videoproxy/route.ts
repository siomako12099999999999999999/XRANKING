import { NextRequest, NextResponse } from 'next/server';

// この行を追加
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    if (!url) {
      return new NextResponse('URLパラメータが必要です', { status: 400 });
    }

    console.log(`動画をプロキシ中: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://twitter.com/',
      },
    });

    if (!response.ok) {
      console.error(`動画のフェッチに失敗: ${response.status} ${response.statusText}`);
      return new NextResponse('動画の取得に失敗しました', { status: response.status });
    }

    const headers = new Headers({
      'Content-Type': response.headers.get('Content-Type') || 'video/mp4',
      'Content-Length': response.headers.get('Content-Length') || '',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400',
    });

    // レンジリクエストのサポート
    const rangeHeader = request.headers.get('range');
    if (rangeHeader && response.headers.has('Content-Range')) {
      headers.set('Accept-Ranges', 'bytes');
      headers.set('Content-Range', response.headers.get('Content-Range') || '');
    }
    
    return new NextResponse(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error('プロキシエラー:', error);
    return new NextResponse('内部サーバーエラー', { status: 500 });
  }
}