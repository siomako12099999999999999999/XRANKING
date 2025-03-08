import React from 'react';

interface TweetProps {
  tweet: {
    id: string;
    videoUrl: string;
    likes: number;
    retweets: number;
    views: number;
    timestamp: string;
  };
}

const Tweet: React.FC<TweetProps> = ({ tweet }) => {
  return (
    <div className="tweet-container">
      <div className="tweet-embed">
        <iframe
          src={`https://platform.twitter.com/embed/Tweet.html?id=${tweet.id}`}
          title="Twitter Tweet"
          className="twitter-tweet"
        ></iframe>
      </div>
      <div className="tweet-stats">
        <span>Likes: {tweet.likes}</span>
        <span>Retweets: {tweet.retweets}</span>
        <span>Views: {tweet.views}</span>
      </div>
    </div>
  );
};

export default Tweet;
