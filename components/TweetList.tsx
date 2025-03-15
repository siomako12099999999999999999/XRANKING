import React from 'react';
import TweetCard from '../components/TweetCard'; // './TweetCard' を '../components/TweetCard' に修正

// インポートするインターフェース
import { ProcessedTweet } from '@/types/tweet';

interface TweetListProps {
  tweets: ProcessedTweet[];
  useProxy: boolean;
}

const TweetList: React.FC<TweetListProps> = ({ tweets, useProxy }) => {
  if (!tweets.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">表示できる動画がありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {tweets.map((tweet) => (
        <TweetCard 
          key={tweet.id} 
          tweet={tweet} 
          videoUrl={tweet.processedVideoUrl}
        />
      ))}
    </div>
  );
};

export default TweetList;