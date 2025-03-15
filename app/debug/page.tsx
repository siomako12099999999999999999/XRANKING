import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function DebugPage() {
  // 最新の5件のツイートを取得
  const tweets = await prisma.tweet.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">デバッグ情報</h1>
      
      <h2 className="text-xl mb-3">最新のツイート (5件)</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">ID</th>
              <th className="p-2 border">ツイートID</th>
              <th className="p-2 border">動画URL</th>
              <th className="p-2 border">タイムスタンプ</th>
              <th className="p-2 border">アクション</th>
            </tr>
          </thead>
          <tbody>
            {tweets.map(tweet => (
              <tr key={tweet.id}>
                <td className="p-2 border">{tweet.id}</td>
                <td className="p-2 border">{tweet.tweetId}</td>
                <td className="p-2 border">
                  <div className="max-w-xs truncate">
                    {tweet.videoUrl}
                  </div>
                </td>
                <td className="p-2 border">
                  {tweet.timestamp?.toLocaleString()}
                </td>
                <td className="p-2 border">
                  <a 
                    href={tweet.videoUrl || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    動画を確認
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}