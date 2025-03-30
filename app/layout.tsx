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