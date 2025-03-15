// または他のツイート表示ページでの動画表示部分を修正
{tweet.videoUrl && tweet.videoUrl.includes('video.twimg.com') && (
  <video 
    src={`/api/videoproxy?url=${encodeURIComponent(tweet.videoUrl)}`}
    controls
    preload="metadata"
    className="w-full max-h-[500px] object-contain"
    poster={tweet.thumbnailUrl}
  />
)}