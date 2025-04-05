/**
 * 機能概要：
 * ツイートカードコンポーネント
 * 
 * 主な機能：
 * 1. ツイート情報の表示
 * 2. ビデオ再生の制御
 * 3. エンゲージメント情報の表示
 * 4. ランキング表示
 * 
 * 用途：
 * - ツイートの視覚的表現
 * - ランキング情報の表示
 * - ユーザーインタラクション
 * - 外部リンクの提供
 */

import React, { useState, useRef, useEffect } from 'react'; // useEffectをインポート
import Link from 'next/link'; // Linkをインポート
import { useInView } from 'react-intersection-observer'; // useInViewをインポート
import { FaHeart, FaRetweet, FaEye, FaTwitter, FaExternalLinkAlt, FaTrophy, FaMedal } from 'react-icons/fa';
import { Tweet, SortType } from '@/app/types'; // SortType をインポート
import { formatNumber, formatDate } from '@/lib/utils';

type TweetCardProps = {
  tweet: Tweet;
  rank: number;
  sort: SortType; // sort プロパティを追加
};

const TweetCard: React.FC<TweetCardProps> = ({ tweet, rank, sort }) => { // sort を受け取る
  const [isHovered, setIsHovered] = useState(false);
  // isVideoLoaded は遅延読み込みには不要なため削除してもよい
  // const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Intersection Observerの設定
  const { ref: cardRef, inView: isCardVisible } = useInView({
    triggerOnce: true, // 一度表示されたら監視を停止
    threshold: 0.1, // 10%表示されたらトリガー
    rootMargin: '200px 0px', // ビューポートの上下200pxマージンで早めに読み込み開始
  });

  // サムネイルのフォールバック処理
  const thumbnailUrl = tweet.thumbnailUrl || undefined;

  // 元ツイートURLの生成（ない場合はtweetIdから生成）
  const getOriginalUrl = () => {
    if (tweet.originalUrl) return tweet.originalUrl;
    
    // tweetIdがあれば、標準的なTwitter/XのURLを生成
    if (tweet.tweetId && tweet.authorUsername) {
      return `https://twitter.com/${tweet.authorUsername}/status/${tweet.tweetId}`;
    }
    
    return null;
  };

  const originalUrl = getOriginalUrl();

  // handleVideoLoad は isVideoLoaded を使わないため削除
  
  const handleMouseEnter = () => {
    setIsHovered(true);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // 順位によって色やアイコンを変える
  const getRankStyle = (rank: number) => {
    if (rank === 1) {
      return {
        bgColor: 'bg-yellow-500',
        textColor: 'text-yellow-500',
        icon: <FaTrophy className="mr-1" />
      };
    } else if (rank === 2) {
      return {
        bgColor: 'bg-gray-400',
        textColor: 'text-gray-400',
        icon: <FaMedal className="mr-1" />
      };
    } else if (rank === 3) {
      return {
        bgColor: 'bg-amber-700',
        textColor: 'text-amber-700',
        icon: <FaMedal className="mr-1" />
      };
    } else {
      return {
        bgColor: 'bg-blue-600',
        textColor: 'text-blue-600',
        icon: null
      };
    }
  };

  const rankStyle = getRankStyle(rank);

  // Twitter/X元ツイートへのリンクを開く
  const openOriginalTweet = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const url = getOriginalUrl();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      ref={cardRef} // Intersection Observerのrefをセット
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 順位表示バッジ */}
      <div className={`absolute top-2 left-2 z-10 ${rankStyle.bgColor} text-white font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-md`}>
        {rank}
      </div>
      
      <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-700">
        {/* サムネイル/動画要素 */}
        <div className="w-full h-full relative">
          {/* isCardVisibleがtrueの場合のみvideo要素をレンダリング */}
          {isCardVisible && tweet.videoUrl ? (
            <>
              <video
                ref={videoRef}
                src={tweet.videoUrl}
                className="w-full h-full object-cover"
                preload="metadata" // metadataは読み込むが、動画データ自体は遅延
                poster={thumbnailUrl}
                // onLoadedData={handleVideoLoad} // isVideoLoadedを使わない場合は不要
                controls
              />
              {/* 元ツイートへのリンクボタン */}
              {originalUrl && (
                <a 
                  href={originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-3 right-3 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-md transition-colors duration-200 flex items-center justify-center z-20"
                  title="元のツイートを見る"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FaTwitter size={16} />
                </a>
              )}
            </>
          ) : (
            // カードが見える前、または動画URLがない場合はサムネイル（またはプレースホルダー）を表示
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
              {thumbnailUrl ? (
                <img src={thumbnailUrl} alt="Video thumbnail" className="w-full h-full object-cover opacity-50" />
              ) : (
                <span className="text-gray-400 dark:text-gray-500">No Video</span>
              )}
              {/* ローディングインジケーターなどを追加しても良い */}
            </div>
          )}
        </div>
        {/* エンゲージメント情報 */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pointer-events-none">
          <div className="flex items-center space-x-4 text-white text-sm">
            <div className="flex items-center">
              <FaHeart className="mr-1 text-red-500" />
              <span>{formatNumber(tweet.likes)}</span>
            </div>
            <div className="flex items-center">
              <FaRetweet className="mr-1 text-green-500" />
              <span>{formatNumber(tweet.retweets)}</span>
            </div>
            {tweet.views && (
              <div className="flex items-center">
                <FaEye className="mr-1 text-blue-400" />
                <span>{formatNumber(tweet.views)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {/* 順位情報 - 上位3位に特別なスタイル (sortがlatestでない場合のみ表示) */}
        {rank <= 3 && sort !== 'latest' && (
          <div className={`mb-2 flex items-center ${rankStyle.textColor} font-bold`}>
            {rankStyle.icon}
            <span>
              {rank === 1 ? '1位' : rank === 2 ? '2位' : '3位'}
            </span>
          </div>
        )}
        
        {/* 投稿者情報 */}
        <div className="flex items-center mb-3">
          {tweet.authorProfileImageUrl ? (
            <img 
              src={tweet.authorProfileImageUrl} 
              alt={tweet.authorName || 'ユーザー'}
              className="w-8 h-8 rounded-full mr-2"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 mr-2"></div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{tweet.authorName || 'Unknown'}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">@{tweet.authorUsername || 'unknown'}</p>
          </div>
        </div>
        
        {/* ツイート内容 */}
        <p className="text-sm text-gray-800 dark:text-gray-200 mb-3 line-clamp-2">
          {tweet.content || 'No content'}
        </p>
        
        {/* 日付と元ツイートへのリンク */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{formatDate(tweet.timestamp)}</span>
          
          {originalUrl && (
            <a
              href={originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-500 hover:text-blue-600 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <FaExternalLinkAlt className="mr-1" />
              元ツイート
            </a>
          )}
        </div>

        {/* 詳細ページへのリンクを追加 */}
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <Link 
            href={`/video/${tweet.id}`} 
            className="text-sm text-blue-600 hover:underline dark:text-blue-400 font-medium"
          >
            詳細を見る &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TweetCard;
