import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { FaHeart, FaRetweet, FaEye, FaPlay } from 'react-icons/fa';
import { ProcessedTweet } from '@/types/tweet';

interface TweetCardProps {
  tweet: ProcessedTweet;
  videoUrl: string | null;
}

const TweetCard: React.FC<TweetCardProps> = ({ tweet, videoUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showThumbnail, setShowThumbnail] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // サムネイルURLの生成
  const getThumbnailUrl = () => {
    // ユーザーのバナー画像をサムネイルとして使用（代替）
    if (tweet.authorUsername) {
      return `https://unavatar.io/twitter/${tweet.authorUsername}/banner`;
    }
    
    // プロファイル画像を大きめのサイズで使用（代替）
    return `https://unavatar.io/twitter/${tweet.authorUsername || 'twitter'}?fallback=https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png`;
  };
  
  const formatNumber = (num: number | null): string => {
    if (num === null) return '-';
    return num > 999 ? `${(num / 1000).toFixed(1)}K` : num.toString();
  };
  
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy年MM月dd日 HH:mm', { locale: ja });
    } catch (e) {
      return dateString;
    }
  };

  // 動画再生開始時
  const handleVideoPlay = () => {
    setIsPlaying(true);
    setShowThumbnail(false);
  };

  // 動画クリック時の処理
  const handleThumbnailClick = () => {
    if (videoRef.current) {
      videoRef.current.play()
        .then(() => {
          setShowThumbnail(false);
          setIsPlaying(true);
        })
        .catch(err => {
          console.error('再生開始エラー:', err);
          setError('動画の再生に失敗しました。もう一度お試しください。');
        });
    }
  };
  
  // 動画読み込み中
  const handleVideoLoadStart = () => {
    setIsLoading(true);
  };
  
  // 動画読み込み完了
  const handleVideoLoaded = () => {
    setIsLoading(false);
  };
  
  // 動画のエラー
  const handleVideoError = () => {
    setError('動画の読み込みに失敗しました');
    setIsLoading(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
      {/* プロフィール部分 */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            {tweet.authorUsername && (
              <img
                src={`https://unavatar.io/twitter/${tweet.authorUsername}`}
                alt={tweet.authorName || 'プロフィール画像'}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
                }}
              />
            )}
          </div>
          <div className="ml-3">
            <p className="font-medium text-gray-900 dark:text-white">
              {tweet.authorName || '名前なし'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              @{tweet.authorUsername || 'username'} · {formatDate(tweet.timestamp)}
            </p>
          </div>
        </div>
      </div>
      
      {/* ツイート内容 */}
      {tweet.content && (
        <div className="p-4">
          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line break-words">
            {tweet.content}
          </p>
        </div>
      )}
      
      {/* 動画部分 - サムネイルと動画プレイヤーを改善 */}
      {videoUrl && (
        <div className="relative aspect-video bg-gray-900 overflow-hidden">
          {/* サムネイル表示 */}
          {showThumbnail && (
            <div 
              className="absolute inset-0 bg-cover bg-center z-10 flex items-center justify-center cursor-pointer group"
              onClick={handleThumbnailClick}
              style={{ 
                backgroundImage: `url(${getThumbnailUrl()})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* 再生ボタン */}
              <div className="bg-blue-600 bg-opacity-80 rounded-full p-4 text-white transform transition-transform duration-200 group-hover:scale-110">
                <FaPlay className="h-8 w-8" />
              </div>
              
              {/* グラデーションオーバーレイ */}
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-40"></div>
              
              {/* 動画時間表示（オプション）- APIから取得できれば使用可能 */}
              {/*
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white text-sm px-2 py-1 rounded">
                0:30
              </div>
              */}
            </div>
          )}
          
          {/* 読み込み中インジケーター */}
          {isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
              <div className="w-12 h-12 rounded-full border-4 border-blue-400 border-t-transparent animate-spin"></div>
            </div>
          )}
          
          {/* エラー表示 */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-20">
              <div className="text-center p-6 max-w-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-white mb-4">{error}</p>
                <a 
                  href={tweet.originalUrl || `https://twitter.com/i/status/${tweet.tweetId}`} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded inline-block transition"
                >
                  元の投稿で見る
                </a>
              </div>
            </div>
          )}
          
          {/* 実際の動画要素 */}
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            preload="metadata"
            playsInline
            controls={!showThumbnail}
            onPlay={handleVideoPlay}
            onLoadStart={handleVideoLoadStart}
            onLoadedData={handleVideoLoaded}
            onError={handleVideoError}
          />
        </div>
      )}
      
      {/* エンゲージメント */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-700">
        <div className="flex space-x-6">
          <div className="flex items-center">
            <FaHeart className="text-red-500 mr-2" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {formatNumber(tweet.likes)}
            </span>
          </div>
          <div className="flex items-center">
            <FaRetweet className="text-green-500 mr-2" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {formatNumber(tweet.retweets)}
            </span>
          </div>
          {tweet.views !== null && (
            <div className="flex items-center">
              <FaEye className="text-blue-500 mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {formatNumber(tweet.views)}
              </span>
            </div>
          )}
        </div>
        
        <a
          href={tweet.originalUrl || `https://twitter.com/i/status/${tweet.tweetId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          元の投稿を見る
        </a>
      </div>
    </div>
  );
};

export default TweetCard;