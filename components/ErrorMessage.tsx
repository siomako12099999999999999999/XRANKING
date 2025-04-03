/**
 * 機能概要：
 * エラーメッセージ表示コンポーネント
 * 
 * 主な機能：
 * 1. エラー情報の表示
 * 2. 再試行ボタンの提供
 * 3. 視覚的フィードバック
 * 4. ユーザーフレンドリーなメッセージング
 * 
 * 用途：
 * - API通信エラーの表示
 * - データ取得失敗時の対応
 * - ユーザー体験の向上
 * - エラーリカバリーの提供
 */

import React from 'react';

interface ErrorMessageProps {
  error: Error | null;
  onRetry: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onRetry }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
      <div className="mb-4">
        <svg 
          className="mx-auto h-12 w-12 text-red-500 dark:text-red-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        エラーが発生しました
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {error?.message || 'データの取得に失敗しました'}
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        再試行
      </button>
    </div>
  );
};

export default ErrorMessage;