import { exec } from 'child_process';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// 環境変数をロード
dotenv.config();

// .envファイルを作成するコード
const createEnvFileIfNeeded = () => {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.resolve(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    const envContent = `DATABASE_URL="sqlserver://localhost:1433;database=xranking;user=sa;password=Makoto1209;trustServerCertificate=true;encrypt=DANGER_PLAINTEXT"`;
    fs.writeFileSync(envPath, envContent);
    console.log('.envファイルを作成しました');
  }
};

createEnvFileIfNeeded();

// SQL Server接続テスト
async function testSqlConnection() {
  try {
    console.log('Prisma接続文字列:', process.env.DATABASE_URL);
    
    const prisma = new PrismaClient();
    console.log('Prisma接続テスト中...');
    
    // 最も単純なテスト
    const result = await prisma.$queryRaw`SELECT 1 AS TestResult`;
    console.log('接続成功:', result);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('接続エラー:', error);
  }
}

testSqlConnection();