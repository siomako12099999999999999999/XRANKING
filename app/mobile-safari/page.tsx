'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { FaCalendarAlt, FaSort, FaChevronDown, FaHome, FaHeart, FaRetweet, FaEye, FaTwitter, FaUser, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import Link from 'next/link';
import { Period, SortType, LoadingStatus, Tweet } from '@/app/types';
import { formatNumber, formatDate } from '@/lib/utils';
import { useInView } from 'react-intersection-observer';

// ヘッダーなしのシンプルなタイトル表示（オプション）
const MobileMinimalHeader = () => {
  // ヘッダーを完全に削除
  return null;
};

// フィルターバーコンポーネントの型定義
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

// モバイル用フィルターバー
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

  return (
    <div className="fixed top-0 left-0 right-0 z-20 bg-black bg-opacity-50 backdrop-blur-sm safe-top">
      <div className="flex justify-center px-4 py-2 text-sm">
        <div className="flex space-x-2">
          {/* 期間フィルター */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPeriodOpen(!isPeriodOpen);
                if (isSortOpen) setIsSortOpen(false);
              }}
              // filter-buttonクラスを追加して、クリックハンドラがこれを識別できるようにする
              className="filter-button flex items-center py-1.5 px-3 rounded-full bg-white bg-opacity-20 text-white"
            >
              <span className="mr-1">📅</span>
              <span>{getPeriodLabel(period)}</span>
              <span className={`ml-1 transform transition-transform ${isPeriodOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {isPeriodOpen && (
              <div className="dropdown-menu absolute top-full left-0 mt-1 w-36 bg-gray-800 rounded-md shadow-lg overflow-hidden z-30">
                <div className="py-1">
                  <button 
                    onClick={() => {
                      setPeriod('day');
                      setIsPeriodOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${period === 'day' ? 'bg-blue-500 text-white' : 'text-white hover:bg-gray-700'}`}
                  >
                    24時間
                  </button>
                  <button 
                    onClick={() => {
                      setPeriod('week');
                      setIsPeriodOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${period === 'week' ? 'bg-blue-500 text-white' : 'text-white hover:bg-gray-700'}`}
                  >
                    週間
                  </button>
                  <button 
                    onClick={() => {
                      setPeriod('month');
                      setIsPeriodOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${period === 'month' ? 'bg-blue-500 text-white' : 'text-white hover:bg-gray-700'}`}
                  >
                    月間
                  </button>
                  <button 
                    onClick={() => {
                      setPeriod('all');
                      setIsPeriodOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${period === 'all' ? 'bg-blue-500 text-white' : 'text-white hover:bg-gray-700'}`}
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
                if (isPeriodOpen) setIsPeriodOpen(false);
              }}
              // filter-buttonクラスを追加
              className="filter-button flex items-center py-1.5 px-3 rounded-full bg-white bg-opacity-20 text-white"
            >
              <span className="mr-1">🔄</span>
              <span>{getSortLabel(sort)}</span>
              <span className={`ml-1 transform transition-transform ${isSortOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {isSortOpen && (
              <div className="dropdown-menu absolute top-full right-0 mt-1 w-36 bg-gray-800 rounded-md shadow-lg overflow-hidden z-30">
                <div className="py-1">
                  <button 
                    onClick={() => {
                      setSort('likes');
                      setIsSortOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${sort === 'likes' ? 'bg-blue-500 text-white' : 'text-white hover:bg-gray-700'}`}
                  >
                    いいね数
                  </button>
                  <button 
                    onClick={() => {
                      setSort('trending');
                      setIsSortOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${sort === 'trending' ? 'bg-blue-500 text-white' : 'text-white hover:bg-gray-700'}`}
                  >
                    トレンド
                  </button>
                  <button 
                    onClick={() => {
                      setSort('latest');
                      setIsSortOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${sort === 'latest' ? 'bg-blue-500 text-white' : 'text-white hover:bg-gray-700'}`}
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

// メインページコンポーネント - Safari最適化版
export default function MobileSafariPage() {
  const [period, setPeriod] = useState<Period>('month');
  const [sort, setSort] = useState<SortType>('likes');
  const [initialLimit, setInitialLimit] = useState(6);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const [autoplaySucceeded, setAutoplaySucceeded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // クライアントサイドでのみ実行
    const style = document.createElement('style');
    style.textContent = `
      .scrollbar-hide {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;     /* Firefox */
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;             /* Chrome, Safari, Opera */
      }
    `;
    document.head.appendChild(style);

    // クリーンアップ関数
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const detectUserInteraction = () => {
      setUserHasInteracted(true);
    };

    document.addEventListener('touchstart', detectUserInteraction, { once: true });
    document.addEventListener('click', detectUserInteraction, { once: true });

    return () => {
      document.removeEventListener('touchstart', detectUserInteraction);
      document.removeEventListener('click', detectUserInteraction);
    };
  }, []);

  useEffect(() => {
    // ドロップダウンの外側をクリックしたときに閉じる処理
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      
      // フィルターボタンをクリックした場合は何もしない
      // (ボタンのクリックイベントが別に処理されるため)
      if (target.closest('.filter-button')) {
        return;
      }
      
      // ドロップダウンメニュー内のクリックも無視
      if (target.closest('.dropdown-menu')) {
        return;
      }
      
      // それ以外の場所をクリックした場合はドロップダウンを閉じる
      setIsPeriodOpen(false);
      setIsSortOpen(false);
    };

    // イベントリスナーを追加
    document.addEventListener('click', handleClickOutside as EventListener);
    document.addEventListener('touchend', handleClickOutside as EventListener, { passive: true });
    
    return () => {
      document.removeEventListener('click', handleClickOutside as EventListener);
      document.removeEventListener('touchend', handleClickOutside as EventListener);
    };
  }, []);

  useEffect(() => {
    // documentを使用するすべての部分をuseEffect内に移動
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }
    viewportMeta.setAttribute('content', 
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
    
    // セーフエリア対応のスタイル
    const safeAreaStyle = document.createElement('style');
    safeAreaStyle.textContent = `
      :root {
        --sat: env(safe-area-inset-top);
        --sar: env(safe-area-inset-right);
        --sab: env(safe-area-inset-bottom);
        --sal: env(safe-area-inset-left);
      }
      
      /* iOS対応のためのユーティリティクラス */
      .safe-top {
        padding-top: var(--sat, 0px);
      }
      .safe-bottom {
        padding-bottom: var(--sab, 16px);
      }
      
      /* コントロールが確実に見えるようにするための固定位置調整 */
      .control-safe-top {
        top: calc(4px + var(--sat, 0px));
      }
      .control-safe-bottom {
        bottom: calc(4px + var(--sab, 16px));
      }
    `;
    document.head.appendChild(safeAreaStyle);
    
    return () => {
      document.head.removeChild(safeAreaStyle);
    };
  }, []);

  // Safariの自動再生制限回避
  const injectSafariAutoplayFix = useCallback(() => {
    const script = document.createElement('script');
    script.innerHTML = `
      // iOS Safariでの自動再生サポート
      window.addEventListener('load', function() {
        // スクロールを妨げないようにする
        function enableAutoplay(event) {
          // 直接タッチしたビデオのみを再生
          const element = document.elementFromPoint(
            event.changedTouches ? event.changedTouches[0].clientX : event.clientX,
            event.changedTouches ? event.changedTouches[0].clientY : event.clientY
          );
          
          // Element.nameではなくElement.tagNameを使用
          if (element && element.tagName === 'VIDEO') {
            const video = element;
            video.muted = true;
            video.playsInline = true;
            video.play().catch(function() {});
          }
        }
        
        // タッチイベントのみキャプチャ（パッシブに）
        document.addEventListener('touchend', enableAutoplay, { once: true, passive: true });
      });
    `;
    document.head.appendChild(script);
    
    return script;
  }, []);

  useEffect(() => {
    const script = injectSafariAutoplayFix();

    const enableAudioContext = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContext();
        
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 0.001;
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start(0);
        setTimeout(() => {
          oscillator.stop();
        }, 1);
      } catch (e) {
        console.error('オーディオコンテキスト初期化エラー:', e);
      }
    };
    
    const handleFirstTouch = () => {
      enableAudioContext();
      document.removeEventListener('touchstart', handleFirstTouch);
    };
    
    document.addEventListener('touchstart', handleFirstTouch);
    
    return () => {
      if (script.parentNode) {
        document.head.removeChild(script);
      }
      document.removeEventListener('touchstart', handleFirstTouch);
    };
  }, [injectSafariAutoplayFix]);

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

  const tweets = data?.pages.flatMap(page => page.tweets) || [];

  const handleAutoplayResult = useCallback((succeeded: boolean) => {
    setAutoplaySucceeded(succeeded);
  }, []);

  const [loadMoreRef, inView] = useInView({
    threshold: 0.5,
    triggerOnce: false,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        const slideHeight = window.innerHeight;
        const newIndex = Math.floor((scrollTop + (slideHeight / 2)) / slideHeight);

        if (newIndex !== activeIndex && newIndex >= 0 && newIndex < tweets.length) {
          setActiveIndex(newIndex);
          setUserHasInteracted(true);
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });

      const handleScrollEnd = () => {
        if (containerRef.current) {
          const currentPosition = containerRef.current.scrollTop;
          const slideHeight = window.innerHeight;
          const targetIndex = Math.round(currentPosition / slideHeight);
          const targetPosition = targetIndex * slideHeight;

          if (Math.abs(currentPosition - targetPosition) < slideHeight * 0.1) {
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
        scrollTimeout = setTimeout(handleScrollEnd, 150); 
      };

      container.addEventListener('scroll', debouncedScrollEnd, { passive: true });

      return () => {
        container.removeEventListener('scroll', handleScroll);
        container.removeEventListener('scroll', debouncedScrollEnd);
        clearTimeout(scrollTimeout);
      };
    }
  }, [activeIndex, tweets.length]);

  return (
    <>
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

      {status === 'pending' || status === 'loading' ? (
        <MobileSkeleton />
      ) : status === 'error' ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black">
          <ErrorMessage error={error as Error} onRetry={() => refetch()} />
        </div>
      ) : tweets.length === 0 ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black">
          <EmptyState />
        </div>
      ) : (
        <div 
          ref={containerRef}
          className="fixed inset-0 overflow-y-scroll snap-y snap-mandatory scrollbar-hide pb-16"
          style={{ 
            scrollSnapType: 'y mandatory', 
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 'env(safe-area-inset-bottom, 16px)',
            paddingTop: 0 // ヘッダーを削除したので上部パディングを0に
          }}
          onScroll={() => {
            if (!userHasInteracted) {
              setUserHasInteracted(true);
            }
          }}
        >
          {tweets.map((tweet, index) => (
            <div 
              key={tweet.id} 
              className="w-full h-screen snap-start snap-always flex items-center justify-center"
              style={{ scrollSnapAlign: 'start' }}
            >
              <SafariVideoCard 
                tweet={tweet} 
                rank={index + 1} 
                isInView={index === activeIndex} 
                isActive={index === activeIndex} 
                onAutoplayResult={handleAutoplayResult} 
                period={period}
                setPeriod={setPeriod}
                sort={sort}
                setSort={setSort}
              />
            </div>
          ))}
          <div ref={loadMoreRef} className="w-full h-24 flex items-center justify-center">
            {isFetchingNextPage && <MobileSkeleton />}
          </div>
        </div>
      )}
    </>
  );
}

// エラーメッセージコンポーネント
const ErrorMessage = ({ error, onRetry }: { error: Error; onRetry: () => void }) => {
  return (
    <div className="text-center p-6 bg-gray-800 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold text-red-500 mb-2">エラーが発生しました</h3>
      <p className="text-white mb-4">{error.message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
      >
        再試行
      </button>
    </div>
  );
};

// 空の状態コンポーネント
const EmptyState = () => {
  return (
    <div className="text-center p-6 bg-gray-800 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold text-white mb-2">ツイートが見つかりませんでした</h3>
      <p className="text-gray-300">検索条件を変更して再試行してください。</p>
    </div>
  );
};

// ローディングスケルトン
const MobileSkeleton = () => {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="w-24 h-24 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
    </div>
  );
};

// Safari用に最適化されたビデオカード
const SafariVideoCard: React.FC<{ 
  tweet: Tweet; 
  rank: number; 
  isInView: boolean;
  isActive: boolean;
  onAutoplayResult?: (succeeded: boolean) => void;
  period: Period;
  setPeriod: (period: Period) => void;
  sort: SortType;
  setSort: (sort: SortType) => void;
}> = ({ 
  tweet, 
  rank, 
  isInView, 
  isActive, 
  onAutoplayResult,
  period,
  setPeriod,
  sort,
  setSort
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [playAttempted, setPlayAttempted] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [iframeMode, setIframeMode] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);

  const getVideoIframeSrc = () => {
    const url = new URL(window.location.origin + '/video-player');
    url.searchParams.append('src', encodeURIComponent(tweet.videoUrl));
    url.searchParams.append('poster', encodeURIComponent(tweet.thumbnailUrl || ''));
    url.searchParams.append('autoplay', '1');
    url.searchParams.append('muted', '1');
    url.searchParams.append('loop', '1');
    url.searchParams.append('playsinline', '1');
    return url.toString();
  };

  useEffect(() => {
    if (errorCount >= 3) {
      setIframeMode(true);
    }
  }, [errorCount]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    
    const handleInteraction = (e: Event) => {
      setHasInteracted(true);
      
      if (!isPlaying && videoRef.current) {
        attemptPlayWithRetry();
      }
    };
    
    container.addEventListener('click', handleInteraction, { passive: true });
    container.addEventListener('touchend', handleInteraction, { passive: true });
    
    return () => {
      container.removeEventListener('click', handleInteraction);
      container.removeEventListener('touchend', handleInteraction);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    
    const handlePlay = () => {
      console.log('再生開始イベント検出');
      setIsPlaying(true);
    };
    
    const handlePause = () => {
      console.log('一時停止イベント検出');
      setIsPlaying(false);
    };
    
    const handleEnded = () => {
      console.log('動画終了イベント検出');
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(e => console.error('再生再開エラー:', e));
      }
    };
    
    video.addEventListener('play', handlePlay);
    video.addEventListener('playing', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    
    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('playing', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoRef.current]);

  useEffect(() => {
    if (!videoRef.current || !isActive) return;
    
    const video = videoRef.current;
    
    const handleLoadStart = () => {
      console.log('動画読み込み開始');
      setIsLoading(true);
      setLoadProgress(0);
    };
    
    const handleLoadedMetadata = () => {
      console.log('メタデータ読み込み完了');
      setLoadProgress(30);
    };
    
    const handleProgress = () => {
      if (!video || video.readyState <= 0) return;
      
      try {
        if (video.duration) {
          const buffered = video.buffered;
          let loaded = 0;
          
          if (buffered.length > 0) {
            loaded = (buffered.end(buffered.length - 1) / video.duration) * 100;
          }
          
          setLoadProgress(Math.min(100, Math.max(30, loaded)));
        }
      } catch (e) {
        console.error('バッファ計算エラー:', e);
      }
    };
    
    const handleCanPlay = () => {
      console.log('再生可能状態');
      setLoadProgress(70);
    };
    
    const handleCanPlayThrough = () => {
      console.log('バッファ十分、再生可能');
      setIsLoading(false);
      setLoadProgress(100);
      setIsVideoReady(true);
    };
    
    const handleWaiting = () => {
      console.log('バッファリング中');
      setIsLoading(true);
    };
    
    const handleSeeking = () => {
      setIsLoading(true);
    };
    
    const handleSeeked = () => {
      setIsLoading(false);
    };
    
    const handleError = (e: any) => {
      console.error('動画読み込みエラー:', e);
      setIsLoading(false);
      setErrorCount(prev => prev + 1);
      
      if (errorCount >= 2) {
        setIframeMode(true);
      }
    };
    
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('seeking', handleSeeking);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', handleError);
    
    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('seeking', handleSeeking);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
    };
  }, [videoRef.current, isActive, errorCount]);

  // isInViewが変更された時の処理
  useEffect(() => {
    if (isInView && !isPlaying && videoRef.current) {
      console.log('視野内に入ったため再生試行');
      attemptPlayWithRetry();
    }
  }, [isInView]);

  // activeIndexが変更された時の処理を追加
  useEffect(() => {
    if (isActive && videoRef.current && !isPlaying && !playAttempted) {
      console.log('アクティブになったため自動再生を試行');
      setPlayAttempted(true);
      
      // 少し遅延させて再生を試行（DOM完全ロード後）
      setTimeout(() => {
        attemptPlayWithRetry();
      }, 100);
    }
  }, [isActive, isPlaying, playAttempted]);

  const attemptPlayWithRetry = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    console.log('再生試行:', new Date().toISOString());

    try {
      // まず動画を設定
      video.pause();
      video.currentTime = 0;
      video.muted = true;
      setIsMuted(true);
      video.volume = 0;

      // iOS Safari向けの属性設定
      video.setAttribute('webkit-playsinline', 'true');
      video.setAttribute('playsinline', 'true');
      video.setAttribute('muted', 'true');
      video.setAttribute('autoplay', 'true');
      video.playsInline = true;
      
      // バックグラウンドサウンドをトリガーして自動再生ポリシーを解除
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const audioCtx = new AudioContext();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          gainNode.gain.value = 0.001; // ほぼ無音
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          oscillator.start(0);
          setTimeout(() => {
            oscillator.stop();
          }, 1);
        }
      } catch (e) {
        console.warn('オーディオコンテキスト初期化失敗:', e);
      }

      // 少し遅延させてから再生を試行
      setTimeout(() => {
        try {
          // iOS Safariで再生開始前にユーザージェスチャをシミュレート
          video.dispatchEvent(new Event('touchstart'));
          video.dispatchEvent(new Event('touchend'));
          
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              console.log('再生成功!', new Date().toISOString());
              setIsPlaying(true);
              setIsLoading(false);
              
              if (onAutoplayResult) {
                onAutoplayResult(true);
              }
            }).catch(err => {
              console.error('再生失敗:', err);
              
              // リトライ (3回まで)
              if (errorCount < 2) {
                setErrorCount(prev => prev + 1);
                console.log(`リトライ ${errorCount + 1}/3`);
                
                // 別の方法で再生を試みる
                setTimeout(() => {
                  // タッチイベントをシミュレート
                  const touchStartEvent = new Event('touchstart');
                  const touchEndEvent = new Event('touchend');
                  const clickEvent = new Event('click');
                  
                  document.dispatchEvent(touchStartEvent);
                  video.dispatchEvent(touchStartEvent);
                  video.dispatchEvent(touchEndEvent);
                  video.dispatchEvent(clickEvent);
                  
                  video.play().catch(() => {
                    if (errorCount >= 2) {
                      // 最終手段: iframeモードに切り替え
                      setIframeMode(true);
                    }
                    
                    if (onAutoplayResult) {
                      onAutoplayResult(false);
                    }
                  });
                }, 300);
              } else {
                // 3回試行しても失敗した場合はiframeモードに切り替え
                setIframeMode(true);
                
                if (onAutoplayResult) {
                  onAutoplayResult(false);
                }
              }
            });
          }
        } catch (e) {
          console.error('再生試行中のエラー:', e);
          setErrorCount(prev => prev + 1);
          
          if (errorCount >= 2) {
            setIframeMode(true);
          }
        }
      }, 200);

    } catch (e) {
      console.error('再生準備中のエラー:', e);
      setErrorCount(prev => prev + 1);
      
      if (errorCount >= 2) {
        setIframeMode(true);
      }
    }
  };

  const togglePlay = (e: React.MouseEvent) => {
    if (e.target === videoRef.current || 
        (e.target as HTMLElement).classList.contains('play-button-overlay')) {
      e.preventDefault();
    }
    
    e.stopPropagation();
    setHasInteracted(true);
    
    if (iframeMode) {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { action: isPlaying ? 'pause' : 'play' }, 
          '*'
        );
      }
      setIsPlaying(!isPlaying);
      return;
    }
    
    if (!videoRef.current) return;
    
    if (isPlaying) {
      try {
        videoRef.current.pause();
        setIsPlaying(false);
      } catch (e) {}
    } else {
      attemptPlayWithRetry();
    }
  };

  const forceInFullscreen = () => {
    if (!videoRef.current) return;

    try {
      const video = videoRef.current;
      
      // 再生状態をリセット
      setIsLoading(true);
      
      // フルスクリーン表示を試みる前に一時停止
      video.pause();
      
      // Safari特有の設定をリセット
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.playsInline = true;
      video.muted = isMuted;
      
      // フルスクリーン化を試みる（優先順位付き）
      if ((video as any).webkitEnterFullscreen) {
        // iOS Safariで最も信頼性が高い
        console.log('webkitEnterFullscreenを使用');
        (video as any).webkitEnterFullscreen();
        
        // 少し遅らせて再生を試みる
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play()
              .then(() => {
                setIsPlaying(true);
                setIsLoading(false);
              })
              .catch(e => {
                console.error('フルスクリーン後の再生失敗:', e);
                setIsLoading(false);
              });
          }
        }, 300);
      } 
      else if ((video as any).webkitRequestFullscreen) {
        // WebKit系ブラウザ用
        console.log('webkitRequestFullscreenを使用');
        (video as any).webkitRequestFullscreen();
        
        // フルスクリーン後に再生を試みる
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play()
              .then(() => {
                setIsPlaying(true);
                setIsLoading(false);
              })
              .catch(e => {
                console.error('フルスクリーン後の再生失敗:', e);
                setIsLoading(false);
              });
          }
        }, 300);
      } 
      else if (video.requestFullscreen) {
        // 標準API
        console.log('標準requestFullscreenを使用');
        video.requestFullscreen()
          .then(() => {
            // フルスクリーン成功後に再生
            if (videoRef.current) {
              videoRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(() => {});
            }
          })
          .catch(e => {
            console.error('フルスクリーン化失敗:', e);
            setIsLoading(false);
            
            // フォールバック: 通常の再生を試みる
            if (videoRef.current) {
              videoRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(() => {});
            }
          });
      } 
      else {
        // フルスクリーンAPIがない場合
        console.log('フルスクリーンAPIがありません');
        setIsLoading(false);
        
        // 通常再生を試みる
        if (videoRef.current) {
          videoRef.current.play()
            .then(() => setIsPlaying(true))
            .catch(() => {});
        }
      }
      
      // フルスクリーン終了イベント
      const handleFullscreenChange = () => {
        const isFullscreen = !!(
          document.fullscreenElement || 
          (document as any).webkitFullscreenElement || 
          (document as any).mozFullScreenElement || 
          (document as any).msFullscreenElement
        );
        
        if (!isFullscreen && videoRef.current) {
          // フルスクリーン終了時にインライン再生に戻す
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.playsInline = true;
        }
      };
      
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      
      // イベントリスナーはコンポーネントのアンマウント時にクリーンアップされるよう別のuseEffectで設定
    } catch (e) {
      console.error('フルスクリーン表示エラー:', e);
      setIsLoading(false);
    }
  };

  const handleVideoLoaded = () => {
    console.log('動画データロード完了');
    setIsLoading(false);
    setIsVideoReady(true);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black">
      {!iframeMode ? (
        <div className="absolute inset-0 flex items-center justify-center" onClick={togglePlay}>
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            loop
            muted
            playsInline
            autoPlay // 明示的にautoPlayを追加
            preload="auto"
            poster={tweet.thumbnailUrl || undefined}
            onLoadedData={handleVideoLoaded}
            onClick={(e) => {
              if (e.target === videoRef.current) {
                e.preventDefault();
                e.stopPropagation();
                togglePlay(e as any);
              }
            }}
            onTouchEnd={(e) => {
              togglePlay(e as any);
            }}
            src={tweet.videoUrl}
            {...{
              'playsinline': 'true',
              'webkit-playsinline': 'true',
              'x5-playsinline': 'true',
              'x5-video-player-type': 'h5',
              'x5-video-player-fullscreen': 'true',
              'x5-video-orientation': 'portraint',
              'autoplay': 'true', // HTMLの属性としても追加
              'muted': 'true',
            } as any}
          />
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          className="absolute inset-0 w-full h-full"
          src={getVideoIframeSrc()}
          frameBorder="0"
          allow="autoplay; fullscreen"
        />
      )}

      {/* コントロールボタン */}
      <div className="absolute top-20 right-4 flex space-x-4 z-40 pointer-events-auto">
        {/* 期間切替ボタン */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            // 現在の期間を取得してローテーションさせる
            const periods: Period[] = ['day', 'week', 'month', 'all'];
            const currentIndex = periods.indexOf(period);
            const nextIndex = (currentIndex + 1) % periods.length;
            setPeriod(periods[nextIndex]);
          }}
          className="rounded-full bg-black bg-opacity-80 p-3 shadow-lg"
          style={{
            padding: '12px',
            WebkitTapHighlightColor: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          <span className="text-white text-xs font-bold">
            {period === 'day' ? '24h' : 
            period === 'week' ? '週間' : 
            period === 'month' ? '月間' : '全期'}
          </span>
        </button>
        
        {/* ソート順切替ボタン */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            // 現在のソート順を取得してローテーションさせる
            const sortTypes: SortType[] = ['likes', 'trending', 'latest'];
            const currentIndex = sortTypes.indexOf(sort);
            const nextIndex = (currentIndex + 1) % sortTypes.length;
            setSort(sortTypes[nextIndex]);
          }}
          className="rounded-full bg-black bg-opacity-80 p-3 shadow-lg"
          style={{
            padding: '12px',
            WebkitTapHighlightColor: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          <span className="text-white text-xs font-bold">
            {sort === 'likes' ? '👍' : 
            sort === 'trending' ? '🔥' : 
            '🆕'}
          </span>
        </button>

        {/* 全画面表示ボタン */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            forceInFullscreen();
          }}
          className="rounded-full bg-black bg-opacity-80 p-3 shadow-lg"
          style={{
            padding: '12px',
            WebkitTapHighlightColor: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"></path>
          </svg>
        </button>
        
        {/* ミュートボタン */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (videoRef.current) {
              const newMutedState = !isMuted;
              videoRef.current.muted = newMutedState;
              setIsMuted(newMutedState);
            }
          }}
          className="rounded-full bg-black bg-opacity-80 p-3 shadow-lg"
          style={{
            padding: '12px',
            WebkitTapHighlightColor: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          {isMuted ? (
            <FaVolumeMute className="text-white" size={24} />
          ) : (
            <FaVolumeUp className="text-white" size={24} />
          )}
        </button>
      </div>
    </div>
  );
};
