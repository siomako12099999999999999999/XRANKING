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
