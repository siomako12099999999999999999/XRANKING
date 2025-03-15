const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'randomuser.me',      // モックデータの画像用
      'pbs.twimg.com',      // Twitter プロフィール画像用
      'abs.twimg.com',      // Twitter メディア用
      'video.twimg.com'     // Twitter 動画用
    ]
  },
  async headers() {
    return [
      {
        source: '/api/videoproxy',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
