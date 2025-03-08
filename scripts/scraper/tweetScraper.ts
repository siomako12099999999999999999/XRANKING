import { chromium, Browser, Page } from 'playwright';
import { PrismaClient } from '@prisma/client';
import * as winston from 'winston';

// ロガー設定
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/scraper-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/scraper.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

const prisma = new PrismaClient();

interface ScrapedTweet {
  id: string;
  videoUrl: string;
  likes: number;
  retweets: number;
  views: number;
  timestamp: Date;
}

type ErrorWithDetails = {
  name: string;
  message: string;
  stack?: string;
};

function formatError(error: unknown): ErrorWithDetails {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }
  return {
    name: 'UnknownError',
    message: String(error),
    stack: undefined
  };
}

async function login(page: Page): Promise<boolean> {
  try {
    logger.info('Starting login process...');
    
    // Twitter/Xのログインページへ移動
    await page.goto('https://twitter.com/login', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // スクリーンショット（デバッグ用）
    if (process.env.NODE_ENV === 'development') {
      await page.screenshot({ path: 'logs/login-start.png' });
    }

    // メールアドレス入力フォームが表示されるまで待機
    await page.waitForSelector('input[name="text"]', { 
      state: 'visible',
      timeout: 10000 
    });
    
    // メールアドレスをゆっくり入力
    await page.fill('input[name="text"]', process.env.TWITTER_EMAIL || '', { delay: 100 });
    await page.keyboard.press('Enter');
    
    // パスワード入力フォームが表示されるまで待機
    await page.waitForSelector('input[name="password"]', {
      state: 'visible',
      timeout: 10000
    });
    
    // パスワードをゆっくり入力
    await page.fill('input[name="password"]', process.env.TWITTER_PASSWORD || '', { delay: 100 });
    await page.keyboard.press('Enter');

    // ログイン成功の確認（複数の条件をチェック）
    const isLoggedIn = await Promise.race([
      page.waitForSelector('[data-testid="AppTabBar_Home_Link"]').then(() => true),
      page.waitForSelector('article').then(() => true),
      page.waitForTimeout(15000).then(() => false)
    ]);

    if (!isLoggedIn) {
      throw new Error('Login verification timeout');
    }

    logger.info('Login successful');
    return true;

  } catch (error) {
    const errorDetails = formatError(error);
    logger.error('Login failed:', {
      ...errorDetails,
      url: page.url()
    });
    
    // エラー時のスクリーンショット
    if (process.env.NODE_ENV === 'development') {
      await page.screenshot({ 
        path: `logs/login-error-${Date.now()}.png`,
        fullPage: true 
      });
    }
    
    return false;
  }
}

async function scrapeTwitterPage(url: string): Promise<ScrapedTweet | null> {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    browser = await chromium.launch({ 
      headless: false,
      args: ['--no-sandbox']
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    });
    
    page = await context.newPage();

    // ログイン処理
    const loginSuccess = await login(page);
    if (!loginSuccess) {
      throw new Error('Failed to login');
    }

    // ツイートページへ移動
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForSelector('article', { timeout: 10000 });
    
    // データ抽出の改善
    const tweetData = await page.evaluate(() => {
      const getLikeCount = () => {
        const likeText = document.querySelector('div[data-testid="like"]')?.getAttribute('aria-label');
        const match = likeText?.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };

      const getRetweetCount = () => {
        const retweetText = document.querySelector('div[data-testid="retweet"]')?.getAttribute('aria-label');
        const match = retweetText?.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };

      return {
        likes: getLikeCount(),
        retweets: getRetweetCount(),
        views: 0, // views count is currently not reliable
        videoUrl: document.querySelector('video')?.src || ''
      };
    });

    const tweetId = url.split('/status/')[1].split('?')[0];
    logger.info('Tweet data extracted', { tweetId, ...tweetData });

    return {
      id: tweetId,
      ...tweetData,
      timestamp: new Date()
    };

  } catch (error: unknown) {
    const formattedError = formatError(error);
    logger.error('Scraping error details:', {
      url,
      error: formattedError
    });
    return null;
  } finally {
    if (browser) await browser.close();
  }
}

async function scrapeVideoTweets(page: Page): Promise<ScrapedTweet[]> {
  try {
    logger.info('Navigating to video search page...');
    await page.goto('https://x.com/search?q=filter%3Anative_video&src=typed_query', {
      waitUntil: 'networkidle'
    });
    
    // タイムラインの読み込みを待機
    await page.waitForSelector('article[data-testid="tweet"]', { timeout: 30000 });
    
    // スクロールして投稿を読み込む
    for (let i = 0; i < 5; i++) {  // 5回スクロール
      await page.evaluate(() => window.scrollBy(0, 1000));
      await page.waitForTimeout(1000);
    }

    // 投稿データの抽出
    const tweets = await page.evaluate(() => {
      const tweetElements = document.querySelectorAll('article[data-testid="tweet"]');
      return Array.from(tweetElements).map(tweet => {
        const tweetLink = tweet.querySelector('a[href*="/status/"]')?.getAttribute('href');
        const tweetId = tweetLink?.split('/status/')[1];
        
        // いいね数とリツイート数の取得
        const getLikeCount = () => {
          const likeText = tweet.querySelector('[data-testid="like"]')?.getAttribute('aria-label');
          return parseInt(likeText?.match(/\d+/)?.[0] || '0');
        };
        
        const getRetweetCount = () => {
          const retweetText = tweet.querySelector('[data-testid="retweet"]')?.getAttribute('aria-label');
          return parseInt(retweetText?.match(/\d+/)?.[0] || '0');
        };

        return {
          id: tweetId || '',
          videoUrl: `https://twitter.com/i/status/${tweetId}`,
          likes: getLikeCount(),
          retweets: getRetweetCount(),
          views: 0,  // views count is not reliably accessible
          timestamp: new Date().toISOString()
        };
      }).filter(tweet => tweet.id && tweet.likes > 0);  // 有効なツイートのみ
    });

    logger.info(`Found ${tweets.length} video tweets`);
    return tweets.map(tweet => ({
      ...tweet,
      timestamp: new Date(tweet.timestamp)
    }));

  } catch (error) {
    logger.error('Error scraping video tweets:', formatError(error));
    return [];
  }
}

async function saveTweetData(tweet: ScrapedTweet) {
  try {
    await prisma.tweet.upsert({
      where: { id: tweet.id },
      update: tweet,
      create: tweet
    });
    logger.info('Tweet saved successfully:', { id: tweet.id });
  } catch (error: unknown) {
    logger.error('Database error:', { 
      tweet, 
      error: formatError(error)
    });
  }
}

// メイン実行関数
export async function collectTweets(): Promise<void> {
  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      slowMo: 50  // 操作速度を調整
    });
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0.0 Safari/537.36',
      locale: 'ja-JP',  // 日本語ロケールを指定
    });
    
    const page = await context.newPage();
    await page.setDefaultTimeout(30000);  // デフォルトのタイムアウトを30秒に設定
    
    // ログインと検索ページのスクレイピング
    if (await login(page)) {
      await page.waitForTimeout(2000); // ログイン後の少しの待機
      const tweets = await scrapeVideoTweets(page);
      
      // データ保存処理
      for (const tweet of tweets) {
        await saveTweetData(tweet);
        await page.waitForTimeout(500);
      }
      
      logger.info(`Successfully processed ${tweets.length} tweets`);
    } else {
      throw new Error('Login failed, cannot proceed with scraping');
    }
    
  } catch (error) {
    logger.error('Collection process failed:', formatError(error));
  } finally {
    if (browser) await browser.close();
  }
}

// テスト用の実際のツイートURL
if (require.main === module) {
  collectTweets().then(() => {
    logger.info('Scraping completed');
    process.exit(0);
  }).catch(error => {
    logger.error('Fatal error:', error);
    process.exit(1);
  });
}
