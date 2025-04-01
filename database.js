/**
 * 機能概要：
 * SQL Serverデータベースとの接続・操作を管理するモジュール
 * 
 * 主な機能：
 * 1. データベース接続の管理
 * 2. SQLクエリの実行
 * 3. データの取得と更新
 * 4. エラーハンドリング
 * 
 * 用途：
 * - アプリケーションのデータ永続化
 * - データベース操作の一元管理
 * - データアクセス層の実装
 * - セキュアなデータ管理
 */

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