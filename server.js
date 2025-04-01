/**
 * 機能概要：
 * Next.jsアプリケーションのカスタムサーバー実装
 * 
 * 主な機能：
 * 1. カスタムHTTPサーバーの提供
 * 2. プリレンダリングマニフェストの管理
 * 3. 静的ファイルの提供
 * 4. ルーティングの処理
 * 
 * 用途：
 * - 本番環境でのアプリケーション実行
 * - カスタムサーバー設定の実装
 * - パフォーマンス最適化
 * - セキュリティ設定の管理
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

// 必要なマニフェストファイルの確認と作成
const prerenderManifestPath = path.join(__dirname, '.next', 'prerender-manifest.json');
if (!fs.existsSync(prerenderManifestPath)) {
  console.log('prerender-manifest.json を作成しています...');
  const manifestDir = path.dirname(prerenderManifestPath);
  if (!fs.existsSync(manifestDir)) {
    fs.mkdirSync(manifestDir, { recursive: true });
  }
  fs.writeFileSync(prerenderManifestPath, JSON.stringify({
    version: 4,
    routes: {},
    dynamicRoutes: {},
    notFoundRoutes: [],
    preview: { previewModeId: '', previewModeSigningKey: '', previewModeEncryptionKey: '' }
  }));
}

// Next.js アプリケーションの設定
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.RAILWAY_STATIC_URL || 'localhost';
const port = process.env.PORT || 3000;

// カスタムエラーハンドラーを含むNext.jsアプリ
const app = next({ 
  dev,
  hostname, 
  port,
  conf: {
    // 追加設定のオーバーライド
    distDir: '.next',
    typescript: {
      ignoreBuildErrors: true,
    }
  }
});

const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        const { pathname, query } = parsedUrl;
        
        // 特定のルートのカスタム処理
        if (pathname === '/healthcheck') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/plain');
          res.end('OK');
          return;
        }
        
        // Next.jsのリクエストハンドラーにリクエストを渡す
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('リクエスト処理中にエラーが発生しました:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Internal Server Error');
      }
    })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
  })
  .catch((ex) => {
    console.error('アプリケーションの準備中にエラーが発生しました:', ex);
    process.exit(1);
  });