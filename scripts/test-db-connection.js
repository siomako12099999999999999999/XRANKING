const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// 環境変数をロード
dotenv.config();

// 現在の接続文字列を表示
console.log('----- データベース接続テスト -----');
console.log('現在の接続設定:');
const databaseUrl = process.env.DATABASE_URL || '接続文字列が見つかりません';
console.log(databaseUrl);
console.log('------------------------------');

// 接続テスト関数
async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('1. Prismaクライアントを初期化しています...');
    
    console.log('2. データベースに接続しています...');
    // 簡単なクエリを実行してみる
    const result = await prisma.$queryRaw`SELECT 1 AS TestResult`;
    
    console.log('3. 接続成功しました！');
    console.log('テスト結果:', result);
    
    // Tweet テーブルのカウントを取得してみる
    console.log('4. Tweet テーブルのレコード数を取得しています...');
    const tweetCount = await prisma.tweet.count();
    console.log(`Tweet テーブルには ${tweetCount} 件のレコードがあります`);
    
    if (tweetCount > 0) {
      // サンプルデータを1件取得
      console.log('5. サンプルデータを取得しています...');
      const sampleTweet = await prisma.tweet.findFirst();
      console.log('サンプルツイート:', JSON.stringify(sampleTweet, null, 2));
    }
    
    return true;
  } catch (error) {
    console.error('データベース接続エラー:');
    console.error(error);
    return false;
  } finally {
    await prisma.$disconnect();
    console.log('6. データベース接続を切断しました');
  }
}

// SQLiteでのテスト
async function testSQLite() {
  console.log('\nSQLiteでのテスト:');
  const sqliteUrl = "file:./dev.db";
  
  const prismaSqlite = new PrismaClient({
    datasources: {
      db: {
        url: sqliteUrl
      }
    }
  });
  
  try {
    // SQLiteの場合はデータベースが存在しなくても作成されるので簡単なクエリでテスト
    await prismaSqlite.$executeRaw`SELECT 1`;
    console.log('SQLite接続成功!');
    
    // .envファイルを更新
    const envPath = path.resolve(process.cwd(), '.env');
    const envContent = `DATABASE_URL="${sqliteUrl}"`;
    fs.writeFileSync(envPath, envContent);
    console.log('.envファイルをSQLiteに更新しました');
    
    console.log('\n重要: Prismaスキーマのproviderを"sqlite"に変更する必要があります:');
    console.log(`
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`);
    
    return true;
  } catch (error) {
    console.error('SQLite接続失敗:', error?.message || '不明なエラー');
    return false;
  } finally {
    await prismaSqlite.$disconnect();
  }
}

// 実行
async function run() {
  try {
    // まず現在の設定で接続テスト
    const connected = await testConnection();
    
    // 接続できない場合はSQLiteを試す
    if (!connected) {
      console.log('\n現在の接続設定では接続できません。SQLiteを試します...');
      await testSQLite();
    }
  } catch (error) {
    console.error('テスト実行中にエラーが発生しました:', error?.message || '不明なエラー');
  }
}

// スクリプト実行
run()
  .then(() => {
    console.log('\nテスト完了');
    process.exit(0);
  })
  .catch((error) => {
    console.error('予期しないエラー:', error?.message || '不明なエラー');
    process.exit(1);
  });

const sqlServerUrl = "sqlserver://localhost\\SQLEXPRESS:1433;database=xranking;user=sa;password=Makoto1209;trustServerCertificate=true;encrypt=DANGER_PLAINTEXT";