'use client';

import { useEffect, useRef, useState } from 'react';
import { Tweet } from '@prisma/client';

interface TweetCardProps {
  tweet: Tweet;
}

export default function TweetCard({ tweet }: TweetCardProps) {
  const tweetRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTweet = async () => {
      if (window.twttr && tweetRef.current) {
        const tweetId = tweet.videoUrl.match(/status\/(\d+)/)?.[1];
        if (tweetId) {
          try {
            setIsLoading(true);
            await window.twttr.widgets.createTweet(tweetId, tweetRef.current, {
              theme: 'light',
              align: 'center',
              conversation: 'none',
              width: '100%',
              cards: 'visible'
            });
          } finally {
            setIsLoading(false);
          }
        }
      }
    };

    loadTweet();
  }, [tweet.videoUrl]);

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg border shadow-sm hover:shadow-lg transition-all">
      <div className="p-4">
        {isLoading && (
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 min-h-[300px] rounded-lg" />
        )}
        <div 
          ref={tweetRef} 
          className={`min-h-[300px] w-full ${isLoading ? 'hidden' : 'block'}`}
        />
        <div className="flex justify-between mt-4 text-sm text-gray-600 dark:text-gray-400 font-medium">
          <span title="いいね" className="flex items-center space-x-1">
            <span>👍</span>
            <span>{tweet.likes.toLocaleString()}</span>
          </span>
          <span title="視聴回数" className="flex items-center space-x-1">
            <span>👀</span>
            <span>{tweet.views.toLocaleString()}</span>
          </span>
        </div>
        <a 
          href={tweet.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 text-xs text-blue-500 hover:text-blue-600 hover:underline block"
        >
          元の投稿を見る
        </a>
      </div>
    </div>
  );
}