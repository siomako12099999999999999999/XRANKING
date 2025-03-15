const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// 環境変数をロード
dotenv.config();

console.log('接続文字列:', process.env.DATABASE_URL);

// 代替接続文字列を試す
async function testConnection(url) {
  console.log(`\n接続テスト: ${url}`);
  
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: { url }
      }
    });
    
    // 簡単なクエリで接続テスト
    await prisma.$connect();
    console.log('接続成功!');
    
    // 実際のデータを確認
    try {
      const count = await prisma.tweet.count();
      console.log(`Tweet テーブルには ${count} 件のレコードがあります`);
      
      if (count > 0) {
        const firstTweet = await prisma.tweet.findFirst();
        console.log('最初のツイート:', JSON.stringify(firstTweet, null, 2));
      }
    } catch (queryError) {
      console.error('クエリエラー:', queryError.message);
    }
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('接続エラー:', error.message);
    return false;
  }
}

// 様々な接続文字列を試す
async function tryVariousConnections() {
  // 試す接続文字列のリスト
  const connectionStrings = [
    // 基本形式
    "sqlserver://localhost:1433;database=xranking;user=sa;password=Makoto1209;trustServerCertificate=true",
    // インスタンス名をパラメータとして指定
    "sqlserver://localhost:1433;database=xranking;user=sa;password=Makoto1209;trustServerCertificate=true;instanceName=SQLEXPRESS",
    // encrypt=DANGER_PLAINTEXT を追加
    "sqlserver://localhost:1433;database=xranking;user=sa;password=Makoto1209;trustServerCertificate=true;encrypt=DANGER_PLAINTEXT",
    // ポートなしでインスタンス名をホスト名の一部として指定
    "sqlserver://localhost\\SQLEXPRESS;database=xranking;user=sa;password=Makoto1209;trustServerCertificate=true",
    // URLエンコードしたバックスラッシュでインスタンス名を指定
    "sqlserver://localhost%5CSQLEXPRESS;database=xranking;user=sa;password=Makoto1209;trustServerCertificate=true"
  ];
  
  let success = false;
  
  for (const url of connectionStrings) {
    const connected = await testConnection(url);
    if (connected) {
      console.log(`\n成功した接続文字列: ${url}`);
      console.log('この接続文字列を.envファイルに設定しますか？ (自動設定)');
      
      // .envファイルを更新
      const envPath = path.resolve(process.cwd(), '.env');
      fs.writeFileSync(envPath, `DATABASE_URL="${url}"`);
      console.log('.envファイルを更新しました');
      
      success = true;
      break;
    }
  }
  
  if (!success) {
    console.log('\n全ての接続文字列が失敗しました。');
    console.log('1. SQL Serverサービスが実行中か確認してください。');
    console.log('2. SAアカウントが有効で、パスワードが正しいか確認してください。');
    console.log('3. データベース "xranking" が存在するか確認してください。');
    console.log('4. TCP/IPプロトコルが有効か確認してください。');
  }
}

// 実行
tryVariousConnections();