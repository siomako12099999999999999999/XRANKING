const sql = require('mssql');

// SQL Serverの接続設定
const config = {
  server: 'localhost',
  port: 1433,
  user: 'sa',
  password: 'Makoto1209',
  database: 'xranking',
  options: {
    trustServerCertificate: true, // 自己署名証明書を許可
  },
};

// データベース接続とクエリ実行
async function fetchTweets() {
  try {
    // 接続を確立
    const pool = await sql.connect(config);

    // クエリを実行
    const result = await pool.request().query(`
      SELECT TOP (1000) [id], [tweetId], [likes], [retweets], [views], [createdAt], [updatedAt],
                        [content], [videoUrl], [timestamp], [authorName], [authorProfileImageUrl],
                        [authorUsername], [thumbnailUrl], [authorId], [originalUrl]
      FROM [xranking].[dbo].[Tweet]
    `);

    console.log('Tweets:', result.recordset);

    // 接続を閉じる
    await pool.close();
  } catch (err) {
    console.error('データベースエラー:', err);
  }
}

// 実行
fetchTweets();