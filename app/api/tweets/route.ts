import { NextResponse } from 'next/server';
import { getDbConnection } from '../../../db';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sort = url.searchParams.get('sort') || 'likes';
  const period = url.searchParams.get('period') || 'week';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);

  try {
    const pool = await getDbConnection();
    
    // 期間の条件を構築
    let dateCondition = '';
    const now = new Date();
    
    if (period === 'day') {
      // 過去24時間
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      dateCondition = `AND timestamp >= '${oneDayAgo.toISOString().split('T')[0]}'`;
    } else if (period === 'week') {
      // 過去7日間
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateCondition = `AND timestamp >= '${oneWeekAgo.toISOString().split('T')[0]}'`;
    } else if (period === 'month') {
      // 過去30日間
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateCondition = `AND timestamp >= '${oneMonthAgo.toISOString().split('T')[0]}'`;
    } else {
      // すべての期間（デフォルト）
      dateCondition = '';
    }

    // ソート順の条件を構築
    let orderBy = '';
    if (sort === 'likes') {
      orderBy = 'ORDER BY likes DESC';
    } else if (sort === 'trending') {
      // トレンドは最近の投稿でいいね数が多いもの
      orderBy = 'ORDER BY (likes / DATEDIFF(hour, timestamp, GETDATE() + 1)) DESC';
    } else if (sort === 'latest') {
      orderBy = 'ORDER BY timestamp DESC';
    } else {
      orderBy = 'ORDER BY likes DESC';
    }

    // ページネーションのオフセット計算
    const offset = (page - 1) * limit;

    console.log('[API] Fetching tweets with video URLs...');
    
    // 簡素化したクエリでまずは全件カウント
    const countResult = await pool.request().query(`
      SELECT COUNT(*) as total
      FROM [xranking].[dbo].[Tweet]
      WHERE 1=1 ${dateCondition}
    `);

    console.log(`[API] Total records in database: ${countResult.recordset[0].total}`);
    
    // シンプルなクエリでの確認（デバッグ用）
    console.log('[API] Fetching tweets - Simple query first');
    const simpleResult = await pool.request().query(`
      SELECT TOP 10 [id], [tweetId], [videoUrl]
      FROM [xranking].[dbo].[Tweet]
      ORDER BY [timestamp] DESC
    `);

    console.log(`[API] Simple query found: ${simpleResult.recordset.length} tweets`);
    if (simpleResult.recordset.length > 0) {
      console.log('[API] First tweet from simple query:', simpleResult.recordset[0]);
    } else {
      console.log('[API] No tweets found even with simple query');
    }

    // 本クエリの実行
    console.log('[API] Now trying the full query with conditions:');
    console.log(`Date condition: ${dateCondition}`);
    console.log(`Order by: ${orderBy}`);
    console.log(`Offset: ${offset}, Limit: ${limit}`);

    const result = await pool.request().query(`
      SELECT TOP ${limit}
        [id], [tweetId], [content], [videoUrl], [likes], [retweets], [views],
        [timestamp], [authorName], [authorUsername], [authorProfileImageUrl],
        [createdAt], [updatedAt]
      FROM (
        SELECT ROW_NUMBER() OVER(${orderBy}) as RowNum, *
        FROM [xranking].[dbo].[Tweet]
        WHERE 1=1 ${dateCondition}
      ) AS Numbered
      WHERE RowNum > ${offset}
      ORDER BY RowNum
    `);

    console.log(`[API] Found ${result.recordset.length} tweets`);

    // 結果の加工
    const tweets = result.recordset.map((tweet: any) => ({
      ...tweet,
      timestamp: new Date(tweet.timestamp).toISOString(),
      createdAt: new Date(tweet.createdAt).toISOString(),
      updatedAt: new Date(tweet.updatedAt).toISOString()
    }));

    return NextResponse.json({
      tweets,
      meta: {
        page,
        limit,
        total: countResult.recordset[0].total,
        pageCount: Math.ceil(countResult.recordset[0].total / limit)
      }
    });
  } catch (err) {
    console.error('データベースエラー:', err);
    return NextResponse.json({ error: 'データベースエラーが発生しました' }, { status: 500 });
  }
}