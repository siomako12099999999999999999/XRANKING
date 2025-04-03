/**
 * 機能概要：
 * アプリケーションのエラーハンドリングコンポーネント
 * 
 * 主な機能：
 * 1. エラー状態の表示
 * 2. エラーログの記録
 * 3. リセット機能の提供
 * 4. ユーザーフィードバック
 * 
 * 用途：
 * - エラー状態の管理
 * - ユーザー体験の向上
 * - デバッグ情報の収集
 * - エラーからの回復
 */

'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('ページエラーが発生しました:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-4xl font-bold mb-4 text-red-600 dark:text-red-400">問題が発生しました</h1>
      <p className="text-xl mb-6 text-gray-700 dark:text-gray-300">
        申し訳ありませんが、エラーが発生しました。
      </p>
      <div className="flex flex-col sm:flex-row gap-4 mt-4">
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition-colors"
        >
          もう一度試す
        </button>
        <Link 
          href="/"
          className="px-6 py-3 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          ホームに戻る
        </Link>
      </div>
    </div>
  );
}