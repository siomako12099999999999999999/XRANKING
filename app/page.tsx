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
  // tweetIdがないようなので削除
  content: string | null;
  videoUrl: string | null;
  likes: number | string;
  retweets: number | string;
  views: number | string;
  timestamp: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
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

  // すべてのページからツイートを結合
  const tweets = data?.pages.flatMap(page => page.tweets) || [];

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">XRANKING - 動画ツイートランキング</h1>
      
      <SearchFilters 
        initialPeriod={period as any} 
        initialSort={sort as any}
        onFilterChange={handleFilterChange}
      />

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
          <TweetList tweets={tweets} />
          
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