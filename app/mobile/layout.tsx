/**
 * 機能概要：
 * モバイル向けレイアウトコンポーネント
 * 
 * 主な機能：
 * 1. モバイル最適化されたビューポート設定
 * 2. PWA対応設定
 * 3. テーマカラーとステータスバー設定
 * 4. スケーリング制御
 * 
 * 用途：
 * - モバイルデバイスでの体験最適化
 * - ネイティブアプリライクな表示
 * - パフォーマンス向上のための設定
 * - 一貫したモバイルデザインの提供
 */

import { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: '#000000',
};

export const metadata: Metadata = {
  title: 'XRANKING - モバイル',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'XRANKING'
  },
  other: {
    'apple-mobile-web-app-title': 'XRANKING',
    'apple-mobile-web-app-capable': 'yes',
    'mobile-web-app-capable': 'yes',
    'format-detection': 'telephone=no',
  }
};

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mobile-layout">
      <div className="overscroll-none bg-black min-h-screen">
        {children}
      </div>
    </div>
  );
}