/**
 * 機能概要：
 * モバイル向けビデオフィードページ
 * 
 * 主な機能：
 * 1. TikTok風のスワイプ動画インターフェース
 * 2. 自動再生と一時停止の制御
 * 3. 無限スクロールによるデータ読み込み
 * 4. 期間とソートのフィルタリング
 * 5. 音声のミュート/アンミュート
 * 6. フルスクリーン表示
 * 
 * 用途：
 * - モバイルに最適化された動画視聴体験
 * - パフォーマンス最適化されたビデオ表示
 * - ネイティブアプリ風の操作性提供
 * - ソーシャルメディア風のインタラクション
 */

/**
 * モバイルページのメインコンポーネント。
 * 動画の再生、一時停止、ミュート、無限スクロールなどの機能を提供します。
 * React Queryを使用してデータを取得し、パフォーマンス最適化のためにメモ化を活用しています。
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery, InfiniteQueryObserverResult } from '@tanstack/react-query';
import Link from 'next/link';
import { Period } from '@/app/types';
// 必要に応じてTweetタイプを拡張
type ExtendedTweet = {
  id: string;
  content: string;
  videoUrl: string;
  thumbnailUrl?: string;
  likes?: number;
  retweets?: number;
  authorName?: string;
  authorUsername?: string;
  authorProfileImageUrl?: string;
  originalUrl?: string;
  createdAt?: string;
  hashtags?: string[]; // hashtagsを追加
  backupVideoUrl?: string; // バックアップURLを追加
};
import { useInView } from 'react-intersection-observer';
import { FaVolumeUp, FaVolumeMute, FaRetweet, FaHeart } from 'react-icons/fa';
import { BsChevronUp, BsChevronDown, BsFullscreen } from 'react-icons/bs';
import { RiArrowLeftLine } from 'react-icons/ri';

// status型の定義を修正 - React Query v4の正確な型に合わせる
// 'loading'と'idle'を追加
export type QueryStatus = 'idle' | 'loading' | 'error' | 'success' | 'pending';

export type SortType = 'total' | 'likes' | 'trending' | 'latest'; // 'total'を追加

/**
 * ミュートボタンの固定コンポーネント。
 * ミュート状態をトグルするためのUIを提供します。
 */
function FixedMuteButton(props: { isMuted: boolean; handleMuteToggle: () => void }) {
  const { isMuted, handleMuteToggle } = props;
  return (
    <div
      className="fixed bottom-6 left-4 z-50"
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.preventDefault();
        handleMuteToggle();
      }}
    >
      <div className="w-12 h-12 rounded-full bg-black bg-opacity-70 flex items-center justify-center shadow-lg">
        {isMuted ? (
          <FaVolumeMute size={22} color="white" />
        ) : (
          <FaVolumeUp size={22} color="white" />
        )}
      </div>
      <span className="text-white text-xs mt-1 bg-black bg-opacity-40 px-2 py-1 rounded-full text-center">
        {isMuted ? "ミュート中" : "音声オン"}
      </span>
    </div>
  );
}

/**
 * 動画コンポーネント。
 * パフォーマンス最適化のためにメモ化されており、再生/一時停止のトグルやエラーハンドリングを提供します。
 */
