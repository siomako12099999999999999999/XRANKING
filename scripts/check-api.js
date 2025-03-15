const fetch = require('node-fetch');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log("データベース直接接続テスト...");
    
    // ツイート数を確認
    const count = await prisma.tweet.count();
    console.log(`データベースには ${count} 件のツイートがあります`);
    
    if (count > 0) {
      // サンプルデータを取得
      const sample = await prisma.tweet.findFirst();
      console.log("サンプルレコード:", sample);
    } else {
      console.log("データベースにレコードがありません");
    }
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error("データベース接続エラー:", error);
    await prisma.$disconnect();
    return false;
  }
}

async function checkApi() {
  try {
    console.log("APIリクエストテスト...");
    const response = await fetch('http://localhost:3000/api/tweets?page=1&limit=5&period=all');
    
    if (!response.ok) {
      console.error(`APIエラー: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error("エラーレスポンス:", text);
      return;
    }
    
    const data = await response.json();
    console.log("API成功:", data);
    console.log(`取得件数: ${data.tweets?.length || 0}`);
    console.log(`合計件数: ${data.meta?.total || 0}`);
  } catch (error) {
    console.error("APIリクエストエラー:", error);
  }
}

async function main() {
  console.log("=== API接続診断ツール ===");
  
  const dbOk = await checkDatabase();
  if (dbOk) {
    console.log("\nデータベース接続成功。API接続テストを実行します...");
    await checkApi();
  }
}

main().catch(console.error);