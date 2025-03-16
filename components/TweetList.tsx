import React from 'react';
import VideoPlayer from './VideoPlayer';
import { FaTwitter } from 'react-icons/fa'; // Twitterアイコンをインポート

interface Tweet {
  id: string;
  tweetId: string; // tweetIdを追加
  content: string;
  videoUrl: string;
  likes: number;
  retweets: number;
  views: number;
  authorName: string;
  authorUsername: string;
  authorProfileImageUrl: string;
  timestamp: string;
}

interface TweetListProps {
  tweets: Tweet[];
}

const TweetList: React.FC<TweetListProps> = ({ tweets }) => {
  if (!tweets || tweets.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500 dark:text-gray-400">
          動画が見つかりませんでした
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {tweets.map((tweet) => (
        <div key={tweet.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          {/* ユーザー情報とX投稿リンク */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3">
              {tweet.authorProfileImageUrl ? (
                <img
                  src={tweet.authorProfileImageUrl}
                  alt={tweet.authorName || ''}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <span className="text-gray-600 dark:text-gray-300 font-bold">{tweet.authorName?.charAt(0) || '?'}</span>
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {tweet.authorName || 'Unknown User'}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  @{tweet.authorUsername || 'unknown'}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {new Date(tweet.timestamp).toLocaleDateString('ja-JP')}
                </p>
              </div>
            </div>
            
            {/* X投稿へのリンク */}
            {tweet.tweetId && (
              <a 
                href={`https://twitter.com/${tweet.authorUsername}/status/${tweet.tweetId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                aria-label="Twitterで見る"
              >
                <FaTwitter className="w-5 h-5" />
                <span className="ml-1 text-sm hidden sm:inline">Xで見る</span>
              </a>
            )}
          </div>

          {/* ツイート本文 */}
          {tweet.content && (
            <p className="text-gray-600 dark:text-gray-300 mb-3 whitespace-pre-line">
              {tweet.content}
            </p>
          )}

          {/* 動画プレーヤー */}
          {tweet.videoUrl && (
            <div className="mt-2 mb-3">
              <VideoPlayer
                videoUrl={tweet.videoUrl}
                className="rounded-lg overflow-hidden"
                initialMuted={true}
                preload="metadata"
              />
            </div>
          )}

          {/* エンゲージメント情報 */}
          <div className="flex items-center space-x-6 mt-3 text-gray-500 dark:text-gray-400 text-sm">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {formatNumber(tweet.likes)}
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              {formatNumber(tweet.retweets)}
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {formatNumber(tweet.views)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// 数値のフォーマット（1000 -> 1K）
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export default TweetList;