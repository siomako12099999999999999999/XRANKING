import React from 'react';
import Link from 'next/link';
import { formatNumber, formatDate } from '../lib/utils';
import TwitterCard from './TwitterCard';

interface Tweet {
  id: string;
  tweetId: string;
  content: string | null;
  videoUrl: string | null;
  processedVideoUrl: string | null; // 処理済み動画URL
  likes: number | string;
  retweets: number | string;
  views: number | string;
  timestamp: string;
  authorName?: string;
  authorUsername?: string;
}

interface TweetListProps {
  tweets: Tweet[];
  useProxy?: boolean;
}

const TweetList = ({ tweets, useProxy = true }: TweetListProps) => {
  if (!tweets || tweets.length === 0) {
    return <div className="text-center py-10">表示するツイートがありません</div>;
  }

  return (
    <div className="space-y-4">
      {tweets.map((tweet) => (
        <TwitterCard 
          key={tweet.id} 
          tweet={tweet} 
          videoUrl={tweet.processedVideoUrl || tweet.videoUrl}
          useProxy={useProxy}
        />
      ))}
    </div>
  );
};

export default TweetList;