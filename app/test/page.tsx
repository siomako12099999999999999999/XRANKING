/**
 * 機能概要：
 * ビデオ再生テストページコンポーネント
 * 
 * 主な機能：
 * 1. ビデオURLの直接再生テスト
 * 2. プロキシ経由の再生テスト
 * 3. エラーハンドリング
 * 4. ローディング状態の管理
 * 
 * 用途：
 * - ビデオ再生機能のテスト
 * - プロキシ機能の検証
 * - エラーケースの確認
 * - パフォーマンスの確認
 */

'use client';

import { useState, useEffect } from 'react';

export default function TestPage() {
  const [videoUrl, setVideoUrl] = useState('');
  const [tweetId, setTweetId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useProxy, setUseProxy] = useState(true); // デフォルトでプロキシを使用
  
  const testDirectVideo = () => {
    if (!videoUrl) return;
    setLoading(true);
    setError('');
    
    // 動画が直接再生可能か確認
    const video = document.createElement('video');
    video.onloadeddata = () => {
      setLoading(false);
      alert('動画の読み込みに成功しました！');
    };
    
    video.onerror = (e) => {
      setLoading(false);
      console.error("動画エラー:", e);
      setError('直接URLでの読み込みに失敗。CORSまたは形式の問題の可能性があります。');
    };
    
    video.src = videoUrl;
  };
  
  const testProxyVideo = async () => {
    if (!tweetId) return;
    setLoading(true);
    setError('');
    
    try {
      // APIからデータを取得
      const response = await fetch(`/api/tweets/single/${tweetId}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.tweet || !data.tweet.videoUrl) {
        throw new Error('動画URLが見つかりません');
      }
      
      setVideoUrl(data.tweet.videoUrl);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err.message);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">動画テストページ</h1>
      
      {/* 直接URLテスト */}
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl mb-3">直接URLテスト</h2>
        <div className="mb-3">
          <label className="block mb-1">動画URL:</label>
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="例: https://video.twimg.com/ext_tw_video/..."
          />
        </div>
        
        <div className="mb-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={useProxy}
              onChange={(e) => setUseProxy(e.target.checked)}
              className="mr-2"
            />
            プロキシを使用（CORS対策）
          </label>
        </div>
        
        <button
          onClick={testDirectVideo}
          disabled={loading || !videoUrl}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          {loading ? '読み込み中...' : 'テスト'}
        </button>
        
        {videoUrl && (
          <div className="mt-4">
            <h3 className="mb-2">動画プレーヤー:</h3>
            
            {useProxy ? (
              // プロキシ経由で再生
              <video
                src={`/api/videoproxy?url=${encodeURIComponent(videoUrl)}`}
                controls
                className="w-full"
                preload="metadata"
                onError={(e) => {
                  console.error("プロキシ動画エラー:", e);
                  setError("プロキシ経由での再生に失敗しました。コンソールを確認してください。");
                }}
              />
            ) : (
              // 直接URL経由で再生
              <video
                src={videoUrl}
                controls
                className="w-full"
                preload="metadata"
                onError={(e) => {
                  console.error("直接動画エラー:", e);
                  setError("直接URLでの再生に失敗しました。CORSの問題の可能性があります。");
                }}
              />
            )}
          </div>
        )}
      </div>
      
      {/* APIプロキシテスト */}
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl mb-3">APIプロキシテスト</h2>
        <div className="mb-3">
          <label className="block mb-1">ツイートID:</label>
          <input
            type="text"
            value={tweetId}
            onChange={(e) => setTweetId(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="例: 1758286558784192632"
          />
        </div>
        
        <button
          onClick={testProxyVideo}
          disabled={loading || !tweetId}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          {loading ? '読み込み中...' : 'APIからデータ取得'}
        </button>
      </div>
      
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          エラー: {error}
        </div>
      )}
    </div>
  );
}