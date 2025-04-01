/**
 * 機能概要：
 * アプリケーションのルートレイアウトコンポーネント
 * 
 * 主な機能：
 * 1. グローバルスタイルの適用
 * 2. メタデータの設定
 * 3. フォントの設定
 * 4. プロバイダーの設定
 * 
 * 用途：
 * - アプリケーションの基本構造
 * - グローバル設定の管理
 * - 共通レイアウトの提供
 * - SEO最適化
 */

import './globals.css';
import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import Header from '@/components/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'XRANKING',
  description: 'X(Twitter)の人気動画ランキング',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900`}>
        <Providers>
          {/* ヘッダーを明示的にここに追加 */}
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}