const { getDbConnection } = require('../db');

async function checkVideoUrls() {
  try {
    console.log('データベース接続中...');
    const pool = await getDbConnection();
    
    console.log('ビデオURL統計の取得中...');
    const result = await pool.request().query(`
      SELECT
        COUNT(*) AS totalTweets,
        SUM(CASE WHEN videoUrl IS NOT NULL THEN 1 ELSE 0 END) AS tweetsWithVideo,
        SUM(CASE WHEN videoUrl IS NULL THEN 1 ELSE 0 END) AS tweetsWithoutVideo
      FROM [xranking].[dbo].[Tweet]
    `);
    
    console.log('ビデオURL統計:');
    console.log(`総ツイート数: ${result.recordset[0].totalTweets}`);
    console.log(`ビデオURL付きツイート: ${result.recordset[0].tweetsWithVideo}`);
    console.log(`ビデオURLなしツイート: ${result.recordset[0].tweetsWithoutVideo}`);
    
    if (result.recordset[0].tweetsWithVideo > 0) {
      console.log('\nビデオURL付きツイートのサンプル:');
      const sampleResult = await pool.request().query(`
        SELECT TOP 5 [id], [tweetId], [videoUrl]
        FROM [xranking].[dbo].[Tweet]
        WHERE videoUrl IS NOT NULL
      `);
      
      console.log(JSON.stringify(sampleResult.recordset, null, 2));
    }
    
    console.log('\n完了');
    process.exit(0);
  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  }
}

checkVideoUrls();