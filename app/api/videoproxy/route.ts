import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // URLパラメータから元のビデオURLを取得
    const url = request.nextUrl.searchParams.get('url');
    
    if (!url) {
      return new NextResponse('URLパラメータが必要です', { status: 400 });
    }

    // Twitter動画のURLかどうかを確認
    if (!url.includes('video.twimg.com')) {
      return new NextResponse('有効なTwitter動画URLではありません', { status: 400 });
    }

    console.log(`動画をプロキシ中: ${url}`);

    // 動画をフェッチ
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://twitter.com/'
      }
    });

    if (!response.ok) {
      console.error(`動画のフェッチに失敗: ${response.status} ${response.statusText}`);
      return new NextResponse('動画の取得に失敗しました', { status: response.status });
    }

    // レスポンスヘッダーを設定
    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('Content-Type') || 'video/mp4');
    headers.set('Content-Length', response.headers.get('Content-Length') || '');
    headers.set('Access-Control-Allow-Origin', '*'); // すべてのオリジンからのアクセスを許可
    headers.set('Cache-Control', 'public, max-age=86400'); // 24時間キャッシュ

    // ストリームとしてレスポンスを返す
    return new NextResponse(response.body, {
      status: 200,
      headers: headers
    });
  } catch (error) {
    console.error('プロキシエラー:', error);
    return new NextResponse('内部サーバーエラー', { status: 500 });
  }
}