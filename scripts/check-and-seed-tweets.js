const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndSeedTweets() {
  try {
    console.log('ツイートデータを確認中...');
    
    // 現在のデータを確認
    const count = await prisma.tweet.count();
    console.log(`データベースには現在 ${count} 件のツイートがあります`);
    
    if (count > 0) {
      const tweets = await prisma.tweet.findMany({ take: 5 });
      console.log(`最初の${Math.min(5, tweets.length)}件のサンプル:`);
      tweets.forEach((tweet, i) => {
        console.log(`\n--- ツイート ${i+1} ---`);
        console.log(`内容: ${tweet.content?.substring(0, 50)}${tweet.content?.length > 50 ? '...' : ''}`);
        console.log(`いいね: ${tweet.likes}`);
        console.log(`リツイート: ${tweet.retweets}`);
        console.log(`再生回数: ${tweet.views}`);
        console.log(`作成日: ${tweet.timestamp}`);
        console.log(`動画URL: ${tweet.videoUrl}`);
      });
    }
    
    // 追加のサンプルデータが必要か確認
    if (count < 3) {
      console.log('\nサンプルデータを追加します...');
      
      // テストデータ
      const tweets = [
        {
          tweetId: '1758286558784192632',
          content: '先日投稿したレイヤードホワイトブラウンカールボブです！この時期人気のカラーとスタイルです🥰',
          videoUrl: 'https://video.twimg.com/ext_tw_video/1758286456174764032/pu/vid/720x1280/OREceo7lUopYq7lI.mp4',
          likes: 3876,
          retweets: 542,
          views: 67500,
          timestamp: new Date('2024-02-16T03:02:38Z'),
          authorId: 'user1',
          authorName: '美容師 MIZUKI',
          authorUsername: 'mizuki_hair',
        },
        {
          tweetId: '1756280712924688733',
          content: '#ゾッとする話迷言