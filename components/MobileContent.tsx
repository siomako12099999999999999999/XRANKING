'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import ErrorMessage from '@/components/ErrorMessage';
import EmptyState from '@/components/EmptyState';
import { Period, SortType, LoadingStatus, Tweet } from '@/app/types';
import { FaCalendarAlt, FaSort, FaChevronDown, FaHome, FaHeart, FaRetweet, FaEye, FaTwitter, FaUser, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import Link from 'next/link';
import { formatNumber, formatDate } from '@/lib/utils';
import { useInView } from 'react-intersection-observer';

// モバイル用のシンプルなナビゲーションバー
const MobileNavBar = () => {
  return (
    <div className="fixed top-0 left-0 right-0 bg-black bg-opacity-30 backdrop-blur-sm z-30">
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">XRANKING</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-white">
            <FaHome size={20} />
          </Link>
        </div>
      </div>
    </div>
  );
};

// MobileFilterBarコンポーネントの型定義
type MobileFilterBarProps = {
  period: Period;
  sort: SortType;
  isPeriodOpen: boolean;
  isSortOpen: boolean;
  setPeriod: (period: Period) => void;
  setSort: (sort: SortType) => void;
  setIsPeriodOpen: (isOpen: boolean) => void;
  setIsSortOpen: (isOpen: boolean) => void;
};

// モバイル用フィルターバー（上部に固定）
const MobileFilterBar: React.FC<MobileFilterBarProps> = ({ 
  period, 
  sort, 
  isPeriodOpen, 
  isSortOpen,
  setPeriod, 
  setSort, 
  setIsPeriodOpen, 
  setIsSortOpen 
}) => {
  const getPeriodLabel = (p: Period) => {
    switch (p) {
      case 'day': return '24時間';
      case 'week': return '週間';
      case 'month': return '月間';
      default: return '全期間';
    }
  };

  const getSortLabel = (s: SortType) => {
    switch (s) {
      case 'likes': return 'いいね数';
      case 'trending': return 'トレンド';
      case 'latest': return '新着';
      default: return 'いいね数';
    }
  };

  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
    setIsPeriodOpen(false);
  };

  const handleSortChange = (newSort: SortType) => {
    setSort(newSort);
    setIsSortOpen(false);
  };

  return (
    <div className="fixed top-14 left-0 right-0 z-20 bg-black bg-opacity-30 backdrop-blur-sm">
      <div className="flex justify-center px-4 py-2 text-sm">
        <div className="flex space-x-2">
          {/* 期間フィルター */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPeriodOpen(!isPeriodOpen);
                setIsSortOpen(false);
              }}
              className="flex items-center space-x-1 py-1.5 px-3 rounded-full bg-white bg-opacity-20 text-white"
            >
              <FaCalendarAlt className="text-white mr-1" />
              <span>{getPeriodLabel(period)}</span>
              <FaChevronDown className={`text-white ml-1 transform transition-transform ${isPeriodOpen ? 'rotate-180' : ''}`} />
            </button>

            {isPeriodOpen && (
              <div className="absolute top-full left-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden border border-gray-200 dark:border-gray-600 z-20">
                <div className="py-1">
                  <button 
                    onClick={() => handlePeriodChange('day')}
                    className={`block w-full text-left px-4 py-2 text-sm ${period === 'day' ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    24時間
                  </button>
                  <button 
                    onClick={() => handlePeriodChange('week')}
                    className={`block w-full text-left px-4 py-2 text-sm ${period === 'week' ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    週間
                  </button>
                  <button 
                    onClick={() => handlePeriodChange('month')}
                    className={`block w-full text-left px-4 py-2 text-sm ${period === 'month' ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    月間
                  </button>
                  <button 
                    onClick={() => handlePeriodChange('all')}
                    className={`block w-full text-left px-4 py-2 text-sm ${period === 'all' ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    全期間
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ソートフィルター */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsSortOpen(!isSortOpen);
                setIsPeriodOpen(false);
              }}
              className="flex items-center space-x-1 py-1.5 px-3 rounded-full bg-white bg-opacity-20 text-white"
            >
              <FaSort className="text-white mr-1" />
              <span>{getSortLabel(sort)}</span>
              <FaChevronDown className={`text-white ml-1 transform transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSortOpen && (
              <div className="absolute top-full right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden border border-gray-200 dark:border-gray-600 z-20">
                <div className="py-1">
                  <button 
                    onClick={() => handleSortChange('likes')}
                    className={`block w-full text-left px-4 py-2 text-sm ${sort === 'likes' ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    いいね数
                  </button>
                  <button 
                    onClick={() => handleSortChange('trending')}
                    className={`block w-full text-left px-4 py-2 text-sm ${sort === 'trending' ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    トレンド
                  </button>
                  <button 
                    onClick={() => handleSortChange('latest')}
                    className={`block w-full text-left px-4 py-2 text-sm ${sort === 'latest' ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    新着
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// TikTok風のフルスクリーン動画カード
const FullscreenVideoCard: React.FC<{ 
  tweet: Tweet; 
  rank: number; 
  isInView: boolean;
  isActive: boolean;
}> = ({ tweet, rank, isInView, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [userPaused, setUserPaused] = useState(false);  // ユーザーが明示的に停止したかのフラグ
  
  // 動画のロード完了イベント
  const handleVideoLoaded = () => {
    setIsVideoReady(true);
  };
  
  // 画面に表示されたら再生、表示されなくなったら停止
  useEffect(() => {
    if (videoRef.current && isVideoReady) {
      if (isActive) {
        // ユーザーが明示的に停止していない場合のみ自動再生
        if (!userPaused) {
          videoRef.current.play().then(() => {
            setIsPlaying(true);
          }).catch(err => {
            console.log('自動再生エラー:', err);
          });
        }
      } else {
        // 画面外に出たら必ず停止
        videoRef.current.pause();
        setIsPlaying(false);
        // 次に表示されたときに再生できるようにユーザー停止フラグをリセット
        setUserPaused(false);
      }
    }
  }, [isActive, isVideoReady, userPaused]);
  
  // 新しい動画に切り替わったときにユーザー停止フラグをリセット
  useEffect(() => {
    if (isActive && !isInView) {
      setUserPaused(false);
    }
  }, [isActive, isInView]);
  
  // 動画のクリックイベント - 再生/停止を切り替え
  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      setUserPaused(true);  // ユーザーが明示的に停止した
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        setUserPaused(false);  // ユーザーが明示的に再生した
      }).catch(err => {
        console.log('再生エラー:', err);
      });
    }
  };

  // 動画のミュート切り替え
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  // 元ツイートURLを取得
  const getOriginalUrl = () => {
    if (tweet.originalUrl) return tweet.originalUrl;
    
    // tweetIdがあれば、標準的なTwitter/XのURLを生成
    if (tweet.tweetId && tweet.authorUsername) {
      return `https://twitter.com/${tweet.authorUsername}/status/${tweet.tweetId}`;
    }
    
    return null;
  };
  
  const originalUrl = getOriginalUrl();

  return (
    <div className="relative w-full h-full bg-black">
      {/* 動画 */}
      <div className="absolute inset-0 flex items-center justify-center" onClick={togglePlay}>
        <video
          ref={videoRef}
          src={tweet.videoUrl}
          className="w-full h-full object-contain"
          loop
          muted={isMuted}
          playsInline
          preload="auto"
          poster={tweet.thumbnailUrl || undefined}
          onLoadedData={handleVideoLoaded}
        />
        
        {/* 再生状態インジケータ - 再生中は非表示 / 停止中は表示 */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
            <div className="rounded-full bg-white bg-opacity-70 w-16 h-16 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="black">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>
      
      {/* ランク表示 */}
      <div className="absolute top-20 left-4 z-10 bg-blue-500 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-lg">
        {rank}
      </div>
      
      {/* オーバーレイコントロール（右側） */}
      <div className="absolute bottom-20 right-4 flex flex-col items-center space-y-4 z-10">
        {/* 再生/停止ボタン */}
        <button 
          onClick={togglePlay} 
          className="w-10 h-10 rounded-full bg-black bg-opacity-50 flex items-center justify-center text-white"
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          )}
        </button>
        
        {/* ミュートボタン */}
        <button 
          onClick={toggleMute} 
          className="w-10 h-10 rounded-full bg-black bg-opacity-50 flex items-center justify-center text-white"
        >
          {isMuted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
        </button>
        
        {/* 元ツイートへのリンク */}
        {originalUrl && (
          <a 
            href={originalUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <FaTwitter size={20} />
          </a>
        )}
        
        {/* いいね数表示 */}
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-black bg-opacity-50 flex items-center justify-center text-white">
            <FaHeart size={20} className="text-red-500" />
          </div>
          <span className="text-white text-xs mt-1 font-semibold">{formatNumber(tweet.likes)}</span>
        </div>
        
        {/* リツイート数表示 */}
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-black bg-opacity-50 flex items-center justify-center text-white">
            <FaRetweet size={20} className="text-green-400" />
          </div>
          <span className="text-white text-xs mt-1 font-semibold">{formatNumber(tweet.retweets)}</span>
        </div>
        
        {/* 閲覧数表示 */}
        {tweet.views > 0 && (
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-black bg-opacity-50 flex items-center justify-center text-white">
              <FaEye size={20} className="text-blue-400" />
            </div>
            <span className="text-white text-xs mt-1 font-semibold">{formatNumber(tweet.views)}</span>
          </div>
        )}
      </div>
      
      {/* 下部情報表示 */}
      <div className="absolute bottom-4 left-4 right-16 z-10">
        {/* ユーザー情報 */}
        <div className="flex items-center mb-2">
          {tweet.authorProfileImageUrl ? (
            <img 
              src={tweet.authorProfileImageUrl} 
              alt={tweet.authorName || 'ユーザー'}
              className="w-10 h-10 rounded-full border-2 border-white mr-3"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-400 border-2 border-white mr-3 flex items-center justify-center">
              <FaUser className="text-white" />
            </div>
          )}
          <div>
            <h3 className="font-bold text-white">
              {tweet.authorName || 'Unknown'}
            </h3>
            <p className="text-xs text-gray-200">
              @{tweet.authorUsername || 'unknown'}
            </p>
          </div>
        </div>
        
        {/* 投稿内容 */}
        <p className="text-white text-sm mb-2 line-clamp-2">
          {tweet.content || ''}
        </p>
        
        {/* 投稿日時 */}
        <p className="text-xs text-gray-300">
          {formatDate(tweet.timestamp)}
        </p>
      </div>
    </div>
  );
};

// モバイル用ローディングスケルトン
const MobileSkeleton = () => {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="w-24 h-24 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
    </div>
  );
};

const MobileContent: React.FC = () => {
  const [period, setPeriod] = useState<Period>('month');
  const [sort, setSort] = useState<SortType>('likes');
  const [initialLimit, setInitialLimit] = useState(6);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // スクロール制御のための参照
  const containerRef = useRef<HTMLDivElement>(null);

  // ドロップダウンを閉じるためのクリックハンドラー
  useEffect(() => {
    const handleClickOutside = () => {
      setIsPeriodOpen(false);
      setIsSortOpen(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // API取得
  const { 
    data,
    status = 'idle' as LoadingStatus,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['mobile-tweets', period, sort, initialLimit],
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
  });

  // 全てのツイートをフラット化
  const tweets = data?.pages.flatMap(page => page.tweets) || [];

  // スクロール処理の改善
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        const slideHeight = window.innerHeight;
        const newIndex = Math.floor((scrollTop + (slideHeight / 2)) / slideHeight);
        
        if (newIndex !== activeIndex && newIndex >= 0 && newIndex < tweets.length) {
          setActiveIndex(newIndex);
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      
      // スクロール終了時に動画を中央にスナップさせる
      const handleScrollEnd = () => {
        if (containerRef.current) {
          const currentPosition = containerRef.current.scrollTop;
          const slideHeight = window.innerHeight;
          const targetIndex = Math.round(currentPosition / slideHeight);
          const targetPosition = targetIndex * slideHeight;
          
          // 現在位置と目標位置が近い場合のみスムーズスクロール
          if (Math.abs(currentPosition - targetPosition) < slideHeight * 0.3) {
            containerRef.current.scrollTo({
              top: targetPosition,
              behavior: 'smooth'
            });
          }
        }
      };
      
      let scrollTimeout: NodeJS.Timeout;
      const debouncedScrollEnd = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(handleScrollEnd, 100);
      };
      
      container.addEventListener('scroll', debouncedScrollEnd);
      
      return () => {
        container.removeEventListener('scroll', handleScroll);
        container.removeEventListener('scroll', debouncedScrollEnd);
        clearTimeout(scrollTimeout);
      };
    }
  }, [activeIndex, tweets.length]);

  // 最後の動画が表示されたら次のページを読み込む
  const [loadMoreRef, inView] = useInView({
    threshold: 0.5,
    triggerOnce: false,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <>
      {/* モバイル用ナビゲーションバー */}
      <MobileNavBar />
      
      {/* フィルターバー */}
      <MobileFilterBar 
        period={period}
        sort={sort}
        isPeriodOpen={isPeriodOpen}
        isSortOpen={isSortOpen}
        setPeriod={setPeriod}
        setSort={setSort}
        setIsPeriodOpen={setIsPeriodOpen}
        setIsSortOpen={setIsSortOpen}
      />
      
      {/* メインコンテンツ */}
      {status === 'pending' || status === 'loading' ? (
        <MobileSkeleton />
      ) : status === 'error' ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black pt-16">
          <ErrorMessage error={error as Error} onRetry={() => refetch()} />
        </div>
      ) : tweets.length === 0 ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black pt-16">
          <EmptyState />
        </div>
      ) : (
        <div 
          ref={containerRef}
          className="fixed inset-0 overflow-y-scroll snap-y snap-mandatory scrollbar-hide pt-24 pb-0"
          style={{ 
            scrollSnapType: 'y mandatory', 
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {tweets.map((tweet, index) => (
            <div 
              key={tweet.id} 
              className="w-full h-screen snap-start snap-always flex items-center justify-center"
              style={{ scrollSnapAlign: 'start' }}
            >
              <FullscreenVideoCard 
                tweet={tweet} 
                rank={index + 1} 
                isInView={index === activeIndex} 
                isActive={index === activeIndex}
              />
            </div>
          ))}
          
          {/* 読み込み検出用の要素 */}
          {hasNextPage && (
            <div 
              ref={loadMoreRef} 
              className="h-20 flex items-center justify-center text-white"
            >
              {isFetchingNextPage ? (
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <p className="text-sm">下にスワイプして次の動画を読み込む</p>
              )}
            </div>
          )}
          
          {/* 全てのコンテンツを表示した場合 */}
          {!hasNextPage && tweets.length > 0 && (
            <div className="h-20 flex items-center justify-center text-white">
              <p className="text-sm">すべての動画を読み込みました</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default MobileContent;