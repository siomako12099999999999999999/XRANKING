/**
 * 機能概要：
 * モバイル向けビデオフィードコンポーネント
 * 
 * 主な機能：
 * 1. スナップスクロールによる全画面ビデオ表示
 * 2. 無限スクロールによるコンテンツ読み込み
 * 3. ソート順と期間の切り替え
 * 4. アクティブビデオの自動再生制御
 * 
 * 用途：
 * - モバイルデバイス向けビデオ体験の提供
 * - ソーシャルメディア風のビデオブラウジング
 * - ユーザーインタラクションの管理
 * - パフォーマンス最適化されたビデオ表示
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Period, SortType, LoadingStatus } from '@/app/types';
import Link from 'next/link';
import { useInView } from 'react-intersection-observer';

// MobileVideoFeedProps の定義
interface MobileVideoFeedProps {
  initialPeriod: Period;
  initialSort: SortType;
  onPeriodChange: (period: Period) => void;
  onSortChange: (sort: SortType) => void;
}

const MobileVideoFeed: React.FC<MobileVideoFeedProps> = ({
  initialPeriod,
  initialSort,
  onPeriodChange,
  onSortChange
}) => {
  // 状態変数
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [sort, setSort] = useState<SortType>(initialSort);
  const [activeIndex, setActiveIndex] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreToLoad, setHasMoreToLoad] = useState(true);
  
  // 状態更新時に親コンポーネントに通知
  useEffect(() => {
    onPeriodChange(period);
  }, [period, onPeriodChange]);
  
  useEffect(() => {
    onSortChange(sort);
  }, [sort, onSortChange]);

  // データ取得
  const { 
    data,
    status,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch
  } = useInfiniteQuery({
    queryKey: ['mobile-tweets', period, sort],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(`/api/tweets?period=${period}&sort=${sort}&page=${pageParam}&limit=10`);
      if (!response.ok) {
        throw new Error('データの取得に失敗しました');
      }
      return response.json();
    },
    getNextPageParam: (lastPage) => lastPage.meta.nextPage || undefined,
    initialPageParam: 1,
  });

  const tweets = data?.pages.flatMap(page => page.tweets) || [];
  
  // 無限スクロール用の交差点監視
  const [loadMoreRef, inView] = useInView({
    threshold: 0.5,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // スクロール時のアクティブインデックス更新
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        const slideHeight = window.innerHeight;
        const newIndex = Math.floor(scrollTop / slideHeight);
        
        if (newIndex !== activeIndex && newIndex >= 0 && newIndex < tweets.length) {
          setActiveIndex(newIndex);
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, [activeIndex, tweets.length]);

  // ローディング状態
  if (status === 'pending' || status === 'loading') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // エラー状態
  if (status === 'error') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black p-4">
        <div className="bg-gray-800 p-5 rounded-lg text-white text-center max-w-md">
          <h3 className="text-xl font-bold mb-3">エラーが発生しました</h3>
          <p className="mb-4">{(error as Error)?.message || 'データの読み込みに失敗しました'}</p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 rounded-lg text-white"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  // 表示するコンテンツがない場合
  if (tweets.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black p-4">
        <div className="bg-gray-800 p-5 rounded-lg text-white text-center max-w-md">
          <h3 className="text-xl font-bold mb-3">動画が見つかりませんでした</h3>
          <p className="mb-4">検索条件を変更してみてください。</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 overflow-y-scroll snap-y snap-mandatory pt-14"
      style={{ 
        scrollSnapType: 'y mandatory', 
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {tweets.map((tweet, index) => (
        <div 
          key={tweet.id} 
          className="w-full h-screen snap-start flex items-center justify-center"
        >
          <div className="relative w-full h-full bg-black">
            <video
              src={tweet.videoUrl}
              className="w-full h-full object-contain"
              loop
              muted
              playsInline
              autoPlay={index === activeIndex}
              poster={tweet.thumbnailUrl || undefined}
            />
            
            {/* 期間とソート切替ボタン */}
            <div className="absolute top-20 right-4 flex space-x-3 z-10">
              <button
                onClick={() => {
                  const periods: Period[] = ['day', 'week', 'month', 'all'];
                  const currentIndex = periods.indexOf(period);
                  setPeriod(periods[(currentIndex + 1) % periods.length]);
                }}
                className="rounded-full bg-black bg-opacity-60 px-3 py-1.5 text-white text-xs"
              >
                {period === 'day' ? '24h' : 
                 period === 'week' ? '週間' : 
                 period === 'month' ? '月間' : '全期間'}
              </button>
              
              <button
                onClick={() => {
                  const sorts: SortType[] = ['likes', 'trending', 'latest'];
                  const currentIndex = sorts.indexOf(sort);
                  setSort(sorts[(currentIndex + 1) % sorts.length]);
                }}
                className="rounded-full bg-black bg-opacity-60 px-3 py-1.5 text-white text-xs"
              >
                {sort === 'likes' ? 'いいね順' : 
                 sort === 'trending' ? 'トレンド' : '新着順'}
              </button>
            </div>
            
            {/* 動画情報 */}
            <div className="absolute bottom-10 left-4 right-4 bg-black bg-opacity-60 p-3 rounded-lg">
              <div className="flex items-center mb-2">
                {tweet.authorProfileImageUrl && (
                  <img 
                    src={tweet.authorProfileImageUrl} 
                    alt={tweet.authorName || ''} 
                    className="w-10 h-10 rounded-full mr-3"
                  />
                )}
                <div>
                  <p className="font-bold text-white">{tweet.authorName}</p>
                  <p className="text-gray-300 text-sm">@{tweet.authorUsername}</p>
                </div>
              </div>
              
              <p className="text-white mb-2 line-clamp-2">{tweet.content}</p>
              
              {tweet.originalUrl && (
                <a 
                  href={tweet.originalUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block px-3 py-1 bg-blue-600 text-white rounded text-sm"
                >
                  元のツイートを見る
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {/* 読み込み用の交差点要素 */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
          {isFetchingNextPage && (
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileVideoFeed;