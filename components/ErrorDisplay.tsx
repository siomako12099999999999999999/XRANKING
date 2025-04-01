/**
 * 機能概要：
 * エラー表示コンポーネント
 * 
 * 主な機能：
 * 1. エラーメッセージの表示
 * 2. カスタムタイトルとメッセージ
 * 3. 再試行ボタンの提供
 * 4. 視覚的なエラー表現
 * 
 * 用途：
 * - API通信エラーの表示
 * - ユーザーフレンドリーなエラー通知
 * - エラーからの回復オプション
 * - データ取得失敗の伝達
 */

import React from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  title = 'エラーが発生しました',
  message = 'データの読み込み中に問題が発生しました。しばらく経ってから再度お試しください。',
  onRetry
}) => {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
      <div className="flex justify-center mb-4">
        <FiAlertTriangle className="text-red-500 text-4xl" />
      </div>
      <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">{title}</h3>
      <p className="text-red-600 dark:text-red-300 mb-4">{message}</p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 bg-red-100 dark:bg-red-800 border border-red-300 dark:border-red-700 rounded-md text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
        >
          <FiRefreshCw className="mr-2" />
          再試行
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;