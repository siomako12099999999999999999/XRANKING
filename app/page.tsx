'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';

import Footer from '@/components/Footer';
import TweetList from '@/components/TweetList';
import SearchFilters from '@/components/SearchFilters';
import LoadingSpinner from '@/components/LoadingSpinner';

// 型定義をインポート
import { Tweet, ProcessedTweet, TweetsResponse } from '@/types/tweet';

export default function Home() {
  const searchParams = useSearchParams();
  
  // デフォルト値とクエリパラメータから値を取得
  const defaultSort = 'likes';
  const defaultPeriod = 'week';
  
  const [sort, setSort] = useState(searchParams.get('sort') || defaultSort);
  const [period, setPeriod] = useState(searchParams.get('period') || defaultPeriod);
  const [useProxy, setUseProxy] = useState(true);

  const toggleProxyUsage = () => {
    setUseProxy(prev => !prev);
  };

  const handleFilterChange = (type: string, value: string) => {
    if (type === 'sort') {
      setSort(value);
    } else if (type === 'period') {
      setPeriod(value);
    }
  };
  
  // 動画URLを適切に変換する関数
  const getVideoUrl = (tweet: Tweet): string | null => {
    if (!tweet.videoUrl) return null;
    
    // video.twimg.com形式のURLの場合はプロキシを使用
    if (useProxy && tweet.videoUrl.includes('video.twimg.com')) {
      return `/api/videoproxy?url=${encodeURIComponent(tweet.videoUrl)}`;
    }
    
    // それ以外のURLはそのまま返す
    return tweet.videoUrl;
  };

  // データ取得関数
  const fetchTweets = async ({ pageParam = 1 }): Promise<TweetsResponse> => {
    const response = await fetch(`/api/tweets?page=${pageParam}&limit=10&sort=${sort}&period=${period}`);
    if (!response.ok) {
      throw new Error('ツイートの取得に失敗しました');
    }
    return response.json();
  };
  
  // 無限スクロールのクエリ設定
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error
  } = useInfiniteQuery({
    queryKey: ['tweets', sort, period],
    queryFn: fetchTweets,
    getNextPageParam: (lastPage: TweetsResponse) => {
      if (lastPage.meta.page < lastPage.meta.pageCount) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1
  });
  
  // 全てのツイートを結合し、動画URLを処理
  const tweets: ProcessedTweet[] = data?.pages.flatMap(page => 
    page.tweets.map((tweet: Tweet) => ({
      ...tweet,
      processedVideoUrl: getVideoUrl(tweet),
      text: tweet.content ?? "", 
      authorProfileImageUrl: "", 
      mediaCount: 0,             
      mediaType: "",              
      authorName: tweet.authorName ?? "",
      authorUsername: tweet.authorUsername ?? "",
      createdAt: tweet.createdAt ?? new Date().toISOString(), // createdAtが未定義の場合は現在時刻を使用
      videoUrl: tweet.videoUrl ?? "",  // nullの場合は空文字列に変換
      likes: tweet.likes ?? 0,  // nullの場合は0に変換
      retweets: tweet.retweets ?? 0,  // 必要に応じて追加
    }))
  ) || [];
  
  const handleLoadMore = () => {
    fetchNextPage();
  };
  
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
          {/* サイドバー: デスクトップでは左側に表示 */}
          <div className="lg:w-1/4">
            <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">絞り込み検索</h2>
              <SearchFilters 
                initialPeriod={period as any} 
                initialSort={sort as any}
                onFilterChange={handleFilterChange}
              />
              
              {/* プロキシ切り替えはデバッグパネルとして下部に配置 */}
              <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">詳細設定</h3>
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
            </div>
          </div>
          
          {/* メインコンテンツ */}
          <div className="lg:w-3/4">
            {status === 'pending' ? (
              <div className="py-10 flex justify-center">
                <LoadingSpinner size="h-12 w-12" />
              </div>
            ) : status === 'error' ? (
              <div className="text-center py-10 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">エラーが発生しました</h2>
                <p className="text-red-600 dark:text-red-400">{(error as Error).message}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  再読み込み
                </button>
              </div>
            ) : tweets.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-1">条件に一致する投稿がありません</h2>
                <p className="text-gray-500 dark:text-gray-400">検索条件を変更して再試行してください</p>
              </div>
            ) : (
              <>
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/20">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <span className="font-medium">{tweets.length}件</span>の動画投稿を表示中
                    </p>
                  </div>
                </div>
                
                <TweetList tweets={tweets} useProxy={useProxy} />
                
                {hasNextPage && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={isFetchingNextPage}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-sm hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200"
                    >
                      {isFetchingNextPage ? (
                        <span className="flex items-center justify-center">
                          <LoadingSpinner size="h-5 w-5" />
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
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}