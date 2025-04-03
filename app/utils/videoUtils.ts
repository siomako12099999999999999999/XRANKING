/**
 * 機能概要：
 * ビデオ処理ユーティリティ関数群
 * 
 * 主な機能：
 * 1. ビデオ要素のメモリ管理
 * 2. ビデオ再生の制御
 * 3. エラーハンドリング
 * 4. パフォーマンス最適化
 * 
 * 用途：
 * - ビデオプレーヤーの制御
 * - メモリリークの防止
 * - 再生エラーの処理
 * - パフォーマンスの改善
 */

/**
 * ビデオ要素のメモリリソースを解放します
 */
export function unloadVideo(videoElement: HTMLVideoElement | null): void {
  if (!videoElement) return;
  
  try {
    // 再生を停止
    videoElement.pause();
    
    // バッファをクリア
    videoElement.removeAttribute('src');
    videoElement.load();
    
    // メディアストリームを閉じる（存在する場合）
    const mediaStream = (videoElement as any).srcObject as MediaStream;
    if (mediaStream && typeof mediaStream.getTracks === 'function') {
      mediaStream.getTracks().forEach(track => track.stop());
    }
    (videoElement as any).srcObject = null;
  } catch (err) {
    console.error('Error unloading video:', err);
  }
}

/**
 * ビデオのロード前処理を行います
 */
export function prepareVideoForLoad(videoElement: HTMLVideoElement | null): void {
  if (!videoElement) return;
  
  // モバイルデバイスでの自動再生を支援する設定
  videoElement.setAttribute('playsinline', 'true');
  videoElement.setAttribute('webkit-playsinline', 'true');
  videoElement.muted = true;
  videoElement.preload = 'metadata';
  
  // バッファリング設定
  if ('mozAutoplayEnabled' in videoElement) {
    (videoElement as any).mozAutoplayEnabled = true;
  }
}

/**
 * 動画を安全に再生します
 */
export function safePlayVideo(videoElement: HTMLVideoElement | null): Promise<void> {
  if (!videoElement) return Promise.reject(new Error('Video element is null'));
  
  // 再生準備
  prepareVideoForLoad(videoElement);
  
  // ビデオが読み込まれているか確認
  if (videoElement.readyState < 2) {
    return new Promise((resolve, reject) => {
      const canPlayHandler = () => {
        videoElement.play()
          .then(resolve)
          .catch(reject);
        videoElement.removeEventListener('canplay', canPlayHandler);
      };
      videoElement.addEventListener('canplay', canPlayHandler, { once: true });
      
      // タイムアウト設定
      setTimeout(() => {
        if (videoElement.paused) {
          reject(new Error('Video load timeout'));
        }
      }, 5000);
    });
  }
  
  // すでに読み込まれている場合は直接再生
  return videoElement.play();
}
