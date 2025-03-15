import React, { useState } from 'react';
import TwitterCard from '../../../components/TwitterCard';

interface Tweet {
  id: string;
  tweetId: string;
  content: string | null;
  videoUrl: string | null;
  processedVideoUrl?: string | null; // 処理済み動画URL
  likes: number | null;
  retweets: number | null;
  views: number | null;
  timestamp: string | Date;
  authorName?: string | null;
  authorUsername?: string | null;
  thumbnailUrl?: string | null;
}

interface TwitterCardProps {
  tweet: Tweet;
  videoUrl?: string | null;
  useProxy?: boolean;
}

// 数値を省略表記に変換（例: 1200 → 1.2K）
const formatNumber = (num: number | null): string => {
  if (!num) return '0';
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

const TwitterCard: React.FC<TwitterCardProps> = ({ tweet, videoUrl, useProxy = true }) => {
  const [expanded, setExpanded] = useState(false);

  // タイムスタンプのフォーマット
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-4">
      <div className="p-4">
        {/* ユーザー情報 */}
        <div className="flex items-center mb-3">
          {/* プロフィール画像（デフォルト） */}
          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          
          {/* ユーザー名と日時 */}
          <div className="ml-3">
            <div className="font-bold text-gray-900 dark:text-white">
              {tweet.authorName || 'ユーザー'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              @{tweet.authorUsername || 'username'} • {formatDate(tweet.timestamp)}
            </div>
          </div>
          
          {/* Xロゴ */}
          <div className="ml-auto">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-6 h-6 text-gray-500">
              <g>
                <path
                  fill="currentColor"
                  d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                ></path>
              </g>
            </svg>
          </div>
        </div>
        
        {/* ツイートコンテンツ */}
        {tweet.content && (
          <div 
            className={`text-gray-700 dark:text-gray-200 mb-3 ${expanded ? '' : 'line-clamp-3'}`}
          >
            {tweet.content}
          </div>
        )}
        
        {/* もっと見るボタン（コンテンツが長い場合） */}
        {tweet.content && tweet.content.length > 150 && (
          <button 
            className="text-blue-500 text-sm mb-3"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '閉じる' : 'もっと見る'}
          </button>
        )}
        
        {/* 動画プレーヤー */}
        {(tweet.videoUrl || videoUrl) && (
          <div className="rounded-xl overflow-hidden mb-3">
            <video 
              src={videoUrl || tweet.videoUrl}
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
        
        {/* エンゲージメント情報 */}
        <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mt-4">
          {/* いいね */}
          <div className="flex items-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {formatNumber(tweet.likes)}
          </div>
          
          {/* リツイート */}
          <div className="flex items-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            {formatNumber(tweet.retweets)}
          </div>
          
          {/* 閲覧数 */}
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {formatNumber(tweet.views)}
          </div>
          
          {/* 元ツイートへのリンク */}
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

interface TweetListProps {
  tweets: Tweet[];
  useProxy?: boolean;
}

const TweetList: React.FC<TweetListProps> = ({ tweets, useProxy = true }) => {
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

// components/SearchFilters.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SearchFiltersProps {
  initialPeriod: 'day' | 'week' | 'month' | 'all';
  initialSort: 'likes' | 'retweets' | 'views' | 'latest';
  onFilterChange: (period: string, sort: string) => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ initialPeriod, initialSort, onFilterChange }) => {
  const [period, setPeriod] = useState(initialPeriod);
  const [sort, setSort] = useState(initialSort);
  const router = useRouter();
  
  // フィルター変更時にURLも更新
  useEffect(() => {
    const newParams = new URLSearchParams();
    newParams.set('period', period);
    newParams.set('sort', sort);
    
    // URL更新（クライアントサイド）
    window.history.replaceState({}, '', `?${newParams.toString()}`);
    
    // 親コンポーネントに通知
    onFilterChange(period, sort);
  }, [period, sort, onFilterChange]);

  return (
    <div className="flex flex-wrap gap-4">
      {/* 期間選択 */}
      <div>
        <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">
          期間
        </label>
        <select
          id="period"
          value={period}
          onChange={(e) => setPeriod(e.target.value as any)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="day">24時間</option>
          <option value="week">1週間</option>
          <option value="month">1ヶ月</option>
          <option value="all">すべて</option>
        </select>
      </div>

      {/* ソート順 */}
      <div>
        <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
          並び替え
        </label>
        <select
          id="sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="likes">いいね数</option>
          <option value="retweets">リツイート数</option>
          <option value="views">視聴回数</option>
          <option value="latest">新着順</option>
        </select>
      </div>
    </div>
  );
};

export default SearchFilters;

// components/LoadingSpinner.tsx
import React from 'react';

const LoadingSpinner: React.FC<{ size?: string }> = ({ size = 'h-8 w-8' }) => {
  return (
    <div className="flex justify-center items-center">
      <div className={`animate-spin rounded-full ${size} border-t-2 border-b-2 border-blue-500`}></div>
    </div>
  );
};

export default LoadingSpinner;

// app/api/videoproxy/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // URLパラメータから元のビデオURLを取得
    const url = request.nextUrl.searchParams.get('url');
    
    if (!url) {
      return new NextResponse('URLパラメータが必要です', { status: 400 });
    }

    console.log(`動画をプロキシ中: ${url}`);

    // 動画をフェッチ
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://twitter.com/'
      }
    });

    if (!response.ok) {
      console.error(`動画のフェッチに失敗: ${response.status} ${response.statusText}`);
      return new NextResponse('動画の取得に失敗しました', { status: response.status });
    }

    // レスポンスヘッダーを設定
    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('Content-Type') || 'video/mp4');
    headers.set('Content-Length', response.headers.get('Content-Length') || '');
    headers.set('Access-Control-Allow-Origin', '*'); // すべてのオリジンからのアクセスを許可
    headers.set('Cache-Control', 'public, max-age=86400'); // 24時間キャッシュ

    // ストリームとしてレスポンスを返す
    return new NextResponse(response.body, {
      status: 200,
      headers: headers
    });
  } catch (error) {
    console.error('プロキシエラー:', error);
    return new NextResponse('内部サーバーエラー', { status: 500 });
  }
}