'use client';

import { Tweet } from '@prisma/client';
import { useEffect, useRef, useState } from 'react';

interface TweetEmbedProps {
  tweet: Tweet;
}

export default function TweetEmbed({ tweet }: TweetEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (window.twttr && containerRef.current) {
      const tweetId = tweet.videoUrl.match(/status\/(\d+)/)?.[1];
      
      if (tweetId) {
        window.twttr.widgets.createTweet(tweetId, containerRef.current, {
          theme: 'light',
          align: 'center',
          conversation: 'none', // リプライを非表示
          cards: 'visible',    // メディアカードを表示
          width: 500
        }).then(() => {
          setIsLoading(false);
        });
      }
    }
  }, [tweet.videoUrl]);

  return (
    <div className="tweet-container">
      {isLoading && <div className="tweet-skeleton" />}
      <div ref={containerRef} className="tweet-embed">
        <div className="tweet-stats">
          <span title="いいね">👍 {tweet.likes.toLocaleString()}</span>
          <span title="視聴回数">👀 {tweet.views.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}