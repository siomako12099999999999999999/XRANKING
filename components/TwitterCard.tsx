import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { FiHeart, FiRepeat, FiEye, FiExternalLink, FiPlay } from 'react-icons/fi';

interface Tweet {
  id: string;
  tweetId: string;
  content: string | null;
  videoUrl: string | null;
  originalUrl?: string | null;
  likes: number | null;
  retweets: number | null;
  views: number | null;
  timestamp: string | Date;
  authorName?: string | null;
  authorUsername?: string | null;
  authorProfileImageUrl?: string | null;
  thumbnailUrl?: string | null;
}

interface TwitterCardProps {
  tweet: Tweet;
  videoUrl?: string | null;
  useProxy?: boolean;
  isInView?: boolean;
}

// 数値を省略表記に変換（例: 1200 → 1.2K）
const formatNumber = (num: number | null): string => {
  if (!num) return '0';
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

const TwitterCard: React.FC<TwitterCardProps> = ({ 
  tweet, 
  videoUrl, 
  useProxy = true,
  isInView = true
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoError, setIsVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showControls, setShowControls] = useState(false);
  
  // タイムスタンプのフォーマット
  const formatDate = (dateString: string | Date) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: ja });
    } catch (e) {
      return '日時不明';
    }
  };

  // ビデオの読み込みとエラー処理
  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error("動画読み込みエラー:", e);
    setIsVideoError(true);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => {
          console.error("再生開始エラー:", err);
          setIsVideoError(true);
        });
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // ビデオの再生状態を監視
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  // 自動再生の処理
  useEffect(() => {
    if (!isInView) {
      const video = videoRef.current;
      if (video && !video.paused) {
        video.pause();
      }
    }
  }, [isInView]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-4 transition-all hover:shadow-lg">
      <div className="p-4">
        {/* ユーザー情報 */}
        <div className="flex items-center mb-3">
          <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-300 flex-shrink-0">
            {tweet.authorProfileImageUrl ? (
              <Image 
                src={tweet.authorProfileImageUrl} 
                alt={tweet.authorName || 'ユーザー'} 
                width={40} 
                height={40}
                className="h-full w-full object-cover"
                onError={(e) => {
                  // エラー時のフォールバック処理
                  (e.target as HTMLImageElement).src = '/images/default-avatar.png';
                }}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
          
          {/* ユーザー名と日時 */}
          <div className="ml-3 flex-grow">
            <div className="font-bold text-gray-900 dark:text-white line-clamp-1">
              {tweet.authorName || 'ユーザー'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-1">
              <span>@{tweet.authorUsername || 'username'}</span>
              <span>•</span>
              <span>{formatDate(tweet.timestamp)}</span>
            </div>
          </div>
          
          {/* Xロゴ */}
          <div className="ml-auto">
            <a 
              href={tweet.originalUrl || `https://twitter.com/user/status/${tweet.tweetId}`}
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Twitterで見る"
              className="text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5">
                <g>
                  <path
                    fill="currentColor"
                    d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                  ></path>
                </g>
              </svg>
            </a>
          </div>
        </div>
        
        {/* ツイートコンテンツ */}
        {tweet.content && (
          <div className="mb-3">
            <div 
              className={`text-gray-700 dark:text-gray-200 whitespace-pre-wrap ${expanded ? '' : 'line-clamp-3'}`}
            >
              {tweet.content}
            </div>
            
            {/* もっと見るボタン（コンテンツが長い場合） */}
            {tweet.content.length > 180 && (
              <button 
                className="text-blue-600 dark:text-blue-400 text-sm mt-1 hover:underline focus:outline-none"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? '閉じる' : 'もっと見る'}
              </button>
            )}
          </div>
        )}
        
        {/* 動画プレーヤー */}
        {(tweet.videoUrl || videoUrl) && (
          <div 
            className="relative rounded-xl overflow-hidden mb-3"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
          >
            {isVideoError ? (
              <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>動画の読み込みに失敗しました</p>
                <a 
                  href={tweet.originalUrl || `https://twitter.com/user/status/${tweet.tweetId}`} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Twitterで見る
                </a>
              </div>
            ) : (
              <>
                <video 
                  ref={videoRef}
                  src={videoUrl || tweet.videoUrl || ''}
                  controls={showControls}
                  preload="metadata"
                  className="w-full max-h-[500px] object-contain bg-black"
                  poster={tweet.thumbnailUrl || undefined}
                  playsInline
                  onClick={togglePlay}
                  onError={handleVideoError}
                  muted={isMuted}
                />
                
                {!showControls && !isPlaying && (
                  <button 
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-40 transition-opacity"
                    onClick={togglePlay}
                    aria-label="再生"
                  >
                    <FiPlay className="h-16 w-16 text-white opacity-80" />
                  </button>
                )}
                
                <div className={`absolute bottom-2 right-2 flex space-x-2 ${showControls ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
                  <button
                    className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                    onClick={toggleMute}
                    aria-label={isMuted ? 'ミュート解除' : 'ミュート'}
                  >
                    {isMuted ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        
        {/* エンゲージメント情報 */}
        <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mt-4 space-x-6">
          {/* いいね */}
          <div className="flex items-center space-x-1">
            <FiHeart className="h-4 w-4 text-red-500" />
            <span>{formatNumber(tweet.likes)}</span>
          </div>
          
          {/* リツイート */}
          <div className="flex items-center space-x-1">
            <FiRepeat className="h-4 w-4 text-green-500" />
            <span>{formatNumber(tweet.retweets)}</span>
          </div>
          
          {/* 閲覧数 */}
          <div className="flex items-center space-x-1">
            <FiEye className="h-4 w-4 text-blue-500" />
            <span>{formatNumber(tweet.views)}</span>
          </div>
          
          {/* 元ツイートへのリンク */}
          <div className="ml-auto">
            <a 
              href={tweet.originalUrl || `https://twitter.com/user/status/${tweet.tweetId}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
            >
              <FiExternalLink className="h-4 w-4" />
              <span>元ツイート</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwitterCard;