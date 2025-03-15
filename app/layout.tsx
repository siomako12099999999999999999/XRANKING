import './globals.css';
import { Inter } from 'next/font/google';
import type { Metadata, Viewport } from 'next';
import Header from '@/components/Header';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'XRANKING - 人気の動画投稿をチェック',
  description: 'X / Twitter の人気動画投稿をランキングで表示するサービス',
  icons: {
    icon: '/logotrim.ico', // カスタム名のアイコンファイルを指定
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900`}>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}