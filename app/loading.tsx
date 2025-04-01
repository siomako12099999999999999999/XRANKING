/**
 * 機能概要：
 * アプリケーションのローディング状態表示コンポーネント
 * 
 * 主な機能：
 * 1. ローディングインジケータの表示
 * 2. スケルトンローダーの表示
 * 3. ユーザーフィードバック
 * 4. レスポンシブデザイン
 * 
 * 用途：
 * - ローディング状態の表示
 * - ユーザー体験の向上
 * - コンテンツ読み込み中の表示
 * - スムーズな遷移の実現
 */

import SkeletonLoader from '@/components/SkeletonLoader';
import LoadingIndicator from '@/components/LoadingIndicator';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <LoadingIndicator type="bounce" size="lg" />
        <h2 className="text-xl font-medium mt-4 text-gray-700 dark:text-gray-300">
          ツイートを読み込み中...
        </h2>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <SkeletonLoader type="card" count={5} />
      </div>
    </div>
  );
}