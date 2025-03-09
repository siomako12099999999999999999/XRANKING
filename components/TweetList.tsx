import React from 'react';
import Link from 'next/link';
import { formatNumber, formatDate } from '../lib/utils';

interface Tweet {
  id: string;
  tweetId: string;
  content: string | null;
  videoUrl: string | null;
  likes: number;
  retweets: number;
  views: number;
  timestamp: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
}

interface TweetListProps {
  tweets: Tweet[];
}

export default function TweetList({ tweets }: TweetListProps) {
  if (!tweets || tweets.length === 0) {
    return <div className="text-center py-10">表示するツイートがありません</div>;
  }

  return (
    <div className="space-y-6">
      {tweets.map((tweet) => (
        <div key={tweet.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
          {/* ユーザー情報 */}
          <div className="flex items-center mb-3">
            <div>
              <div className="font-medium">{tweet.authorName}</div>
              <div className="text-gray-500 text-sm">@{tweet.authorUsername}</div>
            </div>
          </div>
          
          {/* ツイート内容 */}
          <p className="mb-3 text-gray-800">{tweet.content}</p>
          
          {/* 動画プレビュー */}
          {tweet.videoUrl && (
            <div className="mb-3 rounded-lg overflow-hidden bg-gray-100">
              <Link href={`https://twitter.com/${tweet.authorUsername}/status/${tweet.tweetId}`} target="_blank" rel="noopener noreferrer">
                <div className="aspect-video relative bg-black">
                  {/* 動画サムネイル/プレビュー */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* 本番環境では実際の動画を埋め込むことも可能 */}
                    <div className="flex flex-col items-center justify-center text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm opacity-80">クリックして動画を視聴</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}
          
          {/* エンゲージメント情報 */}
          <div className="flex justify-between text-gray-500 text-sm">
            <div className="flex space-x-4">
              <div>
                <span className="font-semibold text-red-600">{formatNumber(tweet.likes)}</span> いいね
              </div>
              <div>
                <span className="font-semibold text-green-600">{formatNumber(tweet.retweets)}</span> リツイート
              </div>
              <div>
                <span className="font-semibold text-blue-600">{formatNumber(tweet.views || 0)}</span> 再生
              </div>
            </div>
            <div>{formatDate(new Date(tweet.timestamp))}</div>
          </div>
          
          {/* フッター */}
          <div className="mt-2 pt-2 border-t border-gray-100 text-right">
            <Link 
              href={`https://twitter.com/${tweet.authorUsername}/status/${tweet.tweetId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              Xで開く →
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}