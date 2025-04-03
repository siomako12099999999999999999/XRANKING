/**
 * 機能概要：
 * ローディングスピナーコンポーネント
 * 
 * 主な機能：
 * 1. スピナーアニメーション表示
 * 2. サイズのカスタマイズ
 * 3. カラーのカスタマイズ
 * 4. アクセシビリティ対応
 * 
 * 用途：
 * - 処理中の視覚的フィードバック
 * - 非同期操作の進行状況表示
 * - ユーザー体験の向上
 * - シンプルなローディングインジケータ
 */

import React from 'react';

export interface LoadingSpinnerProps {
  size?: string;
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'h-5 w-5',
  color = 'border-white'
}) => {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-t-transparent ${size} ${color}`}
      role="status"
      aria-label="読み込み中"
    />
  );
};

export default LoadingSpinner;