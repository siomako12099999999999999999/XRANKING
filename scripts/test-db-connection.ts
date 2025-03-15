import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

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

// 代替接続文字列でテスト
async function testAlternativeConnection() {
  console.log('\n----- 代替接続方法をテストします -----');
  
  // SQL Serverの代替接続文字列を試す
  const alternativeUrls = [
    // 基本形式
    "sqlserver://localhost:1433;database=xranking;user=sa;password=Makoto1209;trustServerCertificate=true",
    // インスタンス名を使用
    "sqlserver://localhost;database=xranking;user=sa;password=Makoto1209;trustServerCertificate=true",
    // SQLEXPRESSを指定
    "sqlserver://localhost\\SQLEXPRESS:1433;database=xranking;user=sa;password=Makoto1209;trustServerCertificate=true",
    // インスタンス名パラメータを使用
    "sqlserver://localhost:1433;database=xranking;user=sa;password=Makoto1209;instanceName=SQLEXPRESS;trustServerCertificate=true"
  ];
  
  for (const url of alternativeUrls) {
    console.log(`\n接続文字列をテスト: ${url}`);
    
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url
        }
      }
    });
    
    try {
      const result = await prisma.$queryRaw`SELECT 1 AS TestResult`;
      console.log('接続成功!', result);
      
      // 成功した接続文字列を.envに保存するか確認
      const save = true; // 自動保存する場合はtrueに設定
      if (save) {
        const envPath = path.resolve(process.cwd(), '.env');
        const envContent = `DATABASE_URL="${url}"`;
        fs.writeFileSync(envPath, envContent);
        console.log(`.env ファイルを更新しました`);
      }
      
      await prisma.$disconnect();
      return true;
    } catch (error: any) { // ここでany型に明示的に型付け
      console.error('接続失敗:', error?.message || '不明なエラー');
      await prisma.$disconnect();
    }
  }
  
  // SQLiteでのテスト
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
    
    const save = false; // SQLiteを使いたい場合はtrueに変更
    if (save) {
      const envPath = path.resolve(process.cwd(), '.env');
      const envContent = `DATABASE_URL="${sqliteUrl}"`;
      fs.writeFileSync(envPath, envContent);
      console.log('.envファイルをSQLiteに更新しました');
      
      // schemaのproviderをsqliteに変更する必要があることを通知
      console.log('\n重要: Prismaスキーマのproviderを"sqlite"に変更する必要があります:');
      console.log(`
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`);
    }
    
    await prismaSqlite.$disconnect();
    return true;
  } catch (error: any) { // ここでany型に明示的に型付け
    console.error('SQLite接続失敗:', error?.message || '不明なエラー');
    await prismaSqlite.$disconnect();
    return false;
  }
}

// 実行
async function run() {
  try {
    // まず現在の設定で接続テスト
    const connected = await testConnection();
    
    // 接続できない場合は代替方法を試す
    if (!connected) {
      console.log('\n現在の接続設定では接続できません。代替方法を試します...');
      await testAlternativeConnection();
    }
  } catch (error: any) { // ここでany型に明示的に型付け
    console.error('テスト実行中にエラーが発生しました:', error?.message || '不明なエラー');
  }
}

run()
  .then(() => {
    console.log('\nテスト完了');
    process.exit(0);
  })
  .catch((error: any) => { // ここでany型に明示的に型付け
    console.error('予期しないエラー:', error?.message || '不明なエラー');
    process.exit(1);
  });