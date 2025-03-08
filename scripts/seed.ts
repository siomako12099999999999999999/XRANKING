import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const testTweets = Array.from({ length: 50 }, (_, i) => ({
    videoUrl: `https://twitter.com/user/status/${1000 + i}`,
    likes: Math.floor(Math.random() * 1000),
    retweets: Math.floor(Math.random() * 500),
    views: Math.floor(Math.random() * 10000),
    timestamp: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
  }));

  for (const tweet of testTweets) {
    await prisma.tweet.create({
      data: tweet,
    });
  }

  console.log('✅ テストデータを挿入しました');
}

main()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });