// components/VideoPlayer.tsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  FaPlay, FaPause, FaExpand, FaCompress,
  FaVolumeUp, FaVolumeMute, FaCog
} from 'react-icons/fa';

interface VideoPlayerProps {
  videoUrl: string;
  className?: string;
  initialMuted?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  className = '',
  initialMuted = true,
  preload = 'metadata'
}) => {
  // 状態管理
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [thumbnailCanvas, setThumbnailCanvas] = useState<string | null>(null);

  // refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 15秒後にローディングを強制終了
    loadingTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 15000);

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      clearTimeout(loadingTimeoutRef.current);
    };

    const handleTimeUpdate = () => {
      setProgress((video.currentTime / video.duration) * 100);
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      clearTimeout(loadingTimeoutRef.current);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // サムネイル生成のイベントリスナーを追加
    const handleLoadedData = () => {
      video.currentTime = 0; // 動画の開始位置に設定
    };

    const handleSeek = () => {
      generateThumbnail(video);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('seeked', handleSeek);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('seeked', handleSeek);
    };
  }, [videoUrl]);

  // コントロール表示の自動非表示
  useEffect(() => {
    if (!isPlaying) return;
    
    const hideControls = () => {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    hideControls();
    return () => clearTimeout(controlsTimeoutRef.current);
  }, [isPlaying, showControls]);

  // 機能関数
  const togglePlay = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // イベントの伝播を停止
      e.preventDefault();  // デフォルト動作を防止
    }
  
    const video = videoRef.current;
    if (!video) {
      console.error('Video element not found');
      return;
    }
  
    try {
      if (video.paused) {
        video.play()
          .then(() => {
            setIsPlaying(true);
            console.log('再生開始');
          })
          .catch(err => {
            console.error('再生エラー:', err);
            setError('動画の再生に失敗しました');
          });
      } else {
        video.pause();
        setIsPlaying(false);
        console.log('一時停止');
      }
    } catch (err) {
      console.error('togglePlay内でエラー:', err);
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error('フルスクリーンエラー:', err);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        console.error('フルスクリーン終了エラー:', err);
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    video.currentTime = percentage * video.duration;
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const generateThumbnail = async (video: HTMLVideoElement) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // CORSポリシーに対応するために crossOrigin を設定
        video.crossOrigin = 'anonymous';
        
        // 描画を試みる
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        try {
          const dataUrl = canvas.toDataURL('image/jpeg');
          setThumbnailCanvas(dataUrl);
        } catch (err) {
          console.warn('サムネイル生成に失敗しました:', err);
          // 失敗した場合はデフォルトのサムネイルを設定
          setThumbnailCanvas(null);
        }
      }
    } catch (err) {
      console.error('サムネイル生成エラー:', err);
      setThumbnailCanvas(null);
    }
  };

  if (error) {
    return (
      <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
        <div className="text-white text-center">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative group ${className}`}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* 動画要素 - クリックイベントの設定 */}
      <video
        ref={videoRef}
        className="w-full aspect-video bg-gray-900 cursor-pointer" // カーソルをポインターに
        playsInline
        muted={isMuted}
        preload={preload}
        crossOrigin="anonymous"
        onClick={(e) => togglePlay(e)}  // イベントオブジェクトを渡す
        poster={thumbnailCanvas || `${videoUrl}?poster=1`}
      >
        <source src={videoUrl} type="video/mp4" />
        お使いのブラウザは動画をサポートしていません
      </video>

      {/* コントロールオーバーレイ */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* プログレスバー */}
        <div
          className="absolute bottom-16 left-0 right-0 h-1 bg-gray-600 cursor-pointer"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-blue-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 時間表示 */}
        <div className="absolute bottom-20 left-4 text-white text-sm">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* コントロールボタン */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={(e) => togglePlay(e)}
              className="text-white p-2 hover:bg-white/20 rounded-full"
            >
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-white p-2 hover:bg白/20 rounded-full"
              >
                {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20"
              />
            </div>
          </div>

          <button
            onClick={toggleFullscreen}
            className="text-white p-2 hover:bg白/20 rounded-full"
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
        </div>
      </div>

      {/* ローディング表示 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;