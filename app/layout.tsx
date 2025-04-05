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
  // デフォルトのタイトルとディスクリプションを更新
  title: {
    default: 'XRANKING - X(Twitter)の動画ランキング',
    template: '%s | XRANKING', // ページごとにタイトルを設定するためのテンプレート
  },
  description: '今、話題のX(Twitter)動画をリアルタイム・週間・月間ランキングでまとめてチェック！アクセス数や視聴中ユーザーも表示。TikTok風UIでサクサク視聴！',
  // OGP設定を追加
  openGraph: {
    type: 'website', // トップページはwebsite, 動画ページはvideo.other
    title: 'XRANKING - X(Twitter)の動画ランキング',
    description: '今、話題のX(Twitter)動画をリアルタイム・週間・月間ランキングでまとめてチェック！',
    url: 'https://xranking.jp/', // TODO: 正式なドメインに置き換える
    siteName: 'XRANKING',
    images: [
      {
        url: 'https://xranking.jp/ogp.jpg', // TODO: OGP画像へのパスを設定する
        width: 1200,
        height: 630,
        alt: 'XRANKING OGP Image',
      },
    ],
    locale: 'ja_JP',
  },
  // Twitterカード設定を追加
  twitter: {
    card: 'summary_large_image', // 大きな画像付きのサマリーカード
    title: 'XRANKING - X(Twitter)の動画ランキング',
    description: '今、話題のX(Twitter)動画をリアルタイム・週間・月間ランキングでまとめてチェック！',
    // site: '@ツイッターアカウント名', // TODO: サイトのTwitterアカウントがあれば設定
    images: ['https://xranking.jp/twitter-card.jpg'], // TODO: Twitterカード画像へのパスを設定する
  },
  // その他のメタデータ (必要に応じて追加)
  // robots: { // クローラビリティ向上のため、後でrobots.txtと合わせて設定
  //   index: true,
  //   follow: true,
  // },
  // alternates: { // 多言語対応などがあれば
  //   canonical: 'https://xranking.jp/',
  // },
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
