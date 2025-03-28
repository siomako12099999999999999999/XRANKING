'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MobilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [searchParams, setSearchParams] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  // マウント状態を確認
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // クライアントサイドでのみ実行されるコード
  useEffect(() => {
    // マウントされていない場合は何もしない
    if (typeof window === 'undefined') return;

    try {
      // クエリパラメータを取得
      const params = window.location.search;
      setSearchParams(params);

      // モバイルデバイス判定の関数
      const isMobileDevice = () => {
        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        const isMobileSize = window.innerWidth <= 768;
        return mobileRegex.test(userAgent) || isMobileSize;
      };

      // モバイルデバイスかどうかを判定して状態を設定
      const mobile = isMobileDevice();
      setIsMobile(mobile);

      // スタイル設定
      let style = document.createElement('style');
      style.innerHTML = `
        body > header,
        body > nav,
        .header-container,
        #header,
        .site-header {
          display: none !important;
        }
        
        body {
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          background-color: black !important;
        }
      `;
      document.head.appendChild(style);

      if (mobile) {
        // モバイルデバイスの場合、専用ページに移動
        router.push('/mobile-safari' + params);
      } else {
        // PCの場合は既存の実装をiframeで表示
        setIsLoading(false);
      }
      
      return () => {
        // styleが実際にDOMに存在していることを確認してから削除
        if (style && style.parentNode) {
          style.parentNode.removeChild(style);
        }
      };
    } catch (error) {
      console.error('クライアントサイド初期化エラー:', error);
      // エラーが発生した場合もローディング状態を解除
      setIsLoading(false);
    }
  }, [router]); // routerのみを依存配列に追加

  // サーバーサイドまたはマウント前は必ずローディング表示
  if (!isMounted || isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // PCの場合は既存の実装をiframeで表示（PCアイコンのホームボタン付き）
  return (
    <>
      <iframe 
        src={`/mobile-view${searchParams}`}
        className="fixed inset-0 w-full h-full border-0 bg-black"
        title="モバイルビュー"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          border: 'none',
          margin: 0,
          padding: 0,
          overflow: 'hidden',
          zIndex: 999999
        }}
        allow="autoplay; fullscreen; camera; microphone; picture-in-picture"
        allowFullScreen
      />
      {!isMobile && (
        <a 
          href={`/${searchParams}`} 
          className="fixed bottom-4 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
          style={{ zIndex: 1000000 }}
          title="PC版に切り替え"
        >
          {/* PC/デスクトップアイコン */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </a>
      )}
    </>
  );
}