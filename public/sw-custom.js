// キャッシュの問題を解決するためのカスタムService Worker設定

// Service Workerのインストール時に即座にアクティブになるように設定
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

// Service Workerのアクティブ化時に即座にページの制御を取得
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  
  // すべてのキャッシュを確認してクリーンアップ
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 古いNext.jsの静的アセットキャッシュを削除
          if (cacheName.startsWith('workbox-') || cacheName.includes('next-static')) {
            console.log('Deleting cache:', cacheName);
            return caches.delete(cacheName);
          }
          return Promise.resolve(); // nullの代わりにresolveされたPromiseを返す
        })
      );
    }).then(() => {
      // 現在開いているすべてのタブに対して制御を取得
      return clients.claim();
    }).catch(error => {
      console.error('Cache cleanup error:', error);
    })
  );
});

// 特定のリクエストパターンの場合、キャッシュをバイパスしてネットワークから直接取得
self.addEventListener('fetch', (event) => {
  // 非HTTPリクエストをスキップ
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // next/static/chunks のようなNext.jsの重要な静的アセットは常に新しいバージョンを取得
  if (event.request.url.includes('/_next/static/chunks/') || 
      event.request.url.includes('/_next/static/webpack/')) {
    
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(error => {
        console.error('Fetch error:', error);
        // エラーが発生した場合はキャッシュを試す
        return caches.match(event.request);
      })
    );
  }
});
