import time
import sys
import os
import atexit
import pyodbc  # 追加
try:
    from playwright.sync_api import sync_playwright, TimeoutError
except ImportError:
    print("playwright モジュールが見つかりません。インストールを試みます...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "playwright"])
    from playwright.sync_api import sync_playwright, TimeoutError
try:
    from dotenv import load_dotenv
except ImportError:
    print("dotenv モジュールが見つかりません。インストールを試みます...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "python-dotenv"])
    from dotenv import load_dotenv


# .env ファイルを読み込む
load_dotenv()
temp_video_data = []

# Twitterのログイン情報を .env から取得
TWITTER_EMAIL = os.getenv("TWITTER_EMAIL")
TWITTER_PASSWORD = os.getenv("TWITTER_PASSWORD")

# データベース接続情報を .env から取得
DATABASE_URL = os.getenv("DATABASE_URL")

# 検索設定
SEARCH_KEYWORDS = [
    "JAV",
    
]
# スクロール回数（取得動画数の調整用）
SCROLL_COUNT = 2000
# スクロール間隔（秒）
SCROLL_INTERVAL = 1


def connect_to_db():
    """データベースに接続する"""
    try:
        conn = pyodbc.connect(
            "DRIVER={ODBC Driver 17 for SQL Server};"
            f"SERVER={os.getenv('SQL_SERVER')};"
            f"DATABASE={os.getenv('SQL_DATABASE')};"
            f"UID={os.getenv('SQL_USER')};"
            f"PWD={os.getenv('SQL_PASSWORD')};"
            "TrustServerCertificate=yes;"
        )
        print("✅ データベース接続成功！")
        return conn
    except pyodbc.Error as e:
        print(f"❌ データベース接続失敗: {e}")
        return None

def insert_video_data(conn, video_data):
    """動画情報をデータベースに登録する"""
    cursor = conn.cursor()
    try:
        video_url, likes, retweets, views, timestamp = video_data
        
        # 数値データの変換処理を改善
        def convert_metric(value):
            try:
                value = value.replace(',', '')
                if 'K' in value:
                    return int(float(value.replace('K', '')) * 1000)
                elif 'M' in value:
                    return int(float(value.replace('M', '')) * 1000000)
                return int(value)
            except (ValueError, AttributeError):
                return 0

        likes = convert_metric(likes)
        retweets = convert_metric(retweets)
        views = convert_metric(views)

        # UPSERTクエリの使用
        cursor.execute("""
            MERGE Tweet AS target
            USING (VALUES (?, ?, ?, ?, ?)) AS source (videoUrl, likes, retweets, views, timestamp)
            ON target.videoUrl = source.videoUrl
            WHEN MATCHED THEN
                UPDATE SET
                    likes = source.likes,
                    retweets = source.retweets,
                    views = source.views,
                    timestamp = source.timestamp,
                    updatedAt = GETDATE()
            WHEN NOT MATCHED THEN
                INSERT (videoUrl, likes, retweets, views, timestamp, createdAt, updatedAt)
                VALUES (source.videoUrl, source.likes, source.retweets, source.views, source.timestamp, GETDATE(), GETDATE());
        """, (video_url, likes, retweets, views, timestamp))

        conn.commit()
        print(f"✅ 動画情報を保存しました: {video_url}")
        print(f"📊 保存されたメトリクス - いいね: {likes}, リツイート: {retweets}, 視聴: {views}")

    except pyodbc.Error as e:
        print(f"❌ データベース操作に失敗しました: {e}")
        conn.rollback()
    except Exception as e:
        print(f"❌ 予期しないエラーが発生しました: {e}")
        conn.rollback()

def login_to_twitter(page):
    """X（旧Twitter）にログインする"""
    print("🔑 ログインページを開きます...")
    try:
        page.goto("https://x.com/i/flow/login?redirect_after_login=%2Fcompose%2Fpost", timeout=120000)
        page.wait_for_load_state("networkidle")  # ページの完全な読み込みを待つ
    except TimeoutError:
        print("❌ ログインページの読み込みに失敗しました。")
        return False

    try:
        # メールアドレス（またはユーザー名）を入力
        print("✍️ メールアドレスを入力します...")
        page.wait_for_selector("input[name='text']", timeout=10000)
        page.fill("input[name='text']", TWITTER_EMAIL)
        page.press("input[name='text']", "Enter")
        time.sleep(3)
        
        # ★追加: 次の入力画面が表示された場合、TWITTER_ID を自動入力
        try:
            # 例えば、同じセレクター input[name='text'] で表示されるケースを想定
            page.wait_for_selector("input[name='text']", timeout=5000)
            print("✍️ TWITTER_ID入力画面が表示されました。自動入力を試みます...")
            # .env の TWITTER_ID を使用（公開環境変数の場合は適切に設定してください）
            TWITTER_ID = os.getenv("TWITTER_ID")
            if TWITTER_ID:
                page.fill("input[name='text']", TWITTER_ID)
                page.press("input[name='text']", "Enter")
                time.sleep(3)
            else:
                print("⚠️ TWITTER_ID が設定されていません。")
        except TimeoutError:
            print("ℹ️ TWITTER_ID入力画面は表示されませんでした。")

        # パスワードを入力
        print("🔒 パスワードを入力します...")
        page.wait_for_selector("input[name='password']", timeout=10000)
        page.fill("input[name='password']", TWITTER_PASSWORD)
        page.press("input[name='password']", "Enter")
        time.sleep(5)

        # 2FA（2段階認証）が求められるかチェック
        try:
            page.wait_for_selector("input[name='verification_code']", timeout=5000)
            print("⚠️ 2FAが有効になっています。手動でコードを入力してください。")
            input("🔑 2FAコードを入力したらEnterキーを押してください...")
        except TimeoutError:
            print("✅ 2FAの入力画面は表示されませんでした。ログイン継続。")

        # ログイン後の画面遷移を確認
        print("✅ ログイン後の画面遷移を確認中...")
        page.wait_for_selector("a[href='/home']", timeout=15000)

        print("✅ ログイン成功！")
        return True

    except TimeoutError:
        print("❌ ログイン画面の操作に失敗しました。")
        return False

def search_videos(page, query):
    """指定されたクエリで動画を検索し、データベースに登録する"""
    print(f"🔍 動画を検索: {query}")
    search_url = f"https://x.com/search?q={query}%20filter%3Avideos&src=typed_query"
    page.goto(search_url, timeout=120000)

    # スクロールして動画をより多く読み込む
    print(f"📜 {SCROLL_COUNT}回のスクロールを開始...")
    conn = connect_to_db()
    
    if not conn:
        print("❌ データベース接続に失敗しました。処理をスキップします。")
        return

    collected_videos = []  # 途中までのデータを保存するリスト

    try:
        for i in range(SCROLL_COUNT):
            page.evaluate("window.scrollBy(0, window.innerHeight)")
            time.sleep(SCROLL_INTERVAL)
            print(f"  スクロール: {i + 1}/{SCROLL_COUNT}")
            
            videos = page.query_selector_all('article[data-testid="tweet"]')
            for video in videos:
                try:
                    video_player = video.query_selector('div[data-testid="videoPlayer"]')
                    if not video_player:
                        continue
                    
                    tweet_link = video.query_selector('a[href*="/status/"]')
                    if not tweet_link:
                        continue

                    video_url = "https://twitter.com" + tweet_link.get_attribute("href")
                    
                    likes_elem = video.query_selector('[data-testid="like"] span span')
                    likes = likes_elem.text_content().strip() if likes_elem else "0"

                    retweets_elem = video.query_selector('[data-testid="retweet"] span span')
                    retweets = retweets_elem.text_content().strip() if retweets_elem else "0"

                    analytics_link = video.query_selector('a[href*="/analytics"]')
                    views = analytics_link.text_content().split()[0] if analytics_link else "0"

                    time_elem = video.query_selector('time')
                    timestamp = time_elem.get_attribute("datetime") if time_elem else None

                    if timestamp:
                        video_data = (video_url, likes, retweets, views, timestamp)
                        collected_videos.append(video_data)

                        # 📌 ここでデータを即時データベースに保存
                        insert_video_data(conn, video_data)

                except Exception as e:
                    print(f"⚠️ 動画データの取得に失敗しました: {e}")

    except Exception as e:
        print(f"❌ スクロール中にエラーが発生しました: {e}")

    finally:
        # 検索が中断されてもここでデータベースに保存
        if collected_videos:
            print(f"💾 {len(collected_videos)} 件の動画データを保存しました。")
        conn.close()

    print("✅ 動画検索完了！")


def get_browser_context(p):
    browser_args = [
        '--autoplay-policy=no-user-gesture-required',
        '--disable-web-security',
        '--enable-features=NetworkService,NetworkServiceInProcess',
        '--no-sandbox'
    ]
    
    try:
        
        browser = p.chromium.connect_over_cdp("http://localhost:9222")  # 既存の Chrome に接続
        context = browser.contexts[0] if browser.contexts else browser.new_context()
        print("✅ 既存の Chromium に接続しました！")
        return browser, context
    except Exception as e:
        print(f"⚠️ 既存のブラウザに接続できませんでした: {e}")
        print("🆕 新しいブラウザを永続セッションで起動します...")
        
        # 永続セッションで Chromium を起動
        browser = p.chromium.launch_persistent_context(
            "C:\\Users\\sioma\\XRANKING\\user_data",
            headless=False,
            viewport={'width': 1280, 'height': 800},
            timeout=60000,
            args=browser_args,
            ignore_default_args=['--mute-audio']
        )
        return browser, browser

def main():
    with sync_playwright() as p:
        browser, context = get_browser_context(p)
        page = context.new_page()
        
        # メディア自動再生の許可
        page.set_extra_http_headers({
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
            'Range': 'bytes=0-'
        })
        
        # JavaScript設定の追加
        page.add_init_script("""
            Object.defineProperty(navigator, 'mediaCapabilities', {
                get: () => ({
                    decodingInfo: async () => ({ supported: true, smooth: true, powerEfficient: true })
                })
            });
        """)
        
        if not login_to_twitter(page):
            print("❌ ログインに失敗しました。スクリプトを終了します。")
            return

        # 各キーワードで検索を実行
        for keyword in SEARCH_KEYWORDS:
            print(f"\n🔎 キーワード「{keyword}」で検索を開始")
            search_videos(page, keyword)
            time.sleep(5)  # 次の検索までの間隔

        print("\n✨ すべての検索が完了しました！")
        print("🛑 スクリプト終了。ブラウザを開いたままにします。手動で閉じてください。")
        while True:
            time.sleep(60)  # 1分ごとにループし続ける

def save_temp_video_data():
    """スクリプト終了時に取得済みのデータを保存"""
    if temp_video_data:
        conn = connect_to_db()
        if conn:
            print(f"🛑 スクリプト終了前に {len(temp_video_data)} 件のデータを登録します...")
            for video_data in temp_video_data:
                insert_video_data(conn, video_data)
            conn.close()
        else:
            print("❌ データベース接続に失敗し、未登録データを保存できませんでした。")
    else:
        print("✅ すべてのデータは正常に登録されました。")

# スクリプト終了時に未登録データを保存するよう登録
atexit.register(save_temp_video_data)

if __name__ == "__main__":
    main()
