// components/VideoPlayer.tsx
import React, { useState, useRef, useEffect } from 'react';

interface VideoPlayerProps {
  src: string;
  posterImage?: string;
  autoPlay?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, posterImage, autoPlay = false }) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 動画読み込み時の処理
  const handleLoadedData = () => {
    setIsLoading(false);
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // 再生/一時停止の切り替え
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // 時間更新イベントのハンドラ
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // 音量調整
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  // シークバーでの位置変更
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
    }
  };

  // 再生時間のフォーマット (mm:ss)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="relative w-full rounded-lg overflow-hidden bg-black">
      {/* ローディングインジケーター */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      )}
      
      {/* 動画要素 */}
      <video
        ref={videoRef}
        src={src}
        poster={posterImage}
        className="w-full"
        onLoadedData={handleLoadedData}
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      
      {/* コントロールパネル - 再生中は非表示、マウスホバーで表示 */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 transition-opacity opacity-0 hover:opacity-100">
        {/* 再生/一時停止ボタン */}
        <button 
          onClick={togglePlay}
          className="p-2 rounded-full hover:bg-gray-700"
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>
        
        {/* シークバー */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="flex-grow h-1 accent-blue-500"
          />
          <span className="text-xs">{formatTime(duration)}</span>
          
          {/* 音量コントロール */}
          <div className="flex items-center ml-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-14 h-1 accent-blue-500 ml-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;

// components/TwitterCard.tsx
import React, { useState } from 'react';
import VideoPlayer from './VideoPlayer';
import Image from 'next/image';

interface Tweet {
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
}

interface TwitterCardProps {
  tweet: Tweet;
}

// 数値を省略表記に変換（例: 1200 → 1.2K）
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

const TwitterCard: React.FC<TwitterCardProps> = ({ tweet }) => {
  const [expanded, setExpanded] = useState(false);

  // タイムスタンプのフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-4">
      <div className="p-4">
        {/* ユーザー情報 */}
        <div className="flex items-center mb-3">
          {/* プロフィール画像（デフォルト） */}
          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          
          {/* ユーザー名と日時 */}
          <div className="ml-3">
            <div className="font-bold text-gray-900 dark:text-white">
              {tweet.authorName || 'ユーザー'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              @{tweet.authorUsername || 'username'} • {formatDate(tweet.timestamp)}
            </div>
          </div>
          
          {/* Xロゴ */}
          <div className="ml-auto">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-6 h-6 text-gray-500">
              <g>
                <path
                  fill="currentColor"
                  d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                ></path>
              </g>
            </svg>
          </div>
        </div>
        
        {/* ツイートコンテンツ */}
        <div 
          className={`text-gray-700 dark:text-gray-200 mb-3 ${expanded ? '' : 'line-clamp-3'}`}
        >
          {tweet.content}
        </div>
        
        {/* もっと見るボタン（コンテンツが長い場合） */}
        {tweet.content && tweet.content.length > 150 && (
          <button 
            className="text-blue-500 text-sm mb-3"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '閉じる' : 'もっと見る'}
          </button>
        )}
        
        {/* 動画プレーヤー */}
        {tweet.videoUrl && (
          <div className="rounded-xl overflow-hidden mb-3">
            <VideoPlayer 
              // 元のURLから動画IDを抽出してプロキシURLに変換
              src={`/api/video/${tweet.tweetId}`}
              // サムネイル（オプション）
              posterImage={tweet.thumbnailUrl} 
            />
          </div>
        )}
        
        {/* エンゲージメント情報 */}
        <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mt-4">
          {/* いいね */}
          <div className="flex items-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {formatNumber(tweet.likes)}
          </div>
          
          {/* リツイート */}
          <div className="flex items-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            {formatNumber(tweet.retweets)}
          </div>
          
          {/* 閲覧数 */}
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {formatNumber(tweet.views)}
          </div>
          
          {/* 元ツイートへのリンク */}
          <div className="ml-auto">
            <a 
              href={`https://twitter.com/user/status/${tweet.tweetId}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              元ツイート
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwitterCard;

// app/api/video/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PassThrough } from 'stream';

// Twitterの動画URLにアクセスする際のヘッダー設定
const fetchHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': '*/*',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Referer': 'https://twitter.com/'
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tweetId = params.id;
    
    // データベースから動画URL取得
    const tweet = await prisma.tweet.findFirst({
      where: { tweetId: tweetId },
      select: { videoUrl: true }
    });
    
    if (!tweet || !tweet.videoUrl) {
      return new NextResponse('動画が見つかりません', { status: 404 });
    }
    
    // Twitterから動画を取得
    const response = await fetch(tweet.videoUrl, {
      headers: fetchHeaders,
      // メソッドをHEADから修正
    });
    
    if (!response.ok) {
      console.error(`Twitter video fetch failed: ${response.status} ${response.statusText}`);
      return new NextResponse('動画の取得に失敗しました', { status: 502 });
    }
    
    // レスポンスヘッダーを準備
    const headers = new Headers();
    
    // コンテンツタイプとサイズを設定
    const contentType = response.headers.get('Content-Type');
    if (contentType) {
      headers.set('Content-Type', contentType);
    } else {
      // デフォルトのMP4コンテンツタイプ
      headers.set('Content-Type', 'video/mp4');
    }
    
    // キャッシュヘッダー
    headers.set('Cache-Control', 'public, max-age=86400'); // 24時間キャッシュ
    
    // レンジリクエストのサポート
    const rangeHeader = request.headers.get('range');
    if (rangeHeader && response.headers.has('Content-Length')) {
      // レンジリクエストの場合は元のレンジヘッダーと同じレンジヘッダーを設定
      headers.set('Accept-Ranges', 'bytes');
      headers.set('Content-Range', response.headers.get('Content-Range') || '');
    }
    
    // ストリームレスポンスを返す
    return new NextResponse(response.body, {
      headers,
      status: response.status,
    });
    
  } catch (error) {
    console.error('Video proxy error:', error);
    return new NextResponse('内部サーバーエラー', { status: 500 });
  }
}

// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import TwitterCard from '@/components/TwitterCard';
import LoadingSpinner from '@/components/LoadingSpinner';

// ツイート取得関数
async function fetchTweets({ pageParam = 1, period = 'week', sort = 'likes' }) {
  try {
    const response = await fetch(`/api/tweets?page=${pageParam}&limit=10&period=${period}&sort=${sort}`);
    
    if (!response.ok) {
      throw new Error('ツイートの取得中にエラーが発生しました');
    }
    
    return response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

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
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.page < lastPage.meta.pageCount) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
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
            {page.tweets.map(tweet => (
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

// components/LoadingSpinner.tsx
export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-4">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}

// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['video.twimg.com', 'pbs.twimg.com'],
  },
  async headers() {
    return [
      {
        source: '/api/video/:id',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;