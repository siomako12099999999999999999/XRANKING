import styles from '../styles/TweetLink.module.css';

interface TweetLinkProps {
  tweetId: string;
}

export default function TweetLink({ tweetId }: TweetLinkProps) {
  const tweetUrl = `https://twitter.com/i/status/${tweetId}`;
  
  return (
    <div className={styles.tweetWrapper}>
      <a 
        href={tweetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.tweetLink}
      >
        <span className={styles.playIcon}>▶</span>
        <span className={styles.linkText}>ツイートを開く</span>
      </a>
    </div>
  );
}
