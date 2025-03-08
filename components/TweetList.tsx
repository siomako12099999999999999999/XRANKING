import React from 'react';
import Image from 'next/image';

interface Tweet {
  id: string;
  tweetId: string;
  content: string;
  videoUrl: string;
  likes: number;
  retweets: number;
  views: number;
  timestamp: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorProfileImageUrl: string;
}

interface TweetListProps {
  tweets: Tweet[];
}

const TweetList: React.FC<TweetListProps> = ({ tweets }) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  if (!tweets || tweets.length === 0) {
    return <div className="text-center py-10">表示するツイートがありません</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tweets.map((tweet) => (
        <div
          key={tweet.id}
          className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          {/* ビデオプレビュー (サムネイル) */}
          <div className="relative aspect-video bg-black">
            {tweet.videoUrl ? (
              <a href={`https://twitter.com/i/status/${tweet.tweetId}`} target="_blank" rel="noopener noreferrer">
                {/* サムネイル表示（動画のプレビュー画像がない場合はプレースホルダーを表示） */}
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <div className="text-white">▶️ 動画を再生</div>
                </div>
                {/* 実際の動画があればここに表示 */}
              </a>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <p className="text-gray-500">動画なし</p>
              </div>
            )}
          </div>

          {/* ツイート情報 */}
          <div className="p-4">
            {/* ユーザー情報 */}
            <div className="flex items-center mb-3">
              <div className="relative h-10 w-10 rounded-full overflow-hidden mr-3">
                {tweet.authorProfileImageUrl ? (
                  <Image
                    src={tweet.authorProfileImageUrl}
                    alt={tweet.authorName}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200"></div>
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{tweet.authorName}</h3>
                <p className="text-sm text-gray-500">@{tweet.authorUsername}</p>
              </div>
            </div>

            {/* ツイート本文 */}
            <p className="text-gray-700 mb-3 line-clamp-3">{tweet.content}</p>

            {/* エンゲージメント情報 */}
            <div className="flex justify-between text-sm text-gray-500">
              <div className="flex space-x-4">
                <span>❤️ {formatNumber(tweet.likes)}</span>
                <span>🔁 {formatNumber(tweet.retweets)}</span>
                <span>👁️ {formatNumber(tweet.views)}</span>
              </div>
              <span>{formatDate(tweet.timestamp)}</span>
            </div>

            {/* ツイートリンク */}
            <a
              href={`https://twitter.com/i/status/${tweet.tweetId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600 transition-colors"
            >
              ツイートを見る
            </a>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TweetList;