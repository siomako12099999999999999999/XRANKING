import { useState, useRef } from 'react';
import styles from '../styles/VideoPlayer.module.css';

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

export default function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  return (
    <div className={styles.videoWrapper}>
      {isLoading && <div className={styles.loading}><span></span></div>}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        onLoadedData={() => setIsLoading(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
      />
      <button 
        className={`${styles.playButton} ${isPlaying ? styles.hidden : ''}`}
        onClick={togglePlay}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
    </div>
  );
}
