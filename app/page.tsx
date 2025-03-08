'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
import SearchFilters from '../components/SearchFilters';
import TweetList from '../components/TweetList';
import LoadingSpinner from '../components/LoadingSpinner';

interface Tweet {
  id: string;
  tweetId: string;
  content: string;
  videoUrl: string;
  likes: number;
  retweets: number;
  views: number;
  timestamp: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorProfileImageUrl: string;
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
  const period = searchParams.get('period') || 'week';
  const sort = searchParams.get('sort') || 'likes';

  const fetchTweets = async ({ pageParam = 1 }) => {
    const params = new URLSearchParams({
      page: pageParam.toString(),
      limit: '10',
      period: period as string,
      sort: sort as string
    });
    
    try {
      const res = await fetch(`/api/tweets?${params}`);
      
      if (!res.ok) {
        // レスポンスボディを取得して詳細エラーを確認
        const errorData = await res.json();
        console.error('API Error:', errorData);
        throw new Error(`ツイートの取得に失敗しました: ${errorData.details || res.statusText}`);
      }
      
      return res.json();
    } catch (error) {
      console.error('Fetch Error:', error);
      throw error;
    }
  };

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status
  } = useInfiniteQuery<TweetsResponse>({
    queryKey: ['tweets', period, sort],
    queryFn: fetchTweets,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.page < lastPage.meta.pageCount) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1
  });

  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 300
    ) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage]);

  const allTweets = data?.pages.flatMap(page => page.tweets) || [];

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">動画ツイートランキング</h1>
      
      <SearchFilters 
        initialPeriod={period as any} 
        initialSort={sort as any} 
      />
      
      {status === 'pending' ? (
        <div className="flex justify-center my-10">
          <LoadingSpinner />
        </div>
      ) : status === 'error' ? (
        <div className="text-red-500 text-center my-10">
          エラーが発生しました: {(error as Error).message}
        </div>
      ) : (
        <>
          <TweetList tweets={allTweets} />
          
          {isFetchingNextPage && (
            <div className="flex justify-center my-5">
              <LoadingSpinner />
            </div>
          )}
          
          {!hasNextPage && data?.pages[0]?.tweets.length > 0 && (
            <p className="text-center text-gray-500 my-5">
              すべてのツイートを表示しました
            </p>
          )}
          
          {data?.pages[0]?.tweets.length === 0 && (
            <p className="text-center text-gray-500 my-10">
              該当するツイートが見つかりませんでした
            </p>
          )}
        </>
      )}
    </main>
  );
}