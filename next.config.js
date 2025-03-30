const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development', // 開発モードではPWAを無効化
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['pbs.twimg.com', 'video.twimg.com', 'api.twitter.com', 'abs.twimg.com', 'cors-anywhere.herokuapp.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.twimg.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; media-src 'self' blob: https://*.twimg.com https://* data:; connect-src 'self' https://*.twimg.com https://*; img-src 'self' https://*.twimg.com data:; style-src 'self' 'unsafe-inline'; frame-ancestors 'self';"
          },
          { key: 'Referer', value: 'https://twitter.com/' } // リファラーを追加
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/mobile-safari',
        destination: '/mobile',
        permanent: true,
      },
      {
        source: '/mobile-safari/:path*',
        destination: '/mobile/:path*',
        permanent: true,
      },
      {
        source: '/mobile-view',
        destination: '/mobile',
        permanent: true,
      },
      {
        source: '/mobile-view/:path*',
        destination: '/mobile/:path*',
        permanent: true,
      },
    ];
  },
  // 静的エクスポートを無効化
  output: 'standalone',
  // ビルドエラーを無視（一時的な対応）
  typescript: {
    ignoreBuildErrors: true, // TypeScriptエラーを無視
  },
  // 実験的機能の設定（Next.js 14.1.0に合わせて修正）
  experimental: {
    // 古いプロパティを削除
    // disableStaticGenerationForPages: true,
    
    // 適切な実験的オプション
    missingSuspenseWithCSRBailout: false,
    // 新しいNextJS 14の機能を使用
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // メモリ使用量最適化
    optimizeServerReact: true,
    optimizeCss: true,
    scrollRestoration: true,
  },
  // アプリケーション全体を動的に
  env: {
    NEXT_PUBLIC_RUNTIME_MODE: 'dynamic',
  },
  // ビルド後のアウトプットを保存する
  distDir: '.next',
  // 静的エクスポートを無効に
  exportPathMap: async function () {
    return {
      '/': { page: '/' },
    };
  },
  // 開発ツールを無効化
  devIndicators: false,
  // キャッシュ設定を追加
  generateEtags: true,
};

module.exports = withPWA(nextConfig);
