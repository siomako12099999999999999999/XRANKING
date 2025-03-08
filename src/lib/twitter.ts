import { Client } from 'twitter-api-sdk';
import { validateEnvVariables } from './security';

let twitterClient: Client | null = null;

export function getTwitterClient() {
  if (!twitterClient) {
    validateEnvVariables();
    twitterClient = new Client(process.env.TWITTER_API_KEY!);
  }
  return twitterClient;
}

export async function fetchTweetById(id: string) {
  const client = getTwitterClient();
  try {
    return await client.tweets.findTweetById(id);
  } catch (error) {
    console.error(`Failed to fetch tweet ${id}:`, error);
    throw error;
  }
}

// レート制限に対応した一括取得
export async function fetchTweetsInBatches(ids: string[]) {
  const batchSize = 100; // Twitter APIの制限に基づく
  const results = [];
  
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    await new Promise(resolve => setTimeout(resolve, 1000)); // レート制限対策
    const tweets = await getTwitterClient().tweets.findTweetsById({
      ids: batch,
      "tweet.fields": ["public_metrics", "created_at"]
    });
    results.push(...(tweets.data || []));
  }
  
  return results;
}
