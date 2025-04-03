/**
 * 機能概要：
 * ツイートリストコンポーネント
 * 
 * 主な機能：
 * 1. 複数ツイートの表示
 * 2. ツイートのランキング表示
 * 3. ツイートリストのレンダリング
 * 4. ツイートカードのラッピング
 * 
 * 用途：
 * - ツイートコレクションの表示
 * - ランキング情報の提供
 * - 一貫したリスト表示
 * - コンポーネント構造の整理
 */

import React from 'react';
import TweetCard from './TweetCard';
import { Tweet } from '@/app/types';

type TweetListProps = {
  tweets: Tweet[];
};

const TweetList: React.FC<TweetListProps> = ({ tweets }) => {
  return (
    <>
      {tweets.map((tweet, index) => (
        <TweetCard 
          key={tweet.id} 
          tweet={tweet} 
          rank={index + 1} // 順位を追加（インデックスは0から始まるため+1）
        />
      ))}
    </>
  );
};

export default TweetList;
