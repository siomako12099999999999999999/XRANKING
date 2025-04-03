/**
 * 機能概要：
 * データベース接続テスト用のスクリプト
 * 
 * 主な機能：
 * 1. データベース接続のテスト
 * 2. 接続状態の確認
 * 3. エラーハンドリング
 * 4. ログ出力
 * 
 * 用途：
 * - データベース接続の検証
 * - 環境設定の確認
 * - トラブルシューティング
 * - 開発環境のセットアップ確認
 */

const sql = require('mssql');

const config = {
  server: 'localhost',
  port: 1433,
  user: 'sa',
  password: 'Makoto1209',
  database: 'xranking',
  options: {
    trustServerCertificate: true,
  },
};

sql.connect(config).then(() => {
  console.log('✅ Connected successfully!');
  sql.close();
}).catch(err => {
  console.error('❌ Connection failed:', err);
});
