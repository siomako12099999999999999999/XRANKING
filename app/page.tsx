'use client';

import React, { useState, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import TwitterCard from '@/components/TwitterCard';
import LoadingSpinner from '@/components/LoadingSpinner';

// APIレスポンスの型定義
interface TweetResponse {
  tweets: Array<{
    id: string;
    tweetId: string;
    content: string;
    videoUrl: string;
    likes: number;
    retweets: number;
    views: number;
    timestamp: string;
    authorName?: string;
    authorUsername?: string;
    thumbnailUrl?: string;
  }>;
  meta: {
    page: number;
    pageCount: number;
    totalItems: number;
  };
}

// ツイート取得関数
const fetchTweets = async ({ 
  pageParam = 1, 
  period = 'week', 
  sort = 'likes' 
}): Promise<TweetResponse> => {
  const response = await fetch(`/api/tweets?page=${pageParam}&limit=10&period=${period}&sort=${sort}`);
  
  if (!response.ok) {
    throw new Error('ツイートの取得中にエラーが発生しました');
  }
  
  return response.json();
};

export default function Home() {
  const [period, setPeriod] = useState<string>('week');
  const [sort, setSort] = useState<string>('likes');
  
  // 無限スクロールの設定
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    status,
    refetch 
  } = useInfiniteQuery({
    queryKey: ['tweets', period, sort],
    queryFn: ({ pageParam = 1 }) => fetchTweets({ pageParam, period, sort }),
    getNextPageParam: (lastPage: TweetResponse) => {
      if (lastPage.meta.page < lastPage.meta.pageCount) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
  
  // フィルターが変わったらリフェッチ
  useEffect(() => {
    refetch();
  }, [period, sort, refetch]);
  
  // スクロール検出
  useEffect(() => {
    const handleScroll = () => {
      // 画面の下端から100px以内にスクロールしたら次のページを読み込む
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">XRanking - 人気動画</h1>
      
      {/* フィルターセクション */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
        {/* 期間選択 */}
        <div className="space-x-2">
          <span className="text-gray-700 dark:text-gray-300">期間:</span>
          <select
            className="border rounded-md px-2 py-1 bg-white dark:bg-gray-800"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="day">24時間</option>
            <option value="week">1週間</option>
            <option value="month">1ヶ月</option>
            <option value="all">すべて</option>
          </select>
        </div>
        
        {/* ソート順 */}
        <div className="space-x-2">
          <span className="text-gray-700 dark:text-gray-300">並び替え:</span>
          <select
            className="border rounded-md px-2 py-1 bg-white dark:bg-gray-800"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="likes">いいね数</option>
            <option value="retweets">リツイート数</option>
            <option value="views">視聴回数</option>
            <option value="latest">新着順</option>
          </select>
        </div>
      </div>
      
      {/* ステータス表示 */}
      {status === 'pending' && <LoadingSpinner />}
      
      {status === 'error' && (
        <div className="text-center text-red-500 py-8">
          データの読み込み中にエラーが発生しました。お手数ですが、ページを再読み込みしてください。
        </div>
      )}
      
      {/* ツイート一覧 */}
      <div className="space-y-4">
        {status === 'success' && data.pages.map((page, i) => (
          <React.Fragment key={i}>
            {page.tweets.map((tweet) => (
              <TwitterCard key={tweet.id} tweet={tweet} />
            ))}
          </React.Fragment>
        ))}
        
        {/* 無限スクロール中のローディング表示 */}
        {isFetchingNextPage && (
          <div className="py-4 text-center">
            <LoadingSpinner />
          </div>
        )}
        
        {/* データがない場合 */}
        {status === 'success' && data.pages[0].tweets.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            データがありません。別の期間を選択してみてください。
          </div>
        )}
      </div>
    </div>
  );
}