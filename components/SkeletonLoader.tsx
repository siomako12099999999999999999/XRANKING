/**
 * 機能概要：
 * スケルトンローディングコンポーネント
 * 
 * 主な機能：
 * 1. 複数種類のスケルトン表示（カード、テキスト、円形、画像）
 * 2. カスタマイズ可能な数量
 * 3. アニメーション効果
 * 4. ダークモード対応
 * 
 * 用途：
 * - コンテンツ読み込み中の表示
 * - ユーザー体験の向上
 * - 複数タイプのプレースホルダー
 * - レイアウトシフトの防止
 */

import React from 'react';

interface SkeletonLoaderProps {
  type?: 'card' | 'text' | 'circle' | 'image';
  count?: number;
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  type = 'card', 
  count = 1,
  className = ''
}) => {
  
  const renderSkeleton = () => {
    switch (type) {
      case 'text':
        return (
          <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`}></div>
        );
      case 'circle':
        return (
          <div className={`rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`}></div>
        );
      case 'image':
        return (
          <div className={`aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse ${className}`}></div>
        );
      case 'card':
      default:
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-4 p-4">
            <div className="flex items-center mb-4">
              {/* プロフィール画像スケルトン */}
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
              
              <div className="ml-3 flex-1">
                {/* ユーザー名スケルトン */}
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2 animate-pulse"></div>
                {/* 日時スケルトン */}
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
              </div>
            </div>
            
            {/* コンテンツスケルトン */}
            <div className="space-y-2 mb-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/6"></div>
            </div>
            
            {/* 動画スケルトン */}
            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-3 animate-pulse"></div>
            
            {/* エンゲージメントスケルトン */}
            <div className="flex items-center mt-4">
              <div className="flex space-x-4">
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      {Array(count).fill(0).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </>
  );
};

export default SkeletonLoader;