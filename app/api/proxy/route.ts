import { NextResponse } from 'next/server';

// メモリキャッシュの実装
const CACHE_MAX_SIZE = 100; // 最大キャッシュ数
const CACHE_EXPIRATION = 60 * 60 * 1000; // 1時間
const videoCache = new Map<string, { data: ArrayBuffer; timestamp: number }>();

// 古いキャッシュをクリアする関数
const cleanupCache = () => {
  if (videoCache.size >= CACHE_MAX_SIZE) {
    // 最も古いエントリを削除
    const entries = Array.from(videoCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // 最も古い25%のエントリを削除
    const toRemove = Math.floor(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      videoCache.delete(entries[i][0]);
    }
  }
  
  // 期限切れのエントリを削除
  const now = Date.now();
  for (const [key, entry] of videoCache.entries()) {
    if (now - entry.timestamp > CACHE_EXPIRATION) {
      videoCache.delete(key);
    }
  }
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const videoUrl = url.searchParams.get('url');
  
  if (!videoUrl) {
    return NextResponse.json({ error: 'URL parameter is missing' }, { status: 400 });
  }
  
  try {
    // キャッシュされたデータがあればそれを返す
    if (videoCache.has(videoUrl)) {
      const { data, timestamp } = videoCache.get(videoUrl)!;
      
      // キャッシュが新しければそれを使用
      if (Date.now() - timestamp < CACHE_EXPIRATION) {
        console.log(`Serving video from cache: ${videoUrl}`);
        
        // MIMEタイプを判定
        let contentType = 'video/mp4';
        if (videoUrl.endsWith('.m3u8')) {
          contentType = 'application/vnd.apple.mpegurl';
        } else if (videoUrl.endsWith('.ts')) {
          contentType = 'video/mp2t';
        }
        
        return new NextResponse(data, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600',
            'X-Cache': 'HIT'
          }
        });
      }
      
      // 期限切れはキャッシュから削除
      videoCache.delete(videoUrl);
    }
    
    console.log(`Fetching new video: ${videoUrl}`);
    
    // 高速化のためのタイムアウト設定
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒タイムアウト
    
    // 動画データのフェッチ
    const response = await fetch(videoUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Safari/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Referer': 'https://twitter.com/'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.status}`);
    }
    
    const data = await response.arrayBuffer();
    
    // キャッシュの定期的なクリーンアップ
    if (videoCache.size % 10 === 0) {
      cleanupCache();
    }
    
    // キャッシュに格納
    videoCache.set(videoUrl, {
      data,
      timestamp: Date.now()
    });
    
    // MIMEタイプを判定
    let contentType = 'video/mp4';
    if (videoUrl.endsWith('.m3u8')) {
      contentType = 'application/vnd.apple.mpegurl';
    } else if (videoUrl.endsWith('.ts')) {
      contentType = 'video/mp2t';
    }
    
    // データを返す
    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'X-Cache': 'MISS'
      }
    });
  } catch (error) {
    console.error('Error fetching video:', error);
    
    // エラーの場合も、必要に応じてキャッシュから提供を試みる
    if (videoCache.has(videoUrl)) {
      console.log(`Serving stale video from cache after fetch error: ${videoUrl}`);
      const { data } = videoCache.get(videoUrl)!;
      
      let contentType = 'video/mp4';
      if (videoUrl.endsWith('.m3u8')) {
        contentType = 'application/vnd.apple.mpegurl';
      }
      
      return new NextResponse(data, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
          'X-Cache': 'STALE'
        }
      });
    }
    
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 });
  }
}