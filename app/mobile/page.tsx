'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation'; // useSearchParamsを追加
import { FaChevronLeft, FaHeart, FaRetweet, FaEye, FaVolumeUp, FaVolumeMute, FaPlay, FaPause, FaCog } from 'react-icons/fa';
import { ProcessedTweet } from '@/types/tweet';
import LoadingSpinner from '@/components/LoadingSpinner';
import MobileHeader from '@/components/MobileHeader';
import TweetSkeleton from '@/components/TweetSkeleton';
import { ProxySettingPanel } from '@/components/ProxySettingPanel';

// ソート順と期間のオプション
const sortOptions = [
  { value: 'likes', label: 'いいね数' },
  { value: 'trending', label: 'トレンド' },
  { value: 'latest', label: '最新' }
];

const periodOptions = [
  { value: 'day', label: '今日' },
  { value: 'week', label: '週間' },
  { value: 'month', label: '月間' }
];

export default function MobileView() {
  const searchParams = useSearchParams();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [useProxy, setUseProxy] = useState<boolean>(() => {
    // ローカルストレージから設定を取得（デフォルトはtrue）
    if (typeof window !== 'undefined') {
      const savedSetting = localStorage.getItem('useProxyMode');
      return savedSetting !== null ? savedSetting === 'true' : true;
    }
    return true;
  });
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false); // 追加: 再生/停止の状態
  const [showGuide, setShowGuide] = useState(true);
  const [showControls, setShowControls] = useState(false); // 追加: コントロールの表示状態
  // 長押し検出用の状態と変数を追加
  const [showSettings, setShowSettings] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  
  // ソート順と期間の状態管理
  const [sort, setSort] = useState(searchParams.get('sort') || 'likes');
  const [period, setPeriod] = useState(searchParams.get('period') || 'week');
  
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const wheelDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null); // 追加: コントロール表示用タイマー
  const router = useRouter();

  // プロキシのロード状態を追加
  const [proxyLoading, setProxyLoading] = useState<Record<string, boolean>>({});
  const [proxyTimeout, setProxyTimeout] = useState<Record<string, boolean>>({});

  // メイン画面に戻る関数
  const goBack = () => {
    router.push('/');
  };

  // 動画URLを適切に変換する関数を最適化
  const getVideoUrl = (tweet: ProcessedTweet): string | null => {
    // videoUrl または video_url のいずれかが存在するか確認
    const originalUrl = tweet.videoUrl || tweet.video_url;
    if (!originalUrl) return null;

    // 直接URLが存在し、プロキシがタイムアウトした場合は直接URLを返す
    const directUrl = tweet.direct_video_url; // 修正: directVideoUrl → direct_video_url
    if (directUrl && proxyTimeout[tweet.id]) {
      console.log(`Using direct URL for ${tweet.id} due to proxy timeout`);
      return directUrl;
    }
    
    // プロキシモードの場合
    if (useProxy) {
      // プロキシURL（例: /api/proxy?url=エンコードされたURL）
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(originalUrl)}`;
      
      // プロキシURLを返す前にロード状態を設定
      if (!proxyLoading[tweet.id]) {
        setProxyLoading((prev: Record<string, boolean>) => ({ ...prev, [tweet.id]: true }));
        
        // プロキシタイムアウトを5秒に延長（パフォーマンス改善）
        setTimeout(() => {
          // 5秒後にも読み込み中であればタイムアウト処理
          if (proxyLoading[tweet.id]) {
            console.log(`Proxy loading timeout for ${tweet.id}`);
            setProxyTimeout((prev: Record<string, boolean>) => ({ ...prev, [tweet.id]: true }));
          }
        }, 5000);
      }
      
      return proxyUrl;
    }
    
    // プロキシを使わない場合は直接URLまたは元のURL
    return directUrl || originalUrl;
  };

  // 動画読み込みイベントの追加
  const handleVideoLoad = (id: string) => {
    setProxyLoading((prev: Record<string, boolean>) => ({ ...prev, [id]: false }));
  };

  // データ取得関数
  const fetchTweets = async ({ pageParam = 1 }) => {
    const response = await fetch(`/api/tweets?page=${pageParam}&limit=10&sort=${sort}&period=${period}`);
    if (!response.ok) {
      throw new Error('ツイートの取得に失敗しました');
    }
    return response.json();
  };
  
  // 無限スクロールクエリ
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
    refetch, // 追加: データの再取得用
    isFetching // 追加: データ取得中の状態
  } = useInfiniteQuery({
    queryKey: ['mobile-tweets', sort, period], // sortとperiodを依存関係に追加
    queryFn: fetchTweets,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.page < lastPage.meta.pageCount) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1
  });
  
  // 全てのツイートを処理済みデータに変換
  const tweets: ProcessedTweet[] = data?.pages.flatMap(page => 
    page.tweets.map((tweet: any) => ({
      ...tweet,
      processedVideoUrl: getVideoUrl(tweet)
    }))
  ) || [];

  // タッチイベントのハンドラー
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    
    // 長押し検出タイマー
    isLongPress.current = false;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setShowSettings(true);
    }, 800); // 0.8秒の長押しで設定パネル表示
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // 長押しタイマーをクリア
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    // 長押し検出された場合はスワイプ処理をスキップ
    if (isLongPress.current) {
      isLongPress.current = false;
      return;
    }
    
    if (touchStartY.current === null) return;
    
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    
    // 50px以上のスワイプを検出
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // 上にスワイプ - 次の動画へ
        handleNextVideo();
      } else {
        // 下にスワイプ - 前の動画へ
        handlePrevVideo();
      }
      
      // スワイプが行われたらガイドを非表示に
      if (showGuide) {
        setShowGuide(false);
      }
    }
    
    touchStartY.current = null;
  };

  // マウスホイールイベント用のハンドラー
  const handleWheel = (e: React.WheelEvent) => {
    // ホイールイベントをdebounceして処理する
    if (wheelDebounceTimer.current) {
      clearTimeout(wheelDebounceTimer.current);
    }
    
    wheelDebounceTimer.current = setTimeout(() => {
      // 下方向へのスクロール（正の値）は次の動画へ
      if (e.deltaY > 0) {
        handleNextVideo();
      }
      // 上方向へのスクロール（負の値）は前の動画へ
      else if (e.deltaY < 0) {
        handlePrevVideo();
      }
      
      // スクロールが行われたらガイドを非表示に
      if (showGuide) {
        setShowGuide(false);
      }
    }, 50); // 50msのデバウンス
  };

  // 画面タップ・クリック時のハンドラー
const handleScreenTap = (e: React.MouseEvent) => {
  // 現在のビデオ要素を取得
  const currentVideo = tweets.length > 0 && tweets[currentIndex] 
    ? videoRefs.current[tweets[currentIndex].id] 
    : null;

  if (currentVideo) {
    if (!isPaused) {
      // 再生中なら一時停止
      currentVideo.pause();
      setIsPaused(true); // 状態を一時停止に更新
    } else {
      // 停止中なら再生再開（現在の再生位置を保持）
      currentVideo.play()
        .then(() => setIsPaused(false)) // 再生成功時に状態を更新
        .catch(err => console.error('再生エラー:', err));
    }
  }

  // コントロール表示の処理
  setShowControls(true);

  // コントロールの自動非表示タイマー
  if (controlsTimeoutRef.current) {
    clearTimeout(controlsTimeoutRef.current);
  }

  controlsTimeoutRef.current = setTimeout(() => {
    setShowControls(false);
  }, 3000); // 3秒後に非表示

  // ガイド表示を非表示に
  if (showGuide) {
    setShowGuide(false);
  }
};

  // 動画の再生/一時停止を切り替える関数を修正
const togglePlayPause = () => {
  setIsPaused(!isPaused);
  
  if (tweets.length > 0 && tweets[currentIndex]) {
    const videoElement = videoRefs.current[tweets[currentIndex].id];
    if (videoElement) {
      if (isPaused) {
        // 一時停止状態から再生再開（位置はそのまま）
        videoElement.play().catch(err => console.error('再生エラー:', err));
      } else {
        // 再生中から一時停止
        videoElement.pause();
      }
    }
  }
};

  // ソート順と期間を変更する関数
  const handleSortChange = (newSort: string) => {
    if (newSort === sort) return; // 同じソート順なら何もしない
    
    // ソート順変更時にインジケーターを表示
    setSortChangeIndicator(true);
    setTimeout(() => setSortChangeIndicator(false), 1500);
    
    // ソート順を更新
    setSort(newSort);
    setCurrentIndex(0); // 先頭に戻す
    
    // URLを更新
    const newParams = new URLSearchParams(window.location.search);
    newParams.set('sort', newSort);
    window.history.replaceState(
      null, 
      '', 
      `${window.location.pathname}?${newParams.toString()}`
    );
  };
  
  const handlePeriodChange = (newPeriod: string) => {
    if (newPeriod === period) return; // 同じ期間なら何もしない
    
    // 期間変更時にインジケーターを表示
    setSortChangeIndicator(true);
    setTimeout(() => setSortChangeIndicator(false), 1500);
    
    // 期間を更新
    setPeriod(newPeriod);
    setCurrentIndex(0); // 先頭に戻す
    
    // URLを更新
    const newParams = new URLSearchParams(window.location.search);
    newParams.set('period', newPeriod);
    window.history.replaceState(
      null, 
      '', 
      `${window.location.pathname}?${newParams.toString()}`
    );
  };

  // ソート変更インジケーター用のstate
  const [sortChangeIndicator, setSortChangeIndicator] = useState(false);

  // 次/前の動画に移動する関数
  const handleNextVideo = () => {
    if (currentIndex < tweets.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (hasNextPage && !isFetchingNextPage) {
      // 最後まで到達したら次のページを読み込む
      fetchNextPage().then(() => {
        // 次のページのデータが読み込まれたら、インデックスを更新
        setCurrentIndex(currentIndex + 1);
      });
    }
  };

  const handlePrevVideo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // キーボード操作のサポート
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        handlePrevVideo();
        if (showGuide) setShowGuide(false);
      } else if (e.key === 'ArrowDown') {
        handleNextVideo();
        if (showGuide) setShowGuide(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, tweets.length, showGuide]);

  // 現在の動画が変更されたら自動再生する処理も修正
  const previousIndex = useRef<number>(currentIndex);

  useEffect(() => {
    if (tweets.length > 0 && tweets[currentIndex]) {
      const videoId = tweets[currentIndex].id;
      const videoElement = videoRefs.current[videoId];

      if (videoElement) {
        const prevVideoId = tweets[previousIndex.current]?.id;
        const isNewVideo = prevVideoId !== videoId;

        if (isNewVideo) {
          videoElement.currentTime = 0;
        }

        if (!isPaused) {
          videoElement.play().catch((err: Error) => console.error('再生エラー:', err));
        }
      }

      Object.entries(videoRefs.current).forEach(([id, video]) => {
        if (id !== videoId && video) {
          video.pause();
        }
      });

      previousIndex.current = currentIndex;
    }
  }, [currentIndex, tweets, isPaused]);

// プリロード用の関数を改善
const preloadNextVideos = () => {
  // 現在位置から先の2〜3動画をプリロード
  for (let i = 1; i <= 2; i++) {
    const nextIndex = currentIndex + i;
    
    if (nextIndex < tweets.length) {
      const nextTweet = tweets[nextIndex];
      const videoUrl = getVideoUrl(nextTweet);
      
      if (videoUrl) {
        // プリロード用の要素を作成
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = videoUrl;
        link.as = 'video';
        document.head.appendChild(link);
        
        // 10秒後に不要なプリロードを削除して帯域幅を節約
        setTimeout(() => {
          document.head.removeChild(link);
        }, 10000);
        
        console.log(`Preloading video ${i} ahead (ID: ${nextTweet.id})`);
      }
    }
  }
};

// 現在の動画が変更されたときに次の動画をプリロード
useEffect(() => {
  if (tweets.length > 0) {
    const timeoutId = setTimeout(() => {
      preloadNextVideos();
    }, 300); // 0.3秒後に開始（すばやくプリロードを開始）
    
    return () => clearTimeout(timeoutId);
  }
}, [currentIndex, tweets]);

  // ソート順や期間が変更されたときにデータを再取得
  useEffect(() => {
    refetch();
  }, [sort, period, refetch]);

  // ミュート状態の切り替え
  const toggleMute = () => {
    setIsMuted(!isMuted);
    
    if (tweets.length > 0) {
      const currentVideo = videoRefs.current[tweets[currentIndex].id];
      if (currentVideo) {
        currentVideo.muted = !isMuted;
      }
    }
  };

  // スクロール位置をリセットする
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [currentIndex]);

  // ガイドを5秒後に自動的に非表示にする
  useEffect(() => {
    if (showGuide) {
      const timer = setTimeout(() => {
        setShowGuide(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [showGuide]);

  // コンポーネントがアンマウントされるときにタイマーをクリア
  useEffect(() => {
    return () => {
      if (wheelDebounceTimer.current) {
        clearTimeout(wheelDebounceTimer.current);
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  // タイムアウト後に自動的に直接モードに切り替える
  useEffect(() => {
    Object.entries(proxyTimeout).forEach(([id, hasTimedOut]) => {
      if (hasTimedOut && tweets.find(t => t.id === id)) {
        // タイムアウトした動画に対して警告を表示
        console.warn(`動画ID ${id} のプロキシロードがタイムアウトしました。直接URLに切り替えます。`);
      }
    });
  }, [proxyTimeout, tweets]);

  // 設定パネルを閉じる関数
  const closeSettings = () => {
    setShowSettings(false);
  };

  // useProxyの値が変わったときにlocalStorageに保存
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('useProxyMode', useProxy.toString());
    }
  }, [useProxy]);

  // URLからソート順と期間を取得するロジックを強化
  useEffect(() => {
    // URLから取得したパラメータを適用
    const sortParam = searchParams.get('sort');
    const periodParam = searchParams.get('period');
    
    if (sortParam && ['likes', 'trending', 'latest'].includes(sortParam)) {
      setSort(sortParam);
    }
    
    if (periodParam && ['day', 'week', 'month'].includes(periodParam)) {
      setPeriod(periodParam);
    }
  }, [searchParams]);

  // 現在表示中のツイート
  const currentTweet = tweets[currentIndex];

  // 一番上までスクロールする関数（ヘッダークリック時用）
  const scrollToTop = () => {
    setCurrentIndex(0);
  };

  // まず、新しいstateを追加
  const [progress, setProgress] = useState(0);

  // 動画の再生進捗を更新する関数を追加
  const handleTimeUpdate = (videoElement: HTMLVideoElement) => {
    const progress = (videoElement.currentTime / videoElement.duration) * 100;
    setProgress(progress);
  };

  // 動画のシーク処理を追加
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const currentVideo = tweets[currentIndex] ? 
      videoRefs.current[tweets[currentIndex].id] : null;
    
    if (currentVideo) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = x / rect.width;
      currentVideo.currentTime = currentVideo.duration * percent;
    }
  };

  // 動画コンテナの位置をヘッダーの下に調整
  return (
    <div className="fixed inset-0 bg-black">
      {/* ヘッダー */}
      <MobileHeader 
        currentSort={sort}
        currentPeriod={period}
        onSortChange={handleSortChange}
        onPeriodChange={handlePeriodChange}
      />

      {/* 基本コントロール - ヘッダーの下に配置するよう位置調整 */}
      <div className="absolute top-24 right-4 z-40 flex space-x-2">
        {/* 音量トグル */}
        <button
          onClick={toggleMute}
          className="text-white p-2 rounded-full bg-black bg-opacity-50"
          aria-label={isMuted ? "ミュート解除" : "ミュート"}
        >
          {isMuted ? <FaVolumeMute className="h-6 w-6" /> : <FaVolumeUp className="h-6 w-6" />}
        </button>
        
        {/* 再生/一時停止ボタン */}
        <button
          onClick={togglePlayPause}
          className="text-white p-2 rounded-full bg-black bg-opacity-50"
          aria-label={isPaused ? "再生" : "一時停止"}
        >
          {isPaused ? <FaPlay className="h-6 w-6" /> : <FaPause className="h-6 w-6" />}
        </button>

        {/* 設定を表示するトリガーボタンをヘッダーに追加 */}
        <button
          onClick={() => setShowSettings(true)}
          className="text-white p-2 rounded-full bg-black bg-opacity-50"
          aria-label="動画設定"
        >
          <FaCog className="h-5 w-5" />
        </button>
      </div>

      {/* ソート変更インジケーター */}
      {sortChangeIndicator && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-black bg-opacity-70 text-white text-lg font-medium px-6 py-4 rounded-xl animate-fade-in">
            {sortOptions.find(o => o.value === sort)?.label} / 
            {periodOptions.find(o => o.value === period)?.label}に変更
          </div>
        </div>
      )}

      {/* レンダリング部分での条件分岐 */}
      {status === 'pending' || (isFetching && currentIndex === 0) ? (
        <div className="h-full w-full overflow-hidden pt-20">
          <TweetSkeleton />
        </div>
      ) : status === 'error' ? (
        <div className="flex items-center justify-center h-full flex-col p-4">
          <div className="text-center text-white">
            <p className="text-xl mb-4">エラーが発生しました</p>
            <p className="text-red-400 mb-4">{(error as Error).message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 rounded-md"
            >
              再読み込み
            </button>
          </div>
        </div>
      ) : tweets.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-white">表示できる動画がありません</p>
        </div>
      ) : (
        <div
          className="h-full w-full overflow-hidden pt-20" // ヘッダー分のパディングを適切に設定
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          onClick={handleScreenTap}
        >
          {tweets.map((tweet, index) => {
            const videoUrl = getVideoUrl(tweet);
            const thumbnailUrl = tweet.thumbnail_url || '';
            
            return (
              <div
                key={tweet.id}
                className={`h-full w-full absolute transition-opacity duration-300 ${
                  index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                {/* 読み込み中の改善されたプレースホルダー表示 */}
                {thumbnailUrl && proxyLoading[tweet.id] && (
                  <div 
                    className="absolute inset-0 bg-center bg-no-repeat bg-cover" 
                    style={{ 
                      backgroundImage: `url(${thumbnailUrl})`,
                      backgroundSize: 'cover'
                    }}
                  >
                    {/* ぼかしオーバーレイ */}
                    <div className="absolute inset-0 backdrop-blur-md bg-black bg-opacity-30 flex items-center justify-center">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-white text-sm">動画を読み込み中...</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {videoUrl && (
                  <>
                    <video
                      ref={(el) => { videoRefs.current[tweet.id] = el; }}
                      src={videoUrl}
                      className="h-full w-full object-contain bg-black"
                      loop
                      playsInline
                      muted={isMuted}
                      autoPlay={!isPaused && index === currentIndex}
                      onLoadedData={() => handleVideoLoad(tweet.id)}
                      onTimeUpdate={(e) => handleTimeUpdate(e.currentTarget)}
                    />
                    {/* シークバーを常時表示に変更 */}
                    {index === currentIndex && (
                      <div 
                        className="absolute bottom-20 left-0 right-0 px-4 z-20"
                        onClick={(e) => e.stopPropagation()} 
                      >
                        <div 
                          className="w-full h-1.5 bg-gray-600/30 rounded-full cursor-pointer hover:bg-gray-500/40 transition-colors"
                          onClick={handleSeek}
                        >
                          <div 
                            className="h-full bg-white/80 hover:bg白 rounded-full transition-all duration-100"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        {/* 進捗表示も常時表示 */}
                        <div className="text-white/80 text-xs mt-2 text-center">
                          {Math.floor(progress)}%
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {/* 動画メタデータ表示部分 */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent pb-8 pt-20 px-4">
                  {/* 既存のコード */}
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {/* 次のページ読み込み中インジケーター */}
      {isFetchingNextPage && (
        <div className="absolute bottom-4 right-4 z-50">
          <LoadingSpinner size="h-8 w-8" />
        </div>
      )}
      
      {/* スワイプガイド（初回とタイマーが切れるまで表示） */}
      {showGuide && (
        <div className="absolute inset-x-0 bottom-24 flex flex-col items-center space-y-2 pointer-events-none">
          <div className="bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm animate-pulse">
            上下にスワイプして動画を切り替え
          </div>
          <div className="bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm">
            画面タップで再生/一時停止と設定
          </div>
        </div>
      )}

      {/* PCユーザー向けガイド表示 */}
      {showGuide && (
        <div className="absolute bottom-36 inset-x-0 flex justify-center pointer-events-none md:block hidden">
          <div className="bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm">
            マウスホイールでも動画を切り替えできます
          </div>
        </div>
      )}

      {/* 設定パネル呼び出し */}
      <ProxySettingPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        // ↓ 必要なstateや変数を渡す
        proxyLoading={proxyLoading}
        setProxyLoading={setProxyLoading}
        proxyTimeout={proxyTimeout}
        setProxyTimeout={setProxyTimeout}
        useProxy={useProxy}
        setUseProxy={setUseProxy}
      />
    </div>
  );
}