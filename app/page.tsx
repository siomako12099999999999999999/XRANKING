'use client';

import { useState, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import Link from 'next/link';
import SearchFilters from '@/components/SearchFilters';
import TweetList from '@/components/TweetList';
import TweetSkeleton from '@/components/TweetSkeleton';
import ErrorMessage from '@/components/ErrorMessage';
import EmptyState from '@/components/EmptyState';
import LoadMoreButton from '@/components/LoadMoreButton';
import TweetCard from '@/components/TweetCard';
import { Period, SortType, LoadingStatus } from '@/app/types';
import { FaHeart, FaRetweet, FaEye, FaTrophy, FaMedal, FaTwitter, FaMobile } from 'react-icons/fa';
import { formatNumber, formatDate } from '@/lib/utils';

// 期間表示のラベルを取得する関数
const getPeriodLabel = (period: Period): string => {
  switch (period) {
    case 'day': return '24時間';
    case 'week': return '週間';
    case 'month': return '月間';
    default: return '全期間';
  }
};

// ソート順表示のラベルを取得する関数
const getSortLabel = (sort: SortType): string => {
  switch (sort) {
    case 'likes': return 'いいね数';
    case 'trending': return 'トレンド';
    case 'latest': return '新着';
    default: return 'いいね数';
  }
};

// 元ツイートURLを取得する関数（TweetCardと同様の実装）
const getOriginalUrl = (tweet: Tweet) => {
  if (tweet.originalUrl) return tweet.originalUrl;
  
  // tweetIdがあれば、標準的なTwitter/XのURLを生成
  if (tweet.tweetId && tweet.authorUsername) {
    return `https://twitter.com/${tweet.authorUsername}/status/${tweet.tweetId}`;
  }
  
  return null;
};

export default function Home() {
  // 状態変数を定義
  const [period, setPeriod] = useState<Period>('month');
  const [sort, setSort] = useState<SortType>('likes');
  const [initialLimit, setInitialLimit] = useState(20);
  
  // 画面サイズに応じた表示件数の調整
  useEffect(() => {
    const updateInitialLimit = () => {
      if (window.innerWidth >= 1440) {
        setInitialLimit(30);
      } else if (window.innerWidth >= 1024) {
        setInitialLimit(24);
      } else {
        setInitialLimit(16);
      }
    };
    
    updateInitialLimit();
    window.addEventListener('resize', updateInitialLimit);
    
    return () => {
      window.removeEventListener('resize', updateInitialLimit);
    };
  }, []);
  
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
    queryKey: ['tweets', period, sort, initialLimit],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(`/api/tweets?period=${period}&sort=${sort}&page=${pageParam}&limit=${initialLimit}`);
      if (!response.ok) {
        throw new Error('サーバーエラーが発生しました');
      }
      const data = await response.json();
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.meta) return undefined;
      return lastPage.meta.page < lastPage.meta.pageCount ? lastPage.meta.page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: true,
  });

  // 全てのツイートをフラット化
  const tweets = data?.pages.flatMap(page => page.tweets) || [];
  
  // ツイートの総数
  const totalTweets = data?.pages[0]?.meta?.total || 0;

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
    <div className="container mx-auto px-4 py-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          XRANKING
          <span className="block text-lg font-normal text-gray-600 dark:text-gray-300 mt-2">
            {getPeriodLabel(period)}ランキング（{getSortLabel(sort)}順）
          </span>
        </h1>
        {status === 'success' && totalTweets > 0 && (
          <p className="text-gray-500 dark:text-gray-400">
            総動画数: {totalTweets}件
          </p>
        )}
        
        {/* モバイル表示へのリンクボタン */}
        <div className="mt-4 flex justify-center">
          <Link 
            href="/mobile" // これは正しい// これは正しい
            className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-sm transition-colors duration-200"
          >
            <FaMobile className="mr-2" />
            モバイル版で表示
          </Link>
        </div>
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
            
            {/* 表示中の件数情報 */}
            {status === 'success' && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-semibold">{tweets.length}</span> / <span>{totalTweets}</span> 件表示中
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* メインコンテンツ */}
        <div className="lg:w-3/4">
          {status === 'pending' || status === 'loading' ? (
            <TweetSkeleton count={initialLimit} />
          ) : status === 'error' ? (
            <ErrorMessage error={error as Error} onRetry={() => refetch()} />
          ) : tweets.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* 上位3位は特別扱い */}
                {tweets.slice(0, 3).length > 0 && (
                  <div className="md:col-span-2 xl:col-span-3 mb-8">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white border-b pb-2 border-gray-200 dark:border-gray-700">
                      🏆 ランキングTOP3
                    </h2>
                    
                    {/* 1位は最も大きく表示 */}
                    {tweets.length > 0 && (
                      <div className="mb-8">
                        <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-gray-800 p-4 rounded-xl">
                          <h3 className="text-xl font-bold mb-4 text-yellow-600 dark:text-yellow-400 flex items-center">
                            <FaTrophy className="mr-2 text-yellow-500" /> 第1位
                          </h3>
                          <div className="flex flex-col md:flex-row gap-6">
                            <div className="md:w-2/3 relative aspect-video rounded-lg overflow-hidden shadow-lg">
                              <video
                                src={tweets[0].videoUrl}
                                className="w-full h-full object-cover"
                                controls
                                poster={tweets[0].thumbnailUrl || undefined}
                                preload="metadata"
                              />
                              
                              {/* Twitter遷移ボタンをビデオの右上に表示 */}
                              {tweets[0].originalUrl && (
                                <a 
                                  href={tweets[0].originalUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="absolute top-3 right-3 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-md transition-colors duration-200 flex items-center justify-center"
                                  title="元のツイートを見る"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                                  </svg>
                                </a>
                              )}
                            </div>
                            <div className="md:w-1/3 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center mb-4">
                                  {tweets[0].authorProfileImageUrl ? (
                                    <img 
                                      src={tweets[0].authorProfileImageUrl} 
                                      alt={tweets[0].authorName || 'ユーザー'}
                                      className="w-12 h-12 rounded-full mr-3 border-2 border-yellow-400"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 mr-3 border-2 border-yellow-400"></div>
                                  )}
                                  <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{tweets[0].authorName || 'Unknown'}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">@{tweets[0].authorUsername || 'unknown'}</p>
                                  </div>
                                </div>
                                <p className="text-base text-gray-800 dark:text-gray-200 mb-4 line-clamp-3">
                                  {tweets[0].content || ''}
                                </p>
                              </div>
                              <div className="flex flex-col space-y-3">
                                <div className="flex items-center space-x-6 text-base">
                                  <div className="flex items-center">
                                    <FaHeart className="mr-1 text-red-500" />
                                    <span className="font-bold">{formatNumber(tweets[0].likes)}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <FaRetweet className="mr-1 text-green-500" />
                                    <span>{formatNumber(tweets[0].retweets)}</span>
                                  </div>
                                  {tweets[0].views && (
                                    <div className="flex items-center">
                                      <FaEye className="mr-1 text-blue-400" />
                                      <span>{formatNumber(tweets[0].views)}</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* 元ツイートリンクを追加 */}
                                {getOriginalUrl(tweets[0]) && (
                                  <a 
                                    href={getOriginalUrl(tweets[0])} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm transition-colors duration-200"
                                  >
                                    <FaTwitter className="mr-2" />
                                    元のツイートを見る
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* 2位と3位は横並びで通常より少し大きく */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {tweets.slice(1, 3).map((tweet, index) => (
                        <div key={tweet.id} className={`bg-gradient-to-r ${
                          index === 0 
                            ? 'from-gray-100 to-gray-50 dark:from-gray-700/50 dark:to-gray-800' 
                            : 'from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-gray-800'
                        } p-4 rounded-xl`}>
                          <h3 className={`text-lg font-bold mb-3 flex items-center ${
                            index === 0 ? 'text-gray-600 dark:text-gray-300' : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            <FaMedal className={`mr-2 ${
                              index === 0 ? 'text-gray-400' : 'text-amber-600'
                            }`} /> 
                            {index === 0 ? '第2位' : '第3位'}
                          </h3>
                          
                          <div className="flex flex-col gap-4">
                            <div className="relative aspect-video rounded-lg overflow-hidden shadow-md">
                              <video
                                src={tweet.videoUrl}
                                className="w-full h-full object-cover"
                                controls
                                poster={tweet.thumbnailUrl || undefined}
                                preload="metadata"
                              />
                              
                              {/* Twitter遷移ボタンをビデオの右上に表示 */}
                              {tweet.originalUrl && (
                                <a 
                                  href={tweet.originalUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="absolute top-3 right-3 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-md transition-colors duration-200 flex items-center justify-center"
                                  title="元のツイートを見る"
                                >
                                  <FaTwitter size={16} />
                                </a>
                              )}
                            </div>
                            
                            <div>
                              <div className="flex items-center mb-3">
                                {tweet.authorProfileImageUrl ? (
                                  <img 
                                    src={tweet.authorProfileImageUrl} 
                                    alt={tweet.authorName || 'ユーザー'}
                                    className={`w-10 h-10 rounded-full mr-3 border-2 ${
                                      index === 0 ? 'border-gray-400' : 'border-amber-500'
                                    }`}
                                  />
                                ) : (
                                  <div className={`w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 mr-3 border-2 ${
                                    index === 0 ? 'border-gray-400' : 'border-amber-500'
                                  }`}></div>
                                )}
                                <div>
                                  <h3 className="font-bold text-gray-900 dark:text-white">{tweet.authorName || 'Unknown'}</h3>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">@{tweet.authorUsername || 'unknown'}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm mb-3">
                                <div className="flex items-center">
                                  <FaHeart className="mr-1 text-red-500" />
                                  <span className="font-bold">{formatNumber(tweet.likes)}</span>
                                </div>
                                <div className="flex items-center">
                                  <FaRetweet className="mr-1 text-green-500" />
                                  <span>{formatNumber(tweet.retweets)}</span>
                                </div>
                                {tweet.views && (
                                  <div className="flex items-center">
                                    <FaEye className="mr-1 text-blue-400" />
                                    <span>{formatNumber(tweet.views)}</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* 元ツイートへのリンクボタン */}
                              {getOriginalUrl(tweet) && (
                                <a 
                                  href={getOriginalUrl(tweet)} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center py-1.5 px-3 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-md shadow-sm transition-colors duration-200"
                                >
                                  <FaTwitter className="mr-1" />
                                  元ツイートを見る
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 4位以降 */}
                {tweets.slice(3).length > 0 && (
                  <>
                    <div className="md:col-span-2 xl:col-span-3 mb-6">
                      <h2 className="text-xl font-bold border-b pb-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                        ランキング 4位〜{tweets.length}位
                      </h2>
                    </div>
                    {tweets.slice(3).map((tweet, index) => (
                      <TweetCard key={tweet.id} tweet={tweet} rank={index + 4} />
                    ))}
                  </>
                )}
              </div>
              
              {hasNextPage && (
                <div className="mt-8 flex justify-center">
                  <LoadMoreButton
                    onClick={handleLoadMore}
                    isLoading={isFetchingNextPage}
                  />
                </div>
              )}
              
              {!hasNextPage && tweets.length > 0 && (
                <p className="text-center mt-8 text-gray-500 dark:text-gray-400">
                  すべての結果を表示しました
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}