const MemoizedVideo = React.memo(({
  tweet,
  index,
  activeIndex,
  isMuted,
  videoRefs,
  isPlaying,
  togglePlayPause,
  manuallyPausedVideos
}: {
  tweet: ExtendedTweet;
  index: number;
  activeIndex: number;
  isMuted: boolean;
  videoRefs: React.MutableRefObject<(HTMLVideoElement | null)[]>;
  isPlaying: { [key: string]: boolean };
  togglePlayPause: (index: number) => void;
  manuallyPausedVideos: React.MutableRefObject<Set<string>>;
}) => {
  // 現在表示中か近く表示予定のビデオのみロード
  const shouldLoad = Math.abs(index - activeIndex) <= 2;
  
  // 動画読み込みエラー処理を改善
  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const target = e.currentTarget;
    console.error(`Video load error for tweet ${tweet.id}`);
    
    if (target.error) {
      console.error(`Error code: ${target.error.code}, message: ${target.error.message}`);
    }
    
    // 元のURLに直接フォールバック
    if (tweet.videoUrl !== tweet.backupVideoUrl && tweet.backupVideoUrl) {
      console.log(`Falling back to original URL: ${tweet.backupVideoUrl}`);
      target.src = tweet.backupVideoUrl;
      target.load();
    }
  };

  // 動画がcanplayイベントを発火したときの処理を強化
  const handleCanPlay = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    // このビデオがアクティブでかつ手動停止されていない場合のみ自動再生
    if (index === activeIndex && !manuallyPausedVideos.current.has(tweet.id)) {
      console.log(`[Video ${index}] canplay イベント発火, paused=${e.currentTarget.paused}`);
      
      // ビデオが停止中の場合のみ再生を試みる
      if (e.currentTarget.paused) {
        console.log(`[Video ${index}] canplay時に停止中のため再生開始`);
        e.currentTarget.muted = isMuted;
        e.currentTarget.play().catch((error) => {
          console.error(`[Video ${index}] canplay後の再生失敗:`, error);
        });
      }
    }
  };

  return (
    <>
      <div className="absolute inset-0 flex items-center justify-center">
        <video
          ref={(el) => {
            if (videoRefs.current) {
              videoRefs.current[index] = el;
            }
          }}
          className="object-contain"
          style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            height: '100%',
          }}
          loop
          muted={isMuted}
          playsInline
          crossOrigin="anonymous"
          autoPlay={index === activeIndex && !manuallyPausedVideos.current.has(tweet.id)}
          poster={tweet.thumbnailUrl || undefined}
          // リソース節約のためのプリロード調整
          preload={shouldLoad ? "auto" : "none"}
          // 強化されたハンドラを使用
          onCanPlay={handleCanPlay}
          // データロード後の通知も追加
          onLoadedData={(e) => {
            console.log(`[Video ${index}] loadeddata イベント, readyState=${e.currentTarget.readyState}`);
            // loadeddata時にも再生を試みる (canplayより先に発火する可能性あり)
            handleCanPlay(e);
          }}
          onError={handleVideoError}
          // 再生/一時停止イベントをメモリリーク防止のため分離
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            togglePlayPause(index);
          }}
        >
          <source src={tweet.videoUrl} type="video/mp4" />
          {tweet.backupVideoUrl && <source src={tweet.backupVideoUrl} type="video/mp4" />}
          <p className="text-white">お使いのブラウザは動画を再生できません</p>
        </video>
      </div>
      
      {/* 再生/一時停止ボタン用オーバーレイ */}
      <div
        className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          togglePlayPause(index);
        }}
      >
        {(!isPlaying[tweet.id] || (videoRefs.current[index] && videoRefs.current[index]?.paused)) && (
          <div className="w-20 h-20 rounded-full bg-black bg-opacity-30 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="white"
            >
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </div>
        )}
      </div>
    </>
  );
}, (prevProps, nextProps) => {
  // パフォーマンス最適化: 必要なプロパティの変更時のみ再レンダリング
  return (
    prevProps.tweet.id === nextProps.tweet.id &&
    prevProps.isMuted === nextProps.isMuted &&
    prevProps.isPlaying[prevProps.tweet.id] === nextProps.isPlaying[nextProps.tweet.id] &&
    (prevProps.activeIndex === nextProps.activeIndex || 
     (Math.abs(prevProps.index - prevProps.activeIndex) > 2 && 
      Math.abs(nextProps.index - nextProps.activeIndex) > 2))
  );
});

/**
 * モバイルページのメインコンポーネント。
 * 動画のリストを表示し、無限スクロールや再生管理を行います。
 */
