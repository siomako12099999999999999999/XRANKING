'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { TwitterTweetEmbed } from 'react-twitter-embed';

interface Tweet {
  id: string;
  likes: number;
  retweets: number;
  views: number;
  content: string | null;
  videoUrl: string | null;
  timestamp: string;
}

export default function TweetList() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTweets = async () => {
      try {
        const { data } = await axios.get('/api/tweets?limit=100'); // 100件に増やす
        console.log('API応答:', data);  // 詳細なデバッグログ追加
        if (Array.isArray(data.tweets)) {
          setTweets(data.tweets);
        } else {
          setError('APIからのデータ形式が不正です');
        }
      } catch (err) {
        setError(err.message || 'エラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTweets();
  }, []);

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  if (error) {
    return <div>エラーが発生しました: {error}</div>;
  }

  if (!tweets || tweets.length === 0) {
    return <div>ツイートが見つかりませんでした。</div>;
  }

  return (
    <div className="space-y-4">
      {tweets.map((tweet) => {
        const tweetId = tweet.videoUrl?.split('/').pop();
        console.log('Tweet ID:', tweetId);  // Tweet IDのデバッグログ
        return (
          <div key={tweet.id} className="border p-4 rounded-lg">
            {tweet.videoUrl && tweetId && (
              <>
                <p>動画URL: {tweet.videoUrl}</p>  {/* 動画URLのデバッグログ */}
                <TwitterTweetEmbed tweetId={tweetId} />
              </>
            )}
            <div className="mt-2 space-x-4">
              <span>👍 {tweet.likes}</span>
              <span>🔄 {tweet.retweets}</span>
              <span>👀 {tweet.views}</span>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {new Date(tweet.timestamp).toLocaleString('ja-JP')}
            </div>
          </div>
        );
      })}
    </div>
  );
}