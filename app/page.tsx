'use client';

import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import SearchFilters from '@/components/SearchFilters';
import TweetList from '@/components/TweetList';
import Footer from '@/components/Footer';
import TweetSkeleton from '@/components/TweetSkeleton';
import ErrorMessage from '@/components/ErrorMessage';
import EmptyState from '@/components/EmptyState';
import LoadMoreButton from '@/components/LoadMoreButton';
import { Period, SortType, LoadingStatus } from '@/app/types';

export default function Home() {
  // 状態変数を定義
  const [period, setPeriod] = useState<Period>('week');
  const [sort, setSort] = useState<SortType>('likes');
  
  // 無限スクロール用のクエリを使用
  const { 
    data,
    status = 'idle' as LoadingStatus,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['tweets', period, sort],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(`/api/tweets?period=${period}&sort=${sort}&page=${pageParam}&limit=10`);
      if (!response.ok) {
        throw new Error('サーバーエラーが発生しました');
      }
      const data = await response.json();
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      // サーバーからの総数が現在の取得数より多ければ次のページがある
      const totalCount = lastPage.totalCount || 0;
      const currentCount = allPages.flatMap(page => page.tweets).length;
      return totalCount > currentCount ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: true,
  });

  // 全てのツイートをフラット化
  const tweets = data?.pages.flatMap(page => page.tweets) || [];

  // フィルター変更ハンドラー
  const handleFilterChange = (newPeriod: Period, newSort: SortType) => {
    setPeriod(newPeriod);
    setSort(newSort);
  };

  // もっと読み込むハンドラー
  const handleLoadMore = () => {
    fetchNextPage();
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              XRANKING
              <span className="block text-lg font-normal text-gray-600 dark:text-gray-300 mt-2">
                人気の動画投稿をチェック
              </span>
            </h1>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* サイドバー */}
            <div className="lg:w-1/4">
              <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">絞り込み検索</h2>
                <SearchFilters 
                  initialPeriod={period}
                  initialSort={sort}
                  onFilterChange={handleFilterChange}
                />
              </div>
            </div>
            
            {/* メインコンテンツ */}
            <div className="lg:w-3/4">
              {status === 'pending' || status === 'loading' ? (
                <TweetSkeleton count={5} />
              ) : status === 'error' ? (
                <ErrorMessage error={error as Error} onRetry={() => refetch()} />
              ) : tweets.length === 0 ? (
                <EmptyState />
              ) : (
                <>
                  <TweetList tweets={tweets} />
                  
                  {hasNextPage && (
                    <LoadMoreButton
                      onClick={handleLoadMore}
                      isLoading={isFetchingNextPage}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        
        <Footer />
      </Header>
    </main>
  );
}