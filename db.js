/**
 * 機能概要：
 * SQL Serverデータベース接続を管理するモジュール
 * 
 * 主な機能：
 * 1. データベース接続設定の管理
 * 2. コネクションプールの実装
 * 3. 環境変数による設定の柔軟化
 * 4. エラーハンドリング
 * 
 * 用途：
 * - データベース接続の一元管理
 * - パフォーマンス最適化
 * - セキュアな接続管理
 * - 環境依存の設定管理
 */

const sql = require('mssql');

// 環境変数から接続情報を取得、または開発用のデフォルト値を使用
const config = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433'),
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'Makoto1209',
  database: process.env.DB_NAME || 'xranking',
  options: {
    trustServerCertificate: true, // 自己署名証明書を許可
    enableArithAbort: true
  },
};

let pool;

async function getDbConnection() {
  try {
    if (!pool) {
      console.log('Creating new database connection pool');
      pool = await sql.connect(config);
    }
    return pool;
  } catch (err) {
    console.error('データベース接続エラー:', err);
    throw err;
  }
}

module.exports = { getDbConnection };