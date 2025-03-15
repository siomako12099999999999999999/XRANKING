'use client'

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
import SearchFilters from '../components/SearchFilters';
import TweetList from '../components/TweetList';
import LoadingSpinner from '../components/LoadingSpinner';

// 実際のデータベーススキーマに基づくインターフェース
interface Tweet {
  id: string;
  tweetId: string; // tweetIdは必要です（APIのURLに使用）
  content: string | null;
  videoUrl: string | null;
  likes: number | string;
  retweets: number | string;
  views: number | string;
  timestamp: string;
  authorId?: string;
  authorName?: string;
  authorUsername?: string;
  // その他データベースに存在するフィールド
  createdAt?: string;
  updatedAt?: string;
}

interface TweetsResponse {
  tweets: Tweet[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pageCount: number;
  };
}

export default function Home() {
  const searchParams = useSearchParams();
  const [period, setPeriod] = useState(searchParams.get('period') || 'week');
  const [sort, setSort] = useState(searchParams.get('sort') || 'likes');
  const [useProxy, setUseProxy] = useState(true); // デフォルトでプロキシを使用

  // 動画URLを適切に変換する関数
  const getVideoUrl = (tweet: Tweet) => {
    if (!tweet.videoUrl) return null;
    
    // video.twimg.com形式のURLの場合はプロキシを使用
    if (useProxy && tweet.videoUrl.includes('video.twimg.com')) {
      return `/api/videoproxy?url=${encodeURIComponent(tweet.videoUrl)}`;
    }
    
    // それ以外のURLはそのまま返す
    return tweet.videoUrl;
  };

  const fetchTweets = async ({ pageParam = 1 }) => {
    const params = new URLSearchParams({
      page: pageParam.toString(),
      limit: '10',
      period: period,
      sort: sort
    });
    
    try {
      // 実際のAPIを使用
      const res = await fetch(`/api/tweets?${params}`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'ツイートの取得に失敗しました');
      }
      
      return res.json() as Promise<TweetsResponse>;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  };

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['tweets', period, sort],
    queryFn: fetchTweets,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.page < lastPage.meta.pageCount) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const handleFilterChange = (newPeriod: string, newSort: string) => {
    setPeriod(newPeriod);
    setSort(newSort);
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // すべてのページからツイートを結合し、必要に応じてURLを変換
  const tweets = data?.pages.flatMap(page => 
    page.tweets.map(tweet => ({
      ...tweet,
      // 動画URLの変換をtweetオブジェクトに追加
      processedVideoUrl: getVideoUrl(tweet)
    }))
  ) || [];

  // プロキシ使用設定の切り替え
  const toggleProxyUsage = () => {
    setUseProxy(!useProxy);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">XRANKING - 動画ツイートランキング</h1>
      
      <div className="mb-4 flex justify-between items-center">
        <SearchFilters 
          initialPeriod={period as any} 
          initialSort={sort as any}
          onFilterChange={handleFilterChange}
        />

        {/* プロキシ切り替え（開発/デバッグ用） */}
        <div className="flex items-center">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={useProxy}
              onChange={toggleProxyUsage}
            />
            <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
              動画プロキシ使用
            </span>
          </label>
        </div>
      </div>

      {status === 'pending' ? (
        <div className="py-10">
          <LoadingSpinner />
        </div>
      ) : status === 'error' ? (
        <div className="text-center py-10 text-red-500">
          エラーが発生しました: {(error as Error).message}
        </div>
      ) : tweets.length === 0 ? (
        <div className="text-center py-10">
          条件に一致するツイートがありません
        </div>
      ) : (
        <>
          <TweetList tweets={tweets} useProxy={useProxy} />
          
          {hasNextPage && (
            <div className="mt-8 text-center">
              <button
                onClick={handleLoadMore}
                disabled={isFetchingNextPage}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {isFetchingNextPage ? (
                  <span className="flex items-center justify-center">
                    <LoadingSpinner />
                    <span className="ml-2">読み込み中...</span>
                  </span>
                ) : (
                  'もっと見る'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}