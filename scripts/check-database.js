const sql = require('mssql');
require('dotenv').config();

async function checkDatabase() {
    try {
        console.log('データベース接続中...');
        const pool = await sql.connect({
            server: process.env.SQL_SERVER,
            database: process.env.SQL_DATABASE,
            user: process.env.SQL_USER,
            password: process.env.SQL_PASSWORD,
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        });
        console.log('Creating new database connection pool');

        // 総レコード数と各カラムのNULL値の数を確認
        const result = await pool.request()
            .query(`
                SELECT 
                    COUNT(*) as total_records,
                    SUM(CASE WHEN videoUrl IS NULL THEN 1 ELSE 0 END) as null_video_url,
                    SUM(CASE WHEN content IS NULL THEN 1 ELSE 0 END) as null_content,
                    SUM(CASE WHEN authorId IS NULL THEN 1 ELSE 0 END) as null_author_id,
                    SUM(CASE WHEN authorName IS NULL THEN 1 ELSE 0 END) as null_author_name,
                    SUM(CASE WHEN authorUsername IS NULL THEN 1 ELSE 0 END) as null_author_username,
                    SUM(CASE WHEN authorProfileImageUrl IS NULL THEN 1 ELSE 0 END) as null_profile_image,
                    SUM(CASE WHEN thumbnailUrl IS NULL THEN 1 ELSE 0 END) as null_thumbnail
                FROM Tweet
            `);
        
        console.log('\nデータベースの状態:');
        console.log(`総レコード数: ${result.recordset[0].total_records}`);
        console.log(`videoUrlがNULL: ${result.recordset[0].null_video_url}`);
        console.log(`contentがNULL: ${result.recordset[0].null_content}`);
        console.log(`authorIdがNULL: ${result.recordset[0].null_author_id}`);
        console.log(`authorNameがNULL: ${result.recordset[0].null_author_name}`);
        console.log(`authorUsernameがNULL: ${result.recordset[0].null_author_username}`);
        console.log(`authorProfileImageUrlがNULL: ${result.recordset[0].null_profile_image}`);
        console.log(`thumbnailUrlがNULL: ${result.recordset[0].null_thumbnail}`);

        // 最新の5件のレコードを表示
        const recentRecords = await pool.request()
            .query(`
                SELECT TOP 5 
                    id, tweetId, videoUrl, content, authorName, authorUsername,
                    likes, retweets, views, createdAt, updatedAt
                FROM Tweet
                ORDER BY createdAt DESC
            `);
        
        console.log('\n最新の5件のレコード:');
        recentRecords.recordset.forEach(record => {
            console.log('\n-------------------');
            console.log(`ID: ${record.id}`);
            console.log(`ツイートID: ${record.tweetId}`);
            console.log(`動画URL: ${record.videoUrl ? 'あり' : 'なし'}`);
            console.log(`本文: ${record.content ? record.content.substring(0, 50) + '...' : 'なし'}`);
            console.log(`投稿者: ${record.authorName} (@${record.authorUsername})`);
            console.log(`いいね: ${record.likes}, リツイート: ${record.retweets}, 閲覧: ${record.views}`);
            console.log(`作成日時: ${record.createdAt}`);
            console.log(`更新日時: ${record.updatedAt}`);
        });

        // テーブル構造の確認
        const tableStructure = await pool.request()
            .query(`
                SELECT 
                    COLUMN_NAME,
                    DATA_TYPE,
                    CHARACTER_MAXIMUM_LENGTH,
                    IS_NULLABLE
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'Tweet'
                ORDER BY ORDINAL_POSITION
            `);
        
        console.log('\nテーブル構造:');
        tableStructure.recordset.forEach(column => {
            console.log(`${column.COLUMN_NAME}: ${column.DATA_TYPE}${column.CHARACTER_MAXIMUM_LENGTH ? `(${column.CHARACTER_MAXIMUM_LENGTH})` : ''} (${column.IS_NULLABLE})`);
        });

    } catch (err) {
        console.error('エラー:', err);
    } finally {
        sql.close();
    }
}

checkDatabase();