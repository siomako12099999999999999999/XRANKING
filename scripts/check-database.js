const { getDbConnection } = require('../db');

async function checkDatabase() {
  try {
    console.log('データベース接続中...');
    const pool = await getDbConnection();
    
    // 全ツイート数の確認
    const totalResult = await pool.request().query(`
      SELECT COUNT(*) as total
      FROM [xranking].[dbo].[Tweet]
    `);
    console.log(`データベース内の総ツイート数: ${totalResult.recordset[0].total}`);
    
    // ビデオURLありのツイート数
    const videoResult = await pool.request().query(`
      SELECT COUNT(*) as total
      FROM [xranking].[dbo].[Tweet]
      WHERE videoUrl IS NOT NULL
    `);
    console.log(`ビデオURLありのツイート数: ${videoResult.recordset[0].total}`);
    
    // ツイートテーブルの構造確認
    console.log('\nテーブル構造の確認:');
    const columnsResult = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Tweet'
    `);
    console.log(columnsResult.recordset);
    
    // サンプルデータ取得
    console.log('\nサンプルデータ取得:');
    const sampleData = await pool.request().query(`
      SELECT TOP 5 *
      FROM [xranking].[dbo].[Tweet]
    `);
    console.log(JSON.stringify(sampleData.recordset, null, 2));
    
    // ビデオURLの列名確認（大文字小文字の問題の可能性）
    console.log('\n動画URL関連の列を検索:');
    const videoColumns = await pool.request().query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Tweet'
      AND (COLUMN_NAME LIKE '%video%' OR COLUMN_NAME LIKE '%media%')
    `);
    console.log(videoColumns.recordset);

    process.exit(0);
  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  }
}

checkDatabase();