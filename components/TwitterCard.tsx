import React, { useState } from 'react';

// ツイートの型定義
interface Tweet {
  id: string;
  tweetId: string;
  content: string | null;
  videoUrl: string | null;
  likes: number | null;
  retweets: number | null;
  views: number | null;
  timestamp: string | Date;
  authorName?: string | null;
  authorUsername?: string | null;
  thumbnailUrl?: string | null;
}

// コンポーネントのProps型定義
interface TwitterCardProps {
  tweet: Tweet;
  videoUrl?: string | null;
  useProxy?: boolean;
}

// 数値を省略表記に変換する関数
const formatNumber = (num: number | null): string => {
  if (num === null) return '0';
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

// TwitterCardコンポーネント
const TwitterCard: React.FC<TwitterCardProps> = ({ tweet, videoUrl, useProxy = true }) => {
  const [expanded, setExpanded] = useState(false);

  // 日付をフォーマットする関数
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // JSXを返す
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-4">
      <div className="p-4">
        <div className="flex items-center mb-3">
          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          
          <div className="ml-3">
            <div className="font-bold text-gray-900 dark:text-white">
              {tweet.authorName || 'ユーザー'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              @{tweet.authorUsername || 'username'} • {formatDate(tweet.timestamp)}
            </div>
          </div>
          
          <div className="ml-auto">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-6 h-6 text-gray-500">
              <g>
                <path
                  fill="currentColor"
                  d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                />
              </g>
            </svg>
          </div>
        </div>
        
        {tweet.content && (
          <div 
            className={`text-gray-700 dark:text-gray-200 mb-3 ${expanded ? '' : 'line-clamp-3'}`}
          >
            {tweet.content}
          </div>
        )}
        
        {tweet.content && tweet.content.length > 150 && (
          <button 
            className="text-blue-500 text-sm mb-3"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '閉じる' : 'もっと見る'}
          </button>
        )}
        
        {(tweet.videoUrl || videoUrl) && (
          <div className="rounded-xl overflow-hidden mb-3">
            <video 
              src={videoUrl || tweet.videoUrl || ''}
              controls
              preload="metadata"
              className="w-full max-h-[500px] object-contain"
              poster={tweet.thumbnailUrl || undefined}
              onError={(e) => {
                console.error("動画読み込みエラー:", e);
              }}
            />
          </div>
        )}
        
        <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mt-4">
          <div className="flex items-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {formatNumber(tweet.likes)}
          </div>
          
          <div className="flex items-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            {formatNumber(tweet.retweets)}
          </div>
          
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {formatNumber(tweet.views)}
          </div>
          
          <div className="ml-auto">
            <a 
              href={`https://twitter.com/user/status/${tweet.tweetId}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              元ツイート
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwitterCard;