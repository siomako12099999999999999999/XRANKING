import puppeteer from 'puppeteer';

async function scrapeTweet(tweetId: string) {
  // ツイートページのURL
  const url = `https://twitter.com/i/status/${tweetId}`;
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    // 必要なデータの抽出（セレクタはTwitterのDOM構造に依存します）
    // ここは実際の要件に応じてカスタマイズしてください
    const tweetData = await page.evaluate(() => {
      const data: any = {};
      // 例: 動画用要素やメトリクス取得用のセレクタ
      const videoElement = document.querySelector('video');
      data.videoUrl = videoElement ? videoElement.getAttribute('src') : null;
      // 他のメトリクスはページ内の要素から抽出する
      // data.likes = ...;
      // data.retweets = ...;
      return data;
    });
    console.log(`Tweet ${tweetId} data:`, tweetData);
  } catch (err) {
    console.error(`Error scraping tweet ${tweetId}:`, err);
  } finally {
    await browser.close();
  }
}

async function main() {
  // スクレイピングしたいツイートIDのリスト
  const tweetIds = ['ツイートID1', 'ツイートID2'];
  for (const id of tweetIds) {
    await scrapeTweet(id);
  }
}

main().catch(console.error);
