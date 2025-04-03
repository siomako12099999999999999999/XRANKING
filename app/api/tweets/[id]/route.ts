/**
 * 機能概要：
 * IDによるツイート取得APIエンドポイント
 * 
 * 主な機能：
 * 1. ツイートIDに基づくデータベース検索
 * 2. 動画URLのプロキシ変換
 * 3. 日付の適切な形式変換
 * 4. エラーハンドリングと存在チェック
 * 
 * 用途：
 * - 個別ツイート情報の取得
 * - 動画表示のデータソース
 * - ツイート詳細表示画面のバックエンド
 * - 動画プロキシのリダイレクト元
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '../../../../db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tweetId = params.id;
    
    const pool = await getDbConnection();
    const result = await pool.request()
      .input('tweetId', tweetId)
      .query(`
        SELECT [id], [tweetId], [content], [videoUrl], [likes], [retweets], [views],
               [timestamp], [authorName], [authorUsername], [authorProfileImageUrl],
               [createdAt], [updatedAt]
        FROM [xranking].[dbo].[Tweet]
        WHERE [tweetId] = @tweetId
      `);
    
    if (!result.recordset[0]) {
      return NextResponse.json({ error: 'ツイートが見つかりません' }, { status: 404 });
    }
    
    const tweet = {
      ...result.recordset[0],
      // プロキシURLを作成
      videoUrl: `/api/video/${tweetId}`,
      timestamp: new Date(result.recordset[0].timestamp).toISOString(),
      createdAt: new Date(result.recordset[0].createdAt).toISOString(),
      updatedAt: new Date(result.recordset[0].updatedAt).toISOString()
    };
    
    return NextResponse.json(tweet);
  } catch (error) {
    console.error('Tweet fetch error:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}