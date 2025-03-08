import { PrismaClient } from '@prisma/client';

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('データベース接続テスト中...');
    
    // 最も単純なクエリを実行
    const result = await prisma.$queryRaw`SELECT 1 AS TestResult`;
    console.log('接続成功:', result);
    
    // テーブル一覧を取得
    const tables = await prisma.$queryRaw`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'`;
    console.log('テーブル一覧:', tables);
    
    console.log('データベース接続テスト完了');
  } catch (error) {
    console.error('データベース接続エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();