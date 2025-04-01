/**
 * 機能概要：
 * 全画面ローディングコンポーネント
 * 
 * 主な機能：
 * 1. 画面全体のローディング表示
 * 2. カスタムメッセージの表示
 * 3. 背景のぼかし効果
 * 4. ダークモード対応
 * 
 * 用途：
 * - 重要な処理中の表示
 * - ページ遷移時のローディング
 * - ユーザー操作のブロック
 * - 処理完了待ちの視覚的フィードバック
 */

import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface FullPageLoaderProps {
  message?: string;
}

const FullPageLoader: React.FC<FullPageLoaderProps> = ({ 
  message = "読み込み中..." 
}) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50">
      <div className="text-center p-6 max-w-sm rounded-xl">
        {/* colorプロパティを削除 */}
        <LoadingSpinner size="h-12 w-12" />
        <p className="mt-4 text-lg font-medium text-gray-800 dark:text-gray-200">{message}</p>
      </div>
    </div>
  );
};

export default FullPageLoader;