import { PrismaClient } from '@prisma/client';
import { getTwitterClient } from '../../lib/twitter';
import { sendErrorNotification } from './notification';

const prisma = new PrismaClient();

async function fetchTrendingVideos() {
  try {
    const client = getTwitterClient();
    const tweets = await client.tweets.tweetsRecentSearch({
      query: "has:media -is:retweet filter:videos",
      max_results: 100,
      "tweet.fields": ["public_metrics", "created_at", "attachments"]
    });

    if (tweets.data) {
      await prisma.tweet.createMany({
        data: tweets.data.map(tweet => ({
          id: tweet.id,
          videoUrl: `https://twitter.com/i/status/${tweet.id}`,
          likes: tweet.public_metrics?.like_count || 0,
          retweets: tweet.public_metrics?.retweet_count || 0,
          views: tweet.public_metrics?.impression_count || 0,
          timestamp: tweet.created_at ? new Date(tweet.created_at) : new Date()
        })),
        skipDuplicates: true
      });
    }
  } catch (error) {
    await sendErrorNotification('Tweet fetch failed', error);
    throw error;
  }
}

async function cleanupOldData() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await prisma.tweet.deleteMany({
      where: {
        timestamp: {
          lt: thirtyDaysAgo
        }
      }
    });
  } catch (error) {
    await sendErrorNotification('Cleanup failed', error);
    throw error;
  }
}

// 15分ごとに実行
setInterval(fetchTrendingVideos, 15 * 60 * 1000);
// 毎日1回実行
setInterval(cleanupOldData, 24 * 60 * 60 * 1000);

// 初回実行
fetchTrendingVideos();
cleanupOldData();
