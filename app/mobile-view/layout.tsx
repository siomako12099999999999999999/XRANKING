'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import '../globals.css';

// クエリクライアントプロバイダーのみを含むシンプルなレイアウト
export default function MobileViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  // ページロード後に実行
  useState(() => {
    // ヘッダーを非表示にするCSSを動的に追加
    const style = document.createElement('style');
    style.textContent = `
      /* 既存のヘッダーを非表示にする */
      header, 
      nav[role="navigation"],
      .site-header,
      .app-header,
      .global-header,
      .main-header {
        display: none !important;
      }
      
      /* ページのマージン/パディングをリセット */
      body {
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
      }
      
      /* フルスクリーン表示 */
      html, body {
        height: 100% !important;
        width: 100% !important;
        background-color: #000 !important;
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </div>
  );
}