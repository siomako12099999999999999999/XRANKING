import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTweets() {
  try {
    // 既存データをクリア（オプション）
    await prisma.tweet.deleteMany({});
    
    // サンプルデータ配列
    const sampleTweets = Array.from({ length: 20 }, (_, i) => ({
      tweetId: `1${i.toString().padStart(19, '0')}`,
      content: `サンプルツイート #${i + 1} これは自動生成されたテスト用の内容です。人気の動画ツイートをランキング表示するデモです。`,
      videoUrl: `https://video.twimg.com/ext_tw_video/${1000000 + i}/pu/vid/720x1280/sample_video_${i}.mp4`,
      likes: Math.floor(Math.random() * 10000) + 100,
      retweets: Math.floor(Math.random() * 5000) + 50,
      views: Math.floor(Math.random() * 100000) + 1000,
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
      authorId: `user${i % 5 + 1}`,
      authorName: `サンプルユーザー ${i % 5 + 1}`,
      authorUsername: `sample_user_${i % 5 + 1}`,
      authorProfileImageUrl: `/sample-avatars/avatar${i % 5 + 1}.png`,
    }));
    
    // バルクインサート
    await prisma.tweet.createMany({
      data: sampleTweets,
    });
    
    console.log(`${sampleTweets.length}件のサンプルツイートを登録しました`);
  } catch (error) {
    console.error('データ投入エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTweets()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });