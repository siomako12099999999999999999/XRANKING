/**
 * 機能概要：
 * シンプルなビデオプロキシ機能モジュール
 * 
 * 主な機能：
 * 1. 指定URLの動画コンテンツをプロキシ
 * 2. 適切なヘッダー情報の設定
 * 3. エラーハンドリング
 * 4. キャッシュヘッダーの設定
 * 
 * 用途：
 * - 動画アクセスのプロキシ機能提供
 * - Twitter動画の安定視聴
 * - CORS問題の回避
 * - route.tsから利用される実装
 */

import { NextRequest, NextResponse } from 'next/server';

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

    if (!response.body) {
      console.error('レスポンスボディが空です');
      return new NextResponse('動画データが見つかりません', { status: 500 });
    }

    const headers = new Headers({
      'Content-Type': response.headers.get('Content-Type') || 'video/mp4',
      'Content-Length': response.headers.get('Content-Length') || '',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400',
    });

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('プロキシエラー:', error);
    return new NextResponse('内部サーバーエラー', { status: 500 });
  }
}