export default function MobilePage() {
  // 状態変数
  const [period, setPeriod] = useState<Period>('day');
  const [sort, setSort] = useState<SortType>('total');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState<{ [key: string]: boolean }>({});
  const [autoSwitchAttempts, setAutoSwitchAttempts] = useState<Period[]>([]);
  const [isAutoSwitching, setIsAutoSwitching] = useState(false);
  
  // 手動で一時停止された動画を追跡するためのRef
  const manuallyPausedVideos = useRef<Set<string>>(new Set());

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // InView hook
  const [loadMoreRef, inView] = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  // データ取得メソッド
  const {
    data,
    status,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['mobile-tweets', period, sort],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(
        `/api/tweets?period=${period}&sort=${sort}&page=${pageParam}&limit=10`
      );
      if (!response.ok) {
        throw new Error(`サーバーエラーが発生しました: ${response.status}`);
      }
      return response.json();
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.meta) return undefined;
      return lastPage.meta.page < lastPage.meta.pageCount
        ? lastPage.meta.page + 1
        : undefined;
    },
    initialPageParam: 1,
    retry: 2,
    retryDelay: 1000,
  });

  // `tweets`の宣言を`useInfiniteQuery`の後に移動
  const tweets = data?.pages.flatMap((page) => page.tweets) || [];

  // ビデオ参照の更新
  useEffect(() => {
    videoRefs.current = videoRefs.current.slice(0, tweets.length);
  }, [tweets.length]);

  // 空の結果が返された場合、自動的に期間を切り替える
  useEffect(() => {
    // ロード中または初期ロード時はスキップ
    if (status === 'loading' || status === 'idle') return;

    // 結果が空かつ自動切り替えが有効でない場合
    if (status === 'success' && tweets.length === 0 && !isAutoSwitching) {
      // 自動切り替えを開始
      setIsAutoSwitching(true);
      
      // 試行済みの期間を追跡
      setAutoSwitchAttempts(prev => [...prev, period]);
      
      // 次の期間を選択
      const periods: Period[] = ['day', 'week', 'month', 'all'];
      const triedPeriods = [...autoSwitchAttempts, period];
      
      // まだ試していない期間を見つける
      const nextPeriod = periods.find(p => !triedPeriods.includes(p));
      
      if (nextPeriod) {
        console.log(`No tweets found for period=${period}, automatically switching to ${nextPeriod}`);
        setPeriod(nextPeriod);
      } else {
        // すべての期間を試した場合はリセット
        console.log('All periods tried without results');
        setAutoSwitchAttempts([]);
        setIsAutoSwitching(false);
      }
    } else if (tweets.length > 0 && isAutoSwitching) {
      // 結果が見つかったら自動切り替えをリセット
      setIsAutoSwitching(false);
      setAutoSwitchAttempts([]);
    }
  }, [status, tweets.length, period, autoSwitchAttempts, isAutoSwitching]);

  // 無限スクロールの処理 - hasNextPageなどが初期化された後に実行
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // スクロール検出ロジック強化 - 正確なスクロールポジション計算
  useEffect(() => {
    if (!containerRef.current) return;

    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const containerTop = containerRef.current.scrollTop;
      const windowHeight = window.innerHeight;
      
      // スナップが有効な場合は単純な除算でOK
      const rawIndex = containerTop / windowHeight;
      
      // 最も近いインデックスを計算（四捨五入）
      const newIndex = Math.round(rawIndex);
      
      if (
        newIndex !== activeIndex &&
        newIndex >= 0 &&
        newIndex < tweets.length
      ) {
        console.log(`[Scroll] インデックス変更: ${activeIndex} -> ${newIndex} (位置: ${containerTop}px)`);
        setActiveIndex(newIndex);
      }
    };

    // スクロールイベントの高速化（throttleを使用）
    const throttleScroll = (): (() => void) => {
      let lastExecution = 0;
      let timeout: NodeJS.Timeout | null = null;
      const throttleMs = 100; // 100msごとに最大1回実行
      
      return () => {
        const now = Date.now();
        const remaining = lastExecution + throttleMs - now;
        
        if (remaining <= 0) {
          if (timeout) clearTimeout(timeout);
          lastExecution = now;
          handleScroll();
        } else if (!timeout) {
          timeout = setTimeout(() => {
            lastExecution = Date.now();
            timeout = null;
            handleScroll();
          }, remaining);
        }
      };
    };

    const throttledHandleScroll = throttleScroll();
    const container = containerRef.current;
    
    if (container) {
      // onScrollイベントとIntersectionObserverの両方を使用して精度を高める
      container.addEventListener('scroll', throttledHandleScroll, { passive: true });
      
      // 初期スクロール位置を確認
      handleScroll();
      
      return () => {
        container.removeEventListener('scroll', throttledHandleScroll);
      };
    }
  }, [activeIndex, tweets.length]);

  // activeIndex変更時の再生処理 - より堅牢な実装
  useEffect(() => {
    if (tweets.length === 0) return;

    let attempts = 0;
    const maxAttempts = 15; // リトライ回数を増やす
    let cleanup = false;
    let retryTimeoutId: NodeJS.Timeout | null = null;
    
    // 現在のアクティブな動画のID
    const currentTweetId = tweets[activeIndex]?.id;
    const currentActiveIndex = activeIndex; // 現在のactiveIndexを固定
    
    // 手動で一時停止された動画かどうかチェック
    const isManuallyPaused = currentTweetId && manuallyPausedVideos.current.has(currentTweetId);
    
    // 他の動画を確実に一時停止
    videoRefs.current.forEach((video, idx) => {
      if (idx !== activeIndex && video && !video.paused) {
        console.log(`[Auto] Video ${idx}: 非アクティブなので一時停止`);
        video.pause();
      }
    });

    // 手動で一時停止した動画は自動再生しない
    if (isManuallyPaused) {
      console.log(`[Auto] Video ${activeIndex}: 手動停止済みのため自動再生をスキップ`);
      return;
    }

    const tryPlay = () => {
      if (cleanup || currentActiveIndex !== activeIndex) {
        console.log(`[Auto] クリーンアップまたはインデックス変更のため中断 (${currentActiveIndex} != ${activeIndex})`);
        return true; // インデックスが変わった場合は処理を中止
      }
      
      const video = videoRefs.current[activeIndex];
      
      // ビデオが存在しないか、DOMから取り外された場合
      if (!video || !video.isConnected) {
        console.log(`[Auto] Video ${activeIndex}: 要素が存在しないか接続されていない、リトライ ${attempts+1}/${maxAttempts}`);
        return false;
      }
      
      // 再度手動停止チェック（非同期処理中に変わる可能性があるため）
      const tweetId = tweets[activeIndex]?.id;
      if (tweetId && manuallyPausedVideos.current.has(tweetId)) {
        console.log(`[Auto] Video ${activeIndex}: 手動停止フラグ検出、再生スキップ`);
        return true; // 再生しないが、処理は完了とする
      }
      
      // ビデオが既に再生中の場合はスキップ
      if (!video.paused) {
        console.log(`[Auto] Video ${activeIndex}: 既に再生中`);
        return true;
      }
      
      // ビデオの準備状態をチェック
      if (video.readyState >= 2) {
        console.log(`[Auto] Video ${activeIndex}: 準備完了、再生実行`);
        
        video.muted = isMuted;
        video.play().then(() => {
          console.log(`[Auto] Video ${activeIndex}: 再生成功`);
          // 成功時に状態を更新する必要がある場合はここで
          setIsPlaying(prev => ({ ...prev, [tweetId]: true }));
        }).catch((e) => {
          console.warn(`[Auto] Video ${activeIndex} 再生失敗:`, e);
          if (!isMuted && !cleanup) {
            console.log(`[Auto] Video ${activeIndex}: ミュートして再試行`);
            video.muted = true;
            video.play().catch(() => {
              console.error(`[Auto] Video ${activeIndex}: ミュート状態でも再生失敗`);
            });
          }
        });
        return true;
      }
      
      // readyStateを表示してデバッグを支援
      console.log(`[Auto] Video ${activeIndex}: 準備待機中 (readyState=${video.readyState}, attempts=${attempts+1}/${maxAttempts})`);
      
      // ビデオのロード状態の更新をトリガーする
      if (video.networkState === 2 || video.networkState === 1) { // NETWORK_LOADING または NETWORK_IDLE
        try {
          // load()を呼び出してビデオのロードを促進
          if (attempts % 3 === 0) { // 3回に1回だけload()を呼び出し（過負荷を避けるため）
            console.log(`[Auto] Video ${activeIndex}: load()呼び出し`);
            video.load();
          }
        } catch (e) {
          console.error(`[Auto] load()エラー:`, e);
        }
      }
      
      return false;
    };

    // 即時実行して成功した場合はここで終了
    if (tryPlay()) {
      console.log(`[Auto] 初回試行で成功`);
      return;
    }

    // リトライ間隔を短く、より多くのチャンスを与える
    const intervalId = setInterval(() => {
      attempts++;
      if (tryPlay() || attempts >= maxAttempts) {
        if (attempts >= maxAttempts && !cleanup) {
          console.warn(`[Auto] Video ${activeIndex}: 最大リトライ回数到達`);
          
          // 最後の手段として、少し遅延して再試行
          retryTimeoutId = setTimeout(() => {
            const video = videoRefs.current[activeIndex];
            const tweetId = tweets[activeIndex]?.id;
            
            if (currentActiveIndex !== activeIndex) {
              console.log(`[Auto] 最終リトライ: インデックスが変更されたため中止`);
              return;
            }
            
            if (video && !cleanup && !video.paused) {
              console.log(`[Auto] 最終リトライ: 既に再生中のため不要`);
              return;
            }
            
            if (video && !cleanup && tweetId && !manuallyPausedVideos.current.has(tweetId)) {
              console.log(`[Auto] 最終リトライ: 強制的に再生試行`);
              // もう一度再生を試みる
              video.muted = isMuted;
              video.play().catch(() => {
                console.error(`[Auto] 最終リトライ失敗`);
              });
            }
          }, 800);
        }
        clearInterval(intervalId);
      }
    }, 200);

    return () => {
      cleanup = true;
      if (intervalId) clearInterval(intervalId);
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
      console.log(`[Auto] useEffect クリーンアップ: activeIndex=${activeIndex}`);
    };
  }, [activeIndex, isMuted, tweets]);

  // 再マウント時または初期表示時のビデオ状態強制更新
  useEffect(() => {
    if (tweets.length === 0) return;
    
    // 初期スクロール位置に基づいてactiveIndexを計算
    if (containerRef.current) {
      const containerTop = containerRef.current.scrollTop;
      const windowHeight = window.innerHeight;
      const calculatedIndex = Math.round(containerTop / windowHeight);
      
      // 計算されたインデックスが現在のactiveIndexと異なる場合は更新
      if (calculatedIndex !== activeIndex && calculatedIndex >= 0 && calculatedIndex < tweets.length) {
        console.log(`[Init] スクロール位置からインデックス計算: ${calculatedIndex} (現在: ${activeIndex})`);
        setActiveIndex(calculatedIndex);
      }
    }
    
    // 現在のアクティブビデオの状態を確認し、必要に応じて再生
    const checkActiveVideo = () => {
      const currentVideo = videoRefs.current[activeIndex];
      const currentTweetId = tweets[activeIndex]?.id;
      
      if (currentVideo && currentTweetId && !manuallyPausedVideos.current.has(currentTweetId)) {
        if (currentVideo.paused) {
          console.log(`[Init] アクティブビデオが停止中なので再生開始`);
          currentVideo.muted = isMuted;
          currentVideo.play().catch(e => {
            console.error(`[Init] ビデオ再生失敗:`, e);
          });
        } else {
          console.log(`[Init] アクティブビデオは既に再生中`);
        }
      }
    };
    
    // 初期チェックを実行
    setTimeout(checkActiveVideo, 500);
    
    // 可視性変更時（タブ切り替え等）にも再チェック
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log(`[Visibility] ページが表示状態に戻りました`);
        setTimeout(checkActiveVideo, 300);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tweets, isMuted]); // activeIndexに依存させない（activeIndexの変更は別useEffectで処理）

  // 各ビデオのイベントを監視し、isPlaying状態を同期する
  useEffect(() => {
    if (tweets.length === 0) return;

    const cleanupFunctions: (() => void)[] = [];

    tweets.forEach((tweet, index) => {
      const video = videoRefs.current[index];
      if (!video) return;
      
      const tweetId = tweet.id;
      
      const handlePlay = () => {
        console.log(`[Event] Video ${index} (${tweetId}): Play イベント`);
        // 再生イベント発生時は手動停止リストから削除
        manuallyPausedVideos.current.delete(tweetId);
        
        setIsPlaying(prev => {
          if (prev[tweetId] === true) return prev;
          return { ...prev, [tweetId]: true };
        });
      };

      const handlePause = () => {
        console.log(`[Event] Video ${index} (${tweetId}): Pause イベント`);
        setIsPlaying(prev => {
          if (prev[tweetId] === false) return prev;
          return { ...prev, [tweetId]: false };
        });
      };

      // 初期状態の同期
      if (!video.paused && isPlaying[tweetId] !== true) {
        setIsPlaying(prev => ({ ...prev, [tweetId]: true }));
      } else if (video.paused && isPlaying[tweetId] !== false) {
        setIsPlaying(prev => ({ ...prev, [tweetId]: false }));
      }

      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      
      cleanupFunctions.push(() => {
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
      });
    });

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [tweets, videoRefs.current]);

  // isMutedの変更を監視するuseEffectを修正
  useEffect(() => {
    // ミュート状態の変更のみを行う
    videoRefs.current.forEach((video) => {
      if (video) {
        video.muted = isMuted;
      }
    });
  }, [isMuted]);

  /**
   * 再生/一時停止を切り替える関数。
   * 指定されたインデックスの動画の再生状態をトグルします。
   */
  const togglePlayPause = (index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    const tweetId = tweets[index]?.id;
    if (!tweetId) return;

    if (video.paused) {
      console.log(`[Manual] Video ${index} (${tweetId}): Play 実行`);
      
      // 他の動画を停止する（現在のインデックス以外）
      videoRefs.current.forEach((v, i) => {
        if (i !== index && v && !v.paused) {
          console.log(`[Manual] 他の動画 ${i} を停止`);
          v.pause();
        }
      });
      
      // 手動再生時は、追跡リストから削除
      manuallyPausedVideos.current.delete(tweetId);
      
      // 現在の動画を再生
      video.play().catch((e) => {
        console.error(`[Manual] Video ${index} 再生失敗:`, e);
        if (!isMuted) {
          video.muted = true;
          setIsMuted(true);
          video.play().catch(() => {});
        }
      });
    } else {
      console.log(`[Manual] Video ${index} (${tweetId}): Pause 実行`);
      // 手動で一時停止したことを記録
      manuallyPausedVideos.current.add(tweetId);
      video.pause();
    }
  };

  // 独立したボタンコンポーネントでイベント伝播の問題を解決
  const ControlButton = ({
    onClick,
    className,
    children,
    style,
    title,  // titleプロパティを追加
  }: {
    onClick: (e: React.MouseEvent) => void;
    className?: string;
    children: React.ReactNode;
    style?: React.CSSProperties;
    title?: string;  // オプショナルプロパティとして定義
  }) => {
    return (
      <button
        type="button"
        title={title}  // title属性を追加
        aria-label={title}  // アクセシビリティのために追加
        onClick={(e) => {
          // イベント伝播を完全に止める
          e.stopPropagation();
          e.preventDefault();
          if (e.nativeEvent) {
            e.nativeEvent.stopImmediatePropagation();
            e.nativeEvent.stopPropagation();
          }
          onClick(e);
        }}
        className={`${className} control-button`}
        style={{ ...style, zIndex: 200 }}
      >
        {children}
      </button>
    );
  };

  /**
   * ミュート状態をトグルする関数。
   * 全ての動画のミュート状態を更新します。
   */
  const handleMuteToggle = () => {
    const newMutedState = !isMuted;

    // ビデオのミュート状態も即更新（状態更新前に）
    videoRefs.current.forEach((video) => {
      if (video) {
        video.muted = newMutedState;
      }
    });

    // 状態更新を最後に行う
    setIsMuted(newMutedState);
  };

  /**
   * 動画を全画面表示にする関数。
   * 対応するブラウザAPIを使用してフルスクリーンモードを有効化します。
   */
  const enterFullscreen = (index: number) => {
    console.log("Button clicked");
    console.log("Video refs:", videoRefs.current);
    console.log("Fullscreen function called for index:", index);
    console.log("Entering fullscreen for index:", index); // デバッグ用ログ
    const video = videoRefs.current[index];
    if (!video) {
      console.error("Video element not found");
      return;
    }

    if (!document.fullscreenEnabled) {
      console.warn("Fullscreen API is not enabled in this browser.");
    }

    try {
      if (video.requestFullscreen) {
        video.requestFullscreen(); // 標準的なフルスクリーンAPI
      } else if ((video as any).webkitEnterFullscreen) {
        (video as any).webkitEnterFullscreen(); // iOS Safari向け
      } else if ((video as any).msRequestFullscreen) {
        (video as any).msRequestFullscreen(); // Microsoft Edge向け
      } else if ((video as any).mozRequestFullScreen) {
        (video as any).mozRequestFullScreen(); // Firefox向け
      } else {
        console.warn("Fullscreen API not supported");
      }
    } catch (e) {
      console.error("Error entering fullscreen:", e);
    }
  };

  /**
   * ヘッダーコンポーネント。
   * 期間やソート順を切り替えるUIを提供します。
   */
  const TikTokHeader = () => {
    const handlePeriodClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const periods: Period[] = ['day', 'week', 'month', 'all'];
      const currentIndex = periods.indexOf(period);
      setPeriod(periods[(currentIndex + 1) % periods.length]);
    };

    const handleSortClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const sorts: SortType[] = ['total', 'likes', 'trending', 'latest'];
      const currentIndex = sorts.indexOf(sort);
      setSort(sorts[(currentIndex + 1) % sorts.length]);
    };

    return (
      <div
        className="fixed top-0 left-0 right-0 px-4 py-1 bg-black bg-opacity-50 tiktok-header"
        style={{
          pointerEvents: 'auto',
          touchAction: 'auto',
          zIndex: 20000,
          top: '70px', // ヘッダーの垂直位置を調整
          left: '0%',  // 左側の余白を設定
          right: '0%', // 右側の余白を設定
          width: '0%', // ヘッダーの幅を設定
        }}
      >
        <div className="flex space-x-2">
          <div
            className="px-3 py-1 rounded-full bg-black bg-opacity-40 flex items-center cursor-pointer pointer-fix"
            onClick={handlePeriodClick}
            style={{ pointerEvents: 'auto' }}
          >
            <span className="text-white text-xs font-medium mr-1">
              {period === 'day' ? '24H' : 
               period === 'week' ? '週間' : 
               period === 'month' ? '月間' : '全て'}
            </span>
            <BsChevronDown size={12} color="white" />
          </div>
          
          <div
            className="px-3 py-1 rounded-full bg-black bg-opacity-40 flex items-center cursor-pointer pointer-fix"
            onClick={handleSortClick}
            style={{ pointerEvents: 'auto' }}
          >
            <span className="text-white text-xs font-medium mr-1">
              {sort === 'total' ? '総合' : 
               sort === 'likes' ? '人気' : 
               sort === 'trending' ? 'トレンド' : '新着'}
            </span>
            <BsChevronDown size={12} color="white" />
          </div>
        </div>
      </div>
    );
  };

  /**
   * アクションバーコンポーネント。
   * 動画のいいね、リツイート、全画面表示などの操作を提供します。
   */
  const TikTokActionBar = ({
    tweet,
    index,
  }: {
    tweet: ExtendedTweet;
    index: number;
  }) => {
    return (
      <div
        className="absolute right-3 flex flex-col space-y-6 items-center"
        style={{ bottom: '200px', zIndex: 500 }} /* 10px分だけ上に調整 */
      >
        <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden"> 
          {tweet.authorProfileImageUrl ? (
            <img 
              src={tweet.authorProfileImageUrl} 
              alt={tweet.authorName || ''} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white">
              {tweet.authorName?.charAt(0) || 'U'}
            </div>
          )}
        </div>
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-black bg-opacity-40 flex items-center justify-center"> 
            <FaHeart size={20} color="#ff2d55" /> 
          </div>
          <span className="text-white text-xs mt-1">{tweet.likes || 0}</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-black bg-opacity-40 flex items-center justify-center"> 
            <FaRetweet size={20} color="#1DA1F2" /> 
          </div>
          <span className="text-white text-xs mt-1">{tweet.retweets || 0}</span>
        </div>
        <div className="flex flex-col items-center">
          <button
            type="button"
            className="w-10 h-10 rounded-full bg-black bg-opacity-40 flex items-center justify-center control-button"
            style={{ pointerEvents: 'auto' }} // クリックを有効化
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setTimeout(() => {
                enterFullscreen(index);
              }, 50);
            }}
          >
            <BsFullscreen size={20} color="white" />
          </button>
          <span className="text-white text-xs mt-1">全画面</span>
        </div>
        {tweet.originalUrl && (
          <div className="flex flex-col items-center">
            <a
              href={tweet.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-black bg-opacity-40 flex items-center justify-center control-button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <g>
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </g>
              </svg>
            </a>
            <span className="text-white text-xs mt-1">元ツイート</span>
          </div>
        )}
      </div>
    );
  };

  /**
   * 動画情報コンポーネント。
   * 動画のタイトルや投稿者情報、ハッシュタグを表示します。
   */
  const TikTokVideoInfo = ({ tweet }: { tweet: ExtendedTweet }) => (
    <div className="absolute bottom-4 left-3 right-16 z-30">
      <div className="flex items-center mb-2">
        <div className="mr-2">
          {tweet.authorProfileImageUrl && (
            <img 
              src={tweet.authorProfileImageUrl} 
              alt={tweet.authorName || ''} 
              className="w-8 h-8 rounded-full"
            />
          )}
        </div>
        <div>
          <span className="text-white font-bold text-base">{tweet.authorName}</span>
          <span className="font-normal text-sm ml-1">@{tweet.authorUsername}</span>
        </div>
      </div>
      <p className="text-white text-sm mb-3 line-clamp-2">{tweet.content}</p>
      <div className="flex flex-wrap gap-2 mb-2">
        {tweet.hashtags && Array.isArray(tweet.hashtags) && tweet.hashtags.length > 0 && (
          tweet.hashtags.map((tag: string, idx: number) => (
            <span key={idx} className="text-white text-xs font-medium">#{tag}</span>
          ))
        )}
      </div>
      {tweet.createdAt && (
        <p className="text-gray-300 text-xs mt-2">
          {new Date(tweet.createdAt).toLocaleDateString('ja-JP', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}
        </p>
      )}
    </div>
  );

  // 空の結果を取得した場合のエラー状態処理を改善
  if (status === 'error') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black p-4">
        <div className="bg-gray-800 p-5 rounded-lg text-white text-center">
          <h3 className="text-xl font-bold mb-2">エラーが発生しました</h3>
          <p className="mb-4">
            {(error as Error)?.message || 'データの読み込みに失敗しました'}
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                if (typeof refetch === 'function') {
                  refetch();
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              再試行
            </button>
            <div className="mt-2 text-sm text-gray-400">
              <p>別の期間を試してください:</p>
              <div className="flex justify-center gap-2 mt-1">
                {(['day', 'week', 'month', 'all'] as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPeriod(p);
                      setAutoSwitchAttempts([]);
                      setIsAutoSwitching(false);
                    }}
                    className={`px-3 py-1 rounded ${period === p ? 'bg-blue-700' : 'bg-blue-900'}`}
                  >
                    {p === 'day' ? '24H' : 
                     p === 'week' ? '週間' : 
                     p === 'month' ? '月間' : '全期間'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // データロード中の表示を改善 - status比較を修正
  if (status === 'idle' || status === 'loading' || isAutoSwitching) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        {isAutoSwitching && (
          <p className="mt-4 text-white text-center">
            {period === 'day' ? '24時間内' : 
             period === 'week' ? '週間内' : 
             period === 'month' ? '月間内' : '全期間'}
            のツイートが見つかりませんでした。<br/>
            別の期間で検索しています...
          </p>
        )}
      </div>
    );
  }

  // ツイートがない場合の表示 - status比較を修正
  if (status === 'success' && (!tweets || tweets.length === 0)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black p-4">
        <div className="bg-gray-800 p-5 rounded-lg text-white text-center">
          <h3 className="text-xl font-bold mb-2">ツイートが見つかりませんでした</h3>
          <p className="mb-4">検索条件を変更して再試行してください。</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                if (typeof refetch === 'function') {
                  refetch();
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              再試行
            </button>
            <div className="mt-2 text-sm text-gray-400">
              <p>別の期間を試してください:</p>
              <div className="flex justify-center gap-2 mt-1">
                {(['day', 'week', 'month', 'all'] as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPeriod(p);
                      setAutoSwitchAttempts([]);
                      setIsAutoSwitching(false);
                    }}
                    className={`px-3 py-1 rounded ${period === p ? 'bg-blue-700' : 'bg-blue-900'}`}
                  >
                    {p === 'day' ? '24H' : 
                     p === 'week' ? '週間' : 
                     p === 'month' ? '月間' : '全期間'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black h-screen overflow-hidden">
      {/* ヘッダーをスクロールコンテナの外に配置 */}
      <div
        id="tiktok-header-container"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30, // 高いz-indexを設定
          pointerEvents: 'auto', // クリックを有効化
          touchAction: 'auto', // タッチイベントを有効化
        }}
      >
        <TikTokHeader />
      </div>

      <FixedMuteButton
        isMuted={isMuted}
        handleMuteToggle={handleMuteToggle}
      />
      
      <div
        ref={containerRef}
        className="h-screen w-full overflow-y-scroll snap-y snap-mandatory pt-24"
        style={{
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          marginTop: '3.5rem', // ヘッダーの高さ分のマージンを追加
          paddingTop: '4rem', // スクロール開始位置の調整
        }}
      >
        {tweets.map((tweet, index) => (
          <div
            key={tweet.id}
            className="h-screen w-full snap-start relative overflow-hidden"
            style={{
              scrollSnapAlign: 'start',
              padding: 0, // 不要な余白を削除
              margin: 0,  // 不要な余白を削除
            }}
          >
            {/* 最適化: 表示に必要なビデオのみレンダリング */}
            {Math.abs(index - activeIndex) <= 3 && (
              <>
                <MemoizedVideo
                  tweet={tweet}
                  index={index}
                  activeIndex={activeIndex}
                  isMuted={isMuted}
                  videoRefs={videoRefs}
                  isPlaying={isPlaying}
                  togglePlayPause={togglePlayPause}
                  manuallyPausedVideos={manuallyPausedVideos} // 追加したprops
                />
                
                <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-20"></div>
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-20"></div>
                
                <TikTokActionBar tweet={tweet} index={index} />
                <TikTokVideoInfo tweet={tweet} />
                
                <ControlButton
                  onClick={() => togglePlayPause(index)}
                  className="absolute bottom-24 right-3 mt-5 w-12 h-12 rounded-full bg-black bg-opacity-40 flex items-center justify-center"
                  title={isPlaying[tweet.id] && !videoRefs.current[index]?.paused ? "一時停止" : "再生"}
                >
                  {isPlaying[tweet.id] && !videoRefs.current[index]?.paused ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
                      <rect x="6" y="4" width="4" height="16"></rect>
                      <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
                      <polygon points="5,3 19,12 5,21"></polygon>
                    </svg>
                  )}
                </ControlButton>
                <span className="absolute bottom-16 right-3 text-white text-xs">
                  {isPlaying[tweet.id] && !videoRefs.current[index]?.paused ? "一時停止" : "再生"}
                </span>
              </>
            )}
          </div>
        ))}
        {hasNextPage && (
          <div
            ref={loadMoreRef}
            className="h-16 flex items-center justify-center"
          >
            {isFetchingNextPage && (
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}