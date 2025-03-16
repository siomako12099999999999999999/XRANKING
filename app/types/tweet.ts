export interface Tweet {
  id: string;
  tweetId: string | null;
  content: string | null;
  videoUrl: string | null;
  likes: number;
  retweets: number;
  views: number;
  timestamp: Date;
  authorName: string | null;
  authorUsername: string | null;
  authorProfileImageUrl: string | null;
  createdAt: Date;
}