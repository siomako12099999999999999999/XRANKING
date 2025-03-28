const { getDbConnection } = require('../db');

async function checkDbSchema() {
  try {
    console.log('データベース接続中...');
    const pool = await getDbConnection();
    
    // テーブル情報の取得
    const tableInfo = await pool.request().query(`
      SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE
      FROM 
        INFORMATION_SCHEMA.COLUMNS
      WHERE 
        TABLE_NAME = 'Tweet'
      ORDER BY 
        ORDINAL_POSITION
    `);
    
    console.log('--- Tweet テーブルの構造 ---');
    console.table(tableInfo.recordset);
    
    // サンプルデータの取得
    const sampleData = await pool.request().query(`
      SELECT TOP 3 * 
      FROM [xranking].[dbo].[Tweet] 
      ORDER BY [createdAt] DESC
    `);
    
    console.log('\n--- Tweet テーブルのサンプルデータ ---');
    if (sampleData.recordset.length > 0) {
      sampleData.recordset.forEach((row, i) => {
        console.log(`\n[行 ${i+1}]:`);
        Object.entries(row).forEach(([key, value]) => {
          console.log(`${key}: ${value}`);
        });
      });
    } else {
      console.log('データが見つかりません');
    }
    
    // ビデオURL統計
    const videoStats = await pool.request().query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN videoUrl IS NOT NULL THEN 1 ELSE 0 END) as withVideo,
        SUM(CASE WHEN videoUrl IS NULL THEN 1 ELSE 0 END) as withoutVideo
      FROM [xranking].[dbo].[Tweet]
    `);
    
    console.log('\n--- ビデオURL統計 ---');
    console.log(`総レコード数: ${videoStats.recordset[0].total}`);
    console.log(`ビデオURLあり: ${videoStats.recordset[0].withVideo}`);
    console.log(`ビデオURLなし: ${videoStats.recordset[0].withoutVideo}`);
    
    process.exit(0);
  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  }
}

checkDbSchema();