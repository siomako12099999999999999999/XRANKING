// components/VideoPlayer.tsx
import React, { useState, useRef, useEffect } from 'react';
import { FiPlay, FiPause, FiVolume2, FiVolumeX } from 'react-icons/fi';

// props型を正確に定義
export interface VideoPlayerProps {
  src: string;
  posterImage?: string | undefined;
  autoPlay?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, posterImage, autoPlay = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 再生をトグルする
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(err => {
        console.error('動画の再生に失敗しました', err);
      });
    }
  };

  // ミュート状態をトグルする
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  // シーク処理
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newTime = parseFloat(e.target.value);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // 時間の更新処理
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    if (videoRef.current.duration) {
      setDuration(videoRef.current.duration);
    }
  };

  // 動画のロード完了時
  const handleLoadedData = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    setIsLoading(false);
    
    if (autoPlay) {
      videoRef.current.play().catch(() => {
        console.log('自動再生はブラウザにブロックされました');
      });
    }
  };

  // 時間のフォーマット（秒→MM:SS形式）
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // マウス操作によるコントロール表示の切り替え
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      
      timeout = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };
    
    const element = document.getElementById('video-container');
    if (element) {
      element.addEventListener('mousemove', handleMouseMove);
      element.addEventListener('mouseenter', () => setShowControls(true));
      element.addEventListener('mouseleave', () => isPlaying && setShowControls(false));
    }
    
    return () => {
      if (element) {
        element.removeEventListener('mousemove', handleMouseMove);
        element.removeEventListener('mouseenter', () => setShowControls(true));
        element.removeEventListener('mouseleave', () => setShowControls(false));
      }
      clearTimeout(timeout);
    };
  }, [isPlaying]);

  return (
    <div 
      id="video-container"
      className="relative w-full rounded-lg overflow-hidden bg-black aspect-video"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      <video
        ref={videoRef}
        src={src}
        poster={posterImage}
        className="w-full h-full object-contain"
        onLoadedData={handleLoadedData}
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      
      {/* コントロールパネル - 再生中は非表示、マウスホバーで表示 */}
      <div className={`absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* 再生/一時停止ボタン */}
        <button 
          onClick={togglePlay}
          className="p-2 rounded-full hover:bg-gray-700"
        >
          {isPlaying ? <FiPause size={20} /> : <FiPlay size={20} />}
        </button>
        
        {/* ミュート切り替えボタン */}
        <button
          onClick={toggleMute}
          className="p-2 rounded-full hover:bg-gray-700 ml-2"
        >
          {isMuted ? <FiVolumeX size={20} /> : <FiVolume2 size={20} />}
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
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;