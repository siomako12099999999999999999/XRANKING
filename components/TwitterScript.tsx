/**
 * 機能概要：
 * Twitter埋め込みスクリプト読み込みコンポーネント
 * 
 * 主な機能：
 * 1. Twitter Widget JS APIの読み込み
 * 2. スクリプト管理（追加と削除）
 * 3. 非同期ロード処理
 * 4. コンポーネントのライフサイクル管理
 * 
 * 用途：
 * - ツイート埋め込み表示の有効化
 * - Twitterウィジェットの機能提供
 * - ページロード最適化
 * - クリーンアップ処理
 */

'use client';

import { useEffect } from 'react';

const TwitterScript = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
};

export default TwitterScript;
