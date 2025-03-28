'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [url, setUrl] = useState('');
  const [poster, setPoster] = useState('');
  const [autoplay, setAutoplay] = useState(false);
  const [muted, setMuted] = useState(true);
  const [loop, setLoop] = useState(true);
  
  useEffect(() => {
    // URLパラメータを取得
    const params = new URLSearchParams(window.location.search);
    const src = params.get('src');
    if (src) {
      setUrl(decodeURIComponent(src));
    }
    
    const posterParam = params.get('poster');
    if (posterParam) {
      setPoster(decodeURIComponent(posterParam));
    }
    
    setAutoplay(params.get('autoplay') === '1');
    setMuted(params.get('muted') !== '0');
    setLoop(params.get('loop') !== '0');
    
    // iOSでの再生を有効にするためのスクリプト
    const enableAutoplay = () => {
      if (videoRef.current) {
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(e => {
          console.error('自動再生失敗:', e);
        });
      }
      
      document.removeEventListener('touchstart', enableAutoplay);
      document.removeEventListener('click', enableAutoplay);
      document.removeEventListener('pointerdown', enableAutoplay);
    };
    
    document.addEventListener('touchstart', enableAutoplay);
    document.addEventListener('click', enableAutoplay);
    document.addEventListener('pointerdown', enableAutoplay);
    
    // 親ウィンドウからのメッセージを処理
    const handleMessage = (event: MessageEvent) => {
      if (!videoRef.current) return;
      
      try {
        const { action } = event.data;
        
        if (action === 'play') {
          videoRef.current.play().then(() => {
            setIsPlaying(true);
          }).catch(e => {
            console.error('外部からの再生コマンド失敗:', e);
          });
        } else if (action === 'pause') {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      } catch (e) {
        console.error('メッセージ処理エラー:', e);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      document.removeEventListener('touchstart', enableAutoplay);
      document.removeEventListener('click', enableAutoplay);
      document.removeEventListener('pointerdown', enableAutoplay);
      window.removeEventListener('message', handleMessage);
    };
  }, []);
  
  useEffect(() => {
    if (autoplay && videoRef.current) {
      videoRef.current.muted = true;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlaying(true);
        }).catch(e => {
          console.error('自動再生エラー:', e);
        });
      }
    }
  }, [autoplay, url]);
  
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(e => {
        console.error('再生エラー:', e);
      });
    }
  };
  
  // URLがない場合
  if (!url) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <p>動画URLが指定されていません</p>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="flex items-center justify-center h-screen w-screen bg-black overflow-hidden"
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={url}
        poster={poster}
        className="max-h-full max-w-full object-contain"
        muted={muted}
        loop={loop}
        playsInline
        webkit-playsinline="true"
        controls={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          backgroundColor: 'black'
        }}
      />
      
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="rounded-full bg-white bg-opacity-80 w-20 h-20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="black">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}