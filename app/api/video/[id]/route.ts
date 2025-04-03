/**
 * 機能概要：
 * ツイート動画プロキシAPIエンドポイント
 * 
 * 主な機能：
 * 1. ツイートIDに基づく動画URLの取得
 * 2. Twitter動画コンテンツのプロキシ
 * 3. キャッシュヘッダーの設定
 * 4. 範囲リクエスト（レンジリクエスト）のサポート
 * 
 * 用途：
 * - Twitter動画の安定視聴の提供
 * - CORS制限の回避
 * - トラフィック最適化
 * - 動画再生のパフォーマンス向上
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '../../../../db'; // db.jsからインポート

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
    console.log(`[Video Proxy] Fetching video for tweet ID: ${tweetId}`);
    
    // データベースから動画URL取得 (mssqlを使用)
    const pool = await getDbConnection();
    const result = await pool.request()
      .input('tweetId', tweetId)
      .query(`
        SELECT [videoUrl]
        FROM [xranking].[dbo].[Tweet]
        WHERE [tweetId] = @tweetId
      `);
    
    // 結果が存在するか確認
    if (!result.recordset[0] || !result.recordset[0].videoUrl) {
      console.error(`[Video Proxy] No video found for tweet ID: ${tweetId}`);
      return new NextResponse('動画が見つかりません', { status: 404 });
    }
    
    const videoUrl = result.recordset[0].videoUrl;
    console.log(`[Video Proxy] Found video URL: ${videoUrl}`);
    
    // Twitterから動画を取得
    console.log(`[Video Proxy] Fetching video from Twitter...`);
    const response = await fetch(videoUrl, {
      headers: fetchHeaders,
    });
    
    if (!response.ok) {
      console.error(`[Video Proxy] Twitter video fetch failed: ${response.status} ${response.statusText}`);
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
    
    // CORSヘッダー追加
    headers.set('Access-Control-Allow-Origin', '*');
    
    // キャッシュヘッダー
    headers.set('Cache-Control', 'public, max-age=86400'); // 24時間キャッシュ
    
    // レンジリクエストのサポート
    const rangeHeader = request.headers.get('range');
    if (rangeHeader && response.headers.has('Content-Length')) {
      // レンジリクエストの場合は元のレンジヘッダーと同じレンジヘッダーを設定
      headers.set('Accept-Ranges', 'bytes');
      headers.set('Content-Range', response.headers.get('Content-Range') || '');
    }
    
    console.log(`[Video Proxy] Streaming video response...`);
    // ストリームレスポンスを返す
    return new NextResponse(response.body, {
      headers,
      status: response.status,
    });
    
  } catch (error) {
    console.error('[Video Proxy] Error:', error);
    return new NextResponse('内部サーバーエラー', { status: 500 });
  }
}