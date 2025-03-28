import { NextResponse } from 'next/server';

// Twitterの動画URLにアクセスする際のヘッダー設定
const fetchHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': '*/*',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Referer': 'https://twitter.com/'
};

export async function GET(request: Request) {
  // URLパラメータから動画URLを取得
  const url = new URL(request.url);
  const videoUrl = url.searchParams.get('url');

  if (!videoUrl) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  console.log(`[Video Proxy] Proxy request for URL: ${videoUrl}`);

  try {
    // 動画を取得
    const response = await fetch(videoUrl, {
      headers: fetchHeaders
    });
    
    if (!response.ok) {
      console.error(`[Video Proxy] Fetch failed: ${response.status} ${response.statusText}`);
      return NextResponse.json({ error: 'Failed to fetch video' }, { status: response.status });
    }
    
    // レスポンスヘッダーを設定
    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('Content-Type') || 'video/mp4');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cache-Control', 'public, max-age=86400'); // 24時間キャッシュ
    
    console.log(`[Video Proxy] Successfully fetched video, streaming response...`);
    // ストリームとしてレスポンスを返す
    return new NextResponse(response.body, {
      headers,
      status: 200,
    });
  } catch (error) {
    console.error('[Video Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video' }, 
      { status: 500 }
    );
  }
}