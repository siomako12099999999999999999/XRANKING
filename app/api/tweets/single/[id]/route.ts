/**
 * 機能概要：
 * 単一ツイート取得APIエンドポイント
 * 
 * 主な機能：
 * 1. 指定されたIDのツイートをデータベースから取得
 * 2. 存在チェックとエラーハンドリング
 * 3. データベース接続の適切な終了処理
 * 
 * 用途：
 * - 個別ツイート詳細表示
 * - 特定ツイートの情報参照
 * - 動画単体表示のデータソース
 * - ツイート詳細ページのバックエンド
 */

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