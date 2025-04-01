/**
 * 機能概要：
 * アプリケーションのプロバイダー設定コンポーネント
 * 
 * 主な機能：
 * 1. React Queryクライアントの初期化
 * 2. グローバルプロバイダーの設定
 * 3. クエリキャッシュの設定
 * 4. フェッチポリシーの設定
 * 
 * 用途：
 * - データフェッチの最適化
 * - 状態管理の一元化
 * - キャッシュ戦略の実装
 * - アプリ全体でのデータ共有
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export default Providers; // デフォルトエクスポートを追加