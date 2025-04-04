/**
 * 機能概要：
 * ツイートのローディングスケルトンコンポーネント
 * 
 * 主な機能：
 * 1. ローディング中の表示プレースホルダー
 * 2. 複数のスケルトンアイテム生成
 * 3. ダークモード対応
 * 4. アニメーション効果
 * 
 * 用途：
 * - データ読み込み中の表示
 * - ユーザー体験の向上
 * - 画面のちらつき防止
 * - ロード状態の視覚的フィードバック
 */

import React from 'react';

interface TweetSkeletonProps {
  count: number;
}

const TweetSkeleton: React.FC<TweetSkeletonProps> = ({ count }) => {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 animate-pulse">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-48 w-full bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default TweetSkeleton;