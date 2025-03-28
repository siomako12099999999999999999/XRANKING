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