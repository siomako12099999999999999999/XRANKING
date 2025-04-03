/**
 * 機能概要：
 * Playwrightテストフレームワークの設定ファイル
 * 
 * 主な機能：
 * 1. テストディレクトリの設定
 * 2. タイムアウトとリトライの設定
 * 3. ブラウザ環境の設定
 * 4. レポート出力の設定
 * 
 * 用途：
 * - E2Eテストの実行環境設定
 * - テスト自動化の設定
 * - CI/CDパイプラインの統合
 * - テストレポートの生成
 */

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 30000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' },
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit' },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});