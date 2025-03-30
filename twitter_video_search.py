import time
import sys
import os
import atexit
import pyodbc  # 追加
import random  # ランダム化のために追加
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

# デバッグモード設定
DEBUG = True  # デバッグ情報を表示するかどうか

def debug_log(message):
    """デバッグ用のログ出力"""
    if DEBUG:
        print(f"[DEBUG] {message}")

# Twitterのログイン情報を .env から取得
TWITTER_EMAIL = os.getenv("TWITTER_EMAIL")
TWITTER_PASSWORD = os.getenv("TWITTER_PASSWORD")

# データベース接続情報を .env から取得
DATABASE_URL = os.getenv("DATABASE_URL")

# 検索設定
SEARCH_KEYWORDS = [
    " ",
    
]
# スクロール回数（取得動画数の調整用）
SCROLL_COUNT = 2000
# スクロール間隔（秒）
SCROLL_INTERVAL = 1


def connect_to_db():
    """データベースに接続する"""
    try:
        # 接続文字列の表示（パスワードは隠す）
        connection_string = (
            "DRIVER={ODBC Driver 17 for SQL Server};"
            f"SERVER={os.getenv('SQL_SERVER')};"
            f"DATABASE={os.getenv('SQL_DATABASE')};"
            f"UID={os.getenv('SQL_USER')};"
            "PWD=********;"
            "TrustServerCertificate=yes;"
        )
        print(f"接続文字列: {connection_string}")
        
        # 実際の接続
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

# insert_video_data関数を修正

def insert_video_data(conn, video_data):
    """動画情報をデータベースに登録する（自動化版）"""
    cursor = conn.cursor()
    try:
        # データの展開方法を変更
        if len(video_data) >= 9:  # 新しい形式（投稿者情報を含む）
            video_url, tweet_url, likes, retweets, views, timestamp, author_id, author_name, author_username = video_data
        else:  # 古い形式との互換性のため
            video_url, tweet_url, likes, retweets, views, timestamp = video_data
            author_id, author_name, author_username = None, None, None
        
        # 数値指標の変換を強化（K, M表記対応）
        def convert_metric(value):
            if not value:
                return 0
                
            try:
                value = str(value).strip().replace(',', '')
                if 'K' in value:
                    return int(float(value.replace('K', '')) * 1000)
                elif 'M' in value:
                    return int(float(value.replace('M', '')) * 1000000)
                return int(value) if value.isdigit() else 0
            except (ValueError, AttributeError):
                return 0
        
        likes = convert_metric(likes)
        retweets = convert_metric(retweets)
        views = convert_metric(views)
        
        # URLからtweetIdを抽出
        if '/status/' in tweet_url:
            tweet_id = tweet_url.split('/status/')[-1].split('?')[0]
        else:
            # video.twimg.com形式のURLからtweetIdを直接取得できないため
            print(f"⚠️ ツイートURLからツイートIDを抽出できません: {tweet_url}")
            import hashlib
            tweet_id = hashlib.md5(tweet_url.encode()).hexdigest()[:20]  # URLのハッシュから仮ID生成
        
        if not tweet_id:
            print(f"⚠️ URLから有効なツイートIDを抽出できませんでした: {tweet_url}")
            return False
        
        # 既存レコード確認 - エラーハンドリングを強化
        try:
            cursor.execute("SELECT id, videoUrl, originalUrl FROM Tweet WHERE tweetId = ?", tweet_id)
            result = cursor.fetchone()
            exists = result is not None
        except Exception as e:
            print(f"⚠️ レコード存在確認中のエラー: {e}")
            exists = False
        
        try:
            if exists:
                tweet_db_id, current_video_url, current_original_url = result
                
                # 更新すべき動画URLかチェック
                should_update_video_url = (
                    # ケース1: 現在値がTwitterのURLで、新しい値がvideo.twimgのURL
                    (current_video_url and 'twitter.com' in current_video_url and video_url and 'video.twimg.com' in video_url) or
                    # ケース2: 現在値が空で、新しい値が有効
                    (not current_video_url and video_url)
                )
                
                # originalUrlが空の場合は更新
                should_update_original_url = not current_original_url and tweet_url
                
                # 更新
                cursor.execute("""
                    UPDATE Tweet
                    SET videoUrl = ?, originalUrl = ?, likes = ?, retweets = ?, views = ?, 
                        authorId = COALESCE(?, authorId), 
                        authorName = COALESCE(?, authorName), 
                        authorUsername = COALESCE(?, authorUsername), 
                        updatedAt = GETDATE()
                    WHERE id = ?
                """, (
                    video_url if should_update_video_url else current_video_url,
                    tweet_url if should_update_original_url else current_original_url,
                    likes, 
                    retweets, 
                    views,
                    author_id,
                    author_name, 
                    author_username, 
                    tweet_db_id
                ))
                
                update_message = []
                if should_update_video_url:
                    update_message.append("動画URLを更新")
                if should_update_original_url:
                    update_message.append("ツイートURLを追加")
                    
                print(f"📝 既存データを更新しました: {tweet_id}" + 
                      (f" ({', '.join(update_message)})" if update_message else ""))
            else:
                # 新規挿入
                cursor.execute("""
                    INSERT INTO Tweet 
                    (id, tweetId, videoUrl, originalUrl, likes, retweets, views, timestamp, 
                     authorId, authorName, authorUsername, createdAt, updatedAt)
                    VALUES (NEWID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())
                """, (tweet_id, video_url, tweet_url, likes, retweets, views, timestamp, 
                     author_id, author_name, author_username))
                print(f"➕ 新規データを挿入しました: {tweet_id}")
            
            # 即時コミットして確実に保存
            conn.commit()
            
            # 保存確認のためのカウント
            cursor.execute("SELECT COUNT(*) FROM Tweet")
            count = cursor.fetchone()[0]
            print(f"📊 いいね: {likes}, リツイート: {retweets}, 視聴: {views} (現在のレコード総数: {count})")
            
            # グローバル変数からデータを削除（既に保存済み）
            global temp_video_data
            for i, item in enumerate(temp_video_data):
                if item[0] == video_url:
                    temp_video_data.pop(i)
                    break
                    
            return True
            
        except Exception as e:
            print(f"❌ SQL実行エラー: {e}")
            conn.rollback()
            return False

    except Exception as e:
        print(f"❌ データベース操作に失敗しました: {e}")
        try:
            conn.rollback()
        except:
            pass
        return False

def login_to_twitter(page):
    """X（旧Twitter）にログインする"""
    print("🔑 ログインページを開きます...")
    try:
        page.goto("https://x.com/i/flow/login", timeout=120000)
        page.wait_for_load_state("networkidle")  # ページの完全な読み込みを待つ
    except Exception as e:
        print(f"❌ ログインページの読み込みに失敗しました: {e}")
        return False

    try:
        # メールアドレス入力フィールドを待機
        print("✍️ メールアドレスを入力します...")
        
        # セレクターを見つけるためにより長く待機
        input_selector = "input[autocomplete='username']"
        page.wait_for_selector(input_selector, timeout=30000)
        
        # 値を設定してEnterキーを押す
        if TWITTER_EMAIL:
            page.type(input_selector, TWITTER_EMAIL)
            time.sleep(1)
            page.press(input_selector, "Enter")
            time.sleep(3)
        else:
            print("⚠️ TWITTER_EMAIL が設定されていません")
            return False
            
        # ユーザーネーム確認画面が表示される場合
        try:
            username_selector = "input[data-testid='ocfEnterTextTextInput']"
            if page.is_visible(username_selector, timeout=5000):
                TWITTER_ID = os.getenv("TWITTER_ID")
                if TWITTER_ID:
                    print("✍️ ユーザー名を入力します...")
                    page.type(username_selector, TWITTER_ID)
                    page.press(username_selector, "Enter")
                    time.sleep(2)
                else:
                    print("⚠️ TWITTER_ID が設定されていません")
        except Exception as e:
            print(f"ℹ️ ユーザーネーム確認画面はスキップされました: {e}")

        # パスワードを入力
        print("🔒 パスワードを入力します...")
        password_selector = "input[name='password']"
        page.wait_for_selector(password_selector, timeout=10000)
        if TWITTER_PASSWORD:
            page.type(password_selector, TWITTER_PASSWORD)
            time.sleep(1)
            page.press(password_selector, "Enter")
            time.sleep(5)
        else:
            print("⚠️ TWITTER_PASSWORD が設定されていません")
            return False

        # 2FA（2段階認証）が求められるかチェック
        try:
            if page.is_visible("input[data-testid='ocfEnterTextTextInput']", timeout=5000):
                print("⚠️ 2FAが有効になっています。手動でコードを入力してください。")
                input("🔑 2FAコードを入力したらEnterキーを押してください...")
        except Exception:
            print("✅ 2FAの入力画面は表示されませんでした。")

        # ログイン後の画面遷移を確認 - より汎用的なセレクターを使用
        print("✅ ログイン後の画面遷移を確認中...")
        # ホームアイコン、トレンドセクション、またはサイドバーなどのログイン後に表示される要素を確認
        success_selectors = ["a[aria-label='Home']", "a[data-testid='AppTabBar_Home_Link']", 
                            "div[data-testid='sidebarColumn']", "div[aria-label='Home timeline']"]
        
        logged_in = False
        for selector in success_selectors:
            if page.is_visible(selector, timeout=5000):
                logged_in = True
                break
        
        if logged_in:
            print("✅ ログイン成功！")
            return True
        else:
            print("❌ ログインに失敗しました。")
            return False

    except Exception as e:
        print(f"❌ ログイン処理中にエラーが発生しました: {e}")
        return False

# search_videos 関数内の動画情報取得部分を修正

def search_videos(page, query):
    """指定されたクエリで動画を検索し、データベースに登録する"""
    print(f"🔍 動画を検索: {query}")
    search_url = f"https://x.com/search?q={query}%20filter%3Avideos&src=typed_query"
    
    try:
        # タイムアウト値を増やし、読み込みの確認方法を改善
        print("検索ページに移動しています...")
        page.goto(search_url, timeout=180000)  # タイムアウトを3分に延長
        
        # ページが完全に読み込まれるまで待機
        print("ページの読み込みを待機しています...")
        try:
            page.wait_for_load_state("networkidle", timeout=60000)
        except Exception as e:
            print(f"警告: networkidle待機中にタイムアウト: {e}")
            # タイムアウトしても続行（DOM要素で確認）
        
        # 検索結果が表示されるまで待機
        print("検索結果を待機しています...")
        try:
            # タイムラインが表示されるまで待機
            page.wait_for_selector('section[aria-label="Timeline: Search timeline"]', timeout=60000)
        except Exception as e:
            print(f"警告: 検索結果の待機中にタイムアウト: {e}")
            # ツイートの存在を確認
            if not page.query_selector('article[data-testid="tweet"]'):
                print("❌ 検索結果が表示されていません。手動で検索してください。")
                # ユーザー入力を待つ
                input("検索結果ページが表示されたらEnterキーを押してください...")
    except Exception as e:
        print(f"❌ 検索ページの読み込みに失敗しました: {e}")
        print("手動で検索ページを開いてください...")
        # 検索キーワードを表示
        print(f"検索キーワード: {query} filter:videos")
        input("検索結果ページが表示されたらEnterキーを押してください...")
    
    # データベース接続
    print(f"📜 {SCROLL_COUNT}回のスクロールを開始...")
    conn = connect_to_db()
    
    if not conn:
        print("❌ データベース接続に失敗しました。処理をスキップします。")
        return

    collected_videos = []  # 途中までのデータを保存するリスト
    processed_urls = set()  # 既に処理したURLを追跡

    try:
        last_url_count = 0
        no_new_content_count = 0
        max_no_new_content = 10  # 新しいコンテンツがない状態が10回続いたら終了
        
        for i in range(SCROLL_COUNT):
            if i % 10 == 0:  # 10回スクロールごとに進捗を表示
                print(f"  スクロール: {i + 1}/{SCROLL_COUNT}")
            
            # スクロール実行 - ランダム化してより人間らしく
            scroll_amount = 500 + int(100 * (0.5 - random.random()))  # 450-550のランダムな値
            page.evaluate(f"window.scrollBy(0, {scroll_amount})")
            
            # スクロール間隔もランダム化
            sleep_time = SCROLL_INTERVAL * (0.8 + 0.4 * random.random())  # 0.8-1.2倍のランダム値
            time.sleep(sleep_time)
            
            # 定期的に自動保存を実行
            autosave_data()
            
            # 動画を含むツイートを検索
            videos = page.query_selector_all('article[data-testid="tweet"]')
            
            # 新しいコンテンツがあるか確認
            if len(processed_urls) == last_url_count:
                no_new_content_count += 1
                if no_new_content_count >= max_no_new_content:
                    print(f"⚠️ {max_no_new_content}回連続で新しいコンテンツがありません。スクロールを終了します。")
                    break
            else:
                no_new_content_count = 0
                last_url_count = len(processed_urls)
            
            for video in videos:
                try:
                    # 動画プレーヤーの有無を確認
                    video_player = video.query_selector('div[data-testid="videoPlayer"]')
                    if not video_player:
                        continue
                    
                    # ツイートのリンクを取得
                    tweet_link = video.query_selector('a[href*="/status/"]')
                    if not tweet_link:
                        continue

                    tweet_url = "https://twitter.com" + tweet_link.get_attribute("href")
                    
                    # すでに処理したURLは飛ばす
                    if tweet_url in processed_urls:
                        continue
                    processed_urls.add(tweet_url)
                    
                    # 以下を追加: 投稿者情報の取得
                    author_id = None
                    author_name = None
                    author_username = None
                    
                    # 投稿者のユーザー名を取得
                    try:
                        # ユーザー名セレクター - より具体的なセレクターを使用
                        username_elem = video.query_selector('div[data-testid="User-Name"] a[href^="/"]')
                        if username_elem:
                            author_username = username_elem.get_attribute("href").replace("/", "")
                            print(f"✅ ユーザー名: @{author_username}")
                            
                        # ユーザー表示名の取得
                        display_name_elem = video.query_selector('div[data-testid="User-Name"] a span')
                        if display_name_elem:
                            author_name = display_name_elem.text_content().strip()
                            print(f"✅ 表示名: {author_name}")
                    except Exception as e:
                        print(f"⚠️ ユーザー情報の取得に失敗: {e}")
                    
                    # 実際の動画URLを取得
                    video_url = None
                    video_elem = video.query_selector('video')
                    if video_elem:
                        video_url = video_elem.get_attribute('src')
                        if video_url:
                            print(f"✅ 動画要素から直接URL取得: {video_url}")
                    
                    # 直接取得できない場合は詳細ページから取得
                    if not video_url or 'video.twimg.com' not in video_url:
                        print(f"🔍 ツイート {tweet_url} の動画URLを詳細ページから取得します")
                        video_url = extract_video_url_from_tweet(page, tweet_url)
                        
                        if not video_url or 'video.twimg.com' not in video_url:
                            print(f"⚠️ 実際の動画URLを取得できませんでした。代替値を使用")
                            video_url = None  # 見つからない場合はNULL値として保存
                    
                    # メトリクス取得 - より詳細なセレクターを追加
                    likes = "0"
                    retweets = "0"
                    views = "0"
                    
                    # いいねを取得 - 複数のセレクターを試行
                    likes_selectors = [
                        '[data-testid="like"] span span',
                        '[aria-label*="Like"]',
                        '[data-testid="app-text-transition-container"] span'
                    ]
                    
                    for selector in likes_selectors:
                        likes_elem = video.query_selector(selector)
                        if likes_elem:
                            likes_text = likes_elem.text_content().strip()
                            if likes_text and not likes_text.isspace():
                                likes = likes_text
                                break
                    
                    # リツイートを取得
                    retweet_selectors = [
                        '[data-testid="retweet"] span span',
                        '[aria-label*="Retweet"]'
                    ]
                    
                    for selector in retweet_selectors:
                        rt_elem = video.query_selector(selector)
                        if rt_elem:
                            rt_text = rt_elem.text_content().strip()
                            if rt_text and not rt_text.isspace():
                                retweets = rt_text
                                break
                    
                    # 視聴回数を取得 - 複数のセレクターを試行
                    views_selectors = [
                        'a[href*="/analytics"]',
                        'div[id*="ID_VIDEO_CONTAINER"] ~ div span',
                        'span:has-text("閲覧")'
                    ]
                    
                    for selector in views_selectors:
                        views_elem = video.query_selector(selector)
                        if views_elem:
                            views_text = views_elem.text_content().strip()
                            if ' ' in views_text:
                                views = views_text.split()[0]
                            elif views_text:
                                views = views_text
                            break
                    
                    # タイムスタンプを取得
                    time_elem = video.query_selector('time')
                    timestamp = time_elem.get_attribute("datetime") if time_elem else None
                    
                    if timestamp:
                        # 投稿者情報も含めるように変更
                        video_data = (video_url, tweet_url, likes, retweets, views, timestamp, author_id, author_name, author_username)
                        
                        # グローバルリストに追加（バックアップ用）
                        temp_video_data.append(video_data)
                        
                        # データベースに即時保存を試みる
                        success = False
                        try:
                            success = insert_video_data(conn, video_data)
                        except Exception as db_error:
                            print(f"⚠️ データベース登録中のエラー: {db_error}")
                        
                        if success:
                            # 成功した場合はグローバルリストから削除
                            temp_video_data.pop()
                        else:
                            # 失敗した場合はバックアップとして保持
                            print("⚠️ データベース登録に失敗したためバックアップに保存します")
                            
                        # 定期的なフィードバック
                        if len(processed_urls) % 10 == 0:
                            print(f"🔄 処理済み: {len(processed_urls)}件, 保存済み: {len(processed_urls) - len(temp_video_data)}件")

                except Exception as e:
                    print(f"⚠️ 動画データの取得に失敗しました: {e}")

                # search_videos 関数内の video_url 取得部分を修正
                if not video_url or not video_url.startswith('http') or 'twitter.com' in video_url:
                    # 動画URLが取得できない場合や、TwitterのURLが取得された場合は詳細ページから取得を試みる
                    detailed_video_url = extract_video_url_from_tweet(page, tweet_url)
                    if detailed_video_url:
                        video_url = detailed_video_url
                        print(f"✅ 詳細ページから動画URL取得成功: {video_url}")
                    else:
                        # 詳細ページからも取得できない場合はツイートURLを使用
                        video_url = tweet_url
                        print(f"⚠️ 実際の動画URLを取得できませんでした。ツイートURLを代用: {tweet_url}")
                else:
                    print(f"✅ 実際の動画URL: {video_url}")

    except Exception as e:
        print(f"❌ スクロール中にエラーが発生しました: {e}")

    finally:
        # 検索が中断されてもここでデータベースに保存
        if collected_videos:
            print(f"💾 {len(collected_videos)} 件の動画データを保存しました。")
        conn.close()

    print("✅ 動画検索完了！")

def get_browser_context(p):
    import os
    from playwright.sync_api import Error
    try:
        print("🔁 既存のブラウザセッションに接続中...")
        browser = p.chromium.connect_over_cdp("http://localhost:9222")
        context = browser.contexts[0] if browser.contexts else browser.new_context()
        return browser, context
    except Error as e:
        print(f"⚠️ 既存のブラウザ接続に失敗: {e}. 新しく起動します")
        context = p.chromium.launch_persistent_context(
            user_data_dir=".pw-chrome",
            headless=False,
            args=["--remote-debugging-port=9222"]
        )
        browser = context
        return browser, context
    
    
def ensure_database_setup():
    """データベースとテーブルが存在することを確認する"""
    try:
        # 接続テスト
        conn = pyodbc.connect(
            "DRIVER={ODBC Driver 17 for SQL Server};"
            f"SERVER={os.getenv('SQL_SERVER')};"
            f"DATABASE={os.getenv('SQL_DATABASE')};"
            f"UID={os.getenv('SQL_USER')};"
            f"PWD={os.getenv('SQL_PASSWORD')};"
            "TrustServerCertificate=yes;"
        )
        
        cursor = conn.cursor()
        
        # Tweetテーブルの存在確認と作成（originalUrl列を追加）
        cursor.execute("""
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Tweet]') AND type in (N'U'))
        BEGIN
            CREATE TABLE [dbo].[Tweet] (
                [id] NVARCHAR(128) PRIMARY KEY NOT NULL DEFAULT NEWID(),
                [tweetId] NVARCHAR(128) UNIQUE,
                [content] NVARCHAR(MAX) NULL,
                [videoUrl] NVARCHAR(2048) NULL,
                [originalUrl] NVARCHAR(2048) NULL,  -- 追加: 元のツイートURL
                [likes] INT DEFAULT 0,
                [retweets] INT DEFAULT 0,
                [views] INT DEFAULT 0,
                [timestamp] DATETIME2 DEFAULT GETDATE(),
                [authorId] NVARCHAR(128) NULL,
                [authorName] NVARCHAR(255) NULL,
                [authorUsername] NVARCHAR(255) NULL,
                [createdAt] DATETIME2 DEFAULT GETDATE(),
                [updatedAt] DATETIME2 DEFAULT GETDATE()
            );
            PRINT 'Tweetテーブルが作成されました。';
        END
        """)
        
        # 既存のテーブルにoriginalUrl列がなければ追加
        cursor.execute("""
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Tweet]') AND name = 'originalUrl')
        BEGIN
            ALTER TABLE [dbo].[Tweet] ADD originalUrl NVARCHAR(2048) NULL;
            PRINT 'originalUrl列が追加されました。';
        END
        """)
        
        cursor.execute("SELECT COUNT(*) FROM Tweet")
        count = cursor.fetchone()[0]
        print(f"✅ データベース接続成功: 現在のレコード数は {count} 件です")
        
        conn.commit()
        conn.close()
        return True
        
    except pyodbc.Error as e:
        print(f"❌ データベースセットアップエラー: {e}")
        return False

# 定期的な自動保存機能を追加

# グローバル変数
last_save_time = time.time()
AUTOSAVE_INTERVAL = 60  # 60秒ごとに自動保存

def autosave_data():
    """定期的に未保存データをデータベースに保存"""
    global last_save_time, temp_video_data
    current_time = time.time()
    
    if (current_time - last_save_time > AUTOSAVE_INTERVAL and temp_video_data):
        print(f"\n⏱️ 自動保存を実行します... ({len(temp_video_data)}件)")
        conn = connect_to_db()
        if conn:
            saved_count = 0
            for video_data in list(temp_video_data):  # リストのコピーを使用
                # ここに処理コードが必要 - これが欠けていた
                success = insert_video_data(conn, video_data)
                if success:
                    saved_count += 1
            
            print(f"⏱️ 自動保存完了: {saved_count}/{len(temp_video_data)}件 保存しました")
            conn.close()
            last_save_time = current_time
        else:
            print("❌ 自動保存に失敗: データベース接続エラー")

# 新しい関数を追加 - ツイートページから動画URLを取得
def extract_video_url_from_tweet(page, tweet_url):
    """ツイートページから実際の動画ファイルのURLと投稿者情報を抽出する"""
    try:
        print(f"🎬 ツイートページから動画URLを抽出中: {tweet_url}")
        
        # 現在のURLを保存
        current_url = page.url
        
        # 戻り値用のデータ
        video_url = None
        author_id = None
        author_name = None
        author_username = None
        
        try:
            # ツイートページに移動
            print(f"  🌐 {tweet_url} に移動中...")
            page.goto(tweet_url, timeout=30000)
            page.wait_for_load_state("networkidle", timeout=20000)
            
            # コンテンツが読み込まれるまでちょっと待機
            time.sleep(2)
            
            # 投稿者情報を取得
            try:
                # ユーザー名の取得
                username_elem = page.query_selector('div[data-testid="User-Name"] a[href^="/"]')
                if username_elem:
                    username = username_elem.get_attribute("href").replace("/", "")
                    author_username = username
                    print(f"  ✅ ユーザー名: @{author_username}")
                
                # 表示名の取得
                name_elem = page.query_selector('div[data-testid="User-Name"] a span')
                if name_elem:
                    author_name = name_elem.text_content().strip()
                    print(f"  ✅ 表示名: {author_name}")
                
                # ユーザーIDは技術的に取得困難なため、ここではスキップ
            except Exception as e:
                print(f"  ⚠️ 投稿者情報の取得に失敗: {e}")
            
            # 動画URLの抽出（既存コード）
            # 方法1: video要素から直接src属性を取得
            try:
                video_url = page.evaluate('''() => {
                    const videoElement = document.querySelector('video');
                    if (videoElement && videoElement.src) return videoElement.src;
                    return null;
                }''')
                
                if (video_url):
                    print(f"  ✅ 方法1でURL取得: {video_url}")
            except Exception as e:
                print(f"  ⚠️ 方法1でのURL取得に失敗: {e}")
            
            # 方法2: source要素から
            if not video_url:
                try:
                    video_url = page.evaluate('''() => {
                        const sourceElement = document.querySelector('video > source');
                        if (sourceElement && sourceElement.src) return sourceElement.src;
                        return null;
                    }''')
                    
                    if video_url:
                        print(f"  ✅ 方法2でURL取得: {video_url}")
                except Exception as e:
                    print(f"  ⚠️ 方法2でのURL取得に失敗: {e}")
            
            # 方法3: ネットワークリクエストをモニタリング
            if not video_url:
                try:
                    print("  🔄 ネットワークリクエストから動画を探しています...")
                    
                    # プレーヤーが読み込みなおされるよう、適当な操作を実行
                    try:
                        play_button = page.query_selector('div[data-testid="videoPlayer"] div[role="button"]')
                        if play_button:
                            play_button.click()
                            time.sleep(1)
                    except:
                        pass
                    
                    # ネットワークリクエストから動画URLを取得
                    video_url = page.evaluate('''() => {
                        const videoUrls = [];
                        // パフォーマンスエントリからビデオURLを探す
                        if (window.performance && window.performance.getEntriesByType) {
                            const resources = window.performance.getEntriesByType('resource');
                            for (const resource of resources) {
                                if (resource.name && 
                                    (resource.name.includes('video.twimg.com') ||
                                     resource.name.includes('.mp4') ||
                                     resource.name.includes('video_url'))) {
                                    videoUrls.push(resource.name);
                                }
                            }
                        }
                        return videoUrls.length > 0 ? videoUrls[0] : null;
                    }''')
                    
                    if video_url:
                        print(f"  ✅ 方法3でURL取得: {video_url}")
                except Exception as e:
                    print(f"  ⚠️ 方法3でのURL取得に失敗: {e}")
            
            # URL検証: video.twimg.comドメインであること
            if video_url and 'video.twimg.com' not in video_url:
                print(f"  ⚠️ 取得したURLが期待するドメインではありません: {video_url}")
                if 'twitter.com' in video_url and '/status/' in video_url:
                    # TwitterのURLが取得された場合は無効と判断
                    video_url = None
            
            if not video_url:
                print("  ❌ 動画URLが見つかりませんでした")
                
        except Exception as e:
            print(f"  ❌ 動画要素の検索中にエラー: {e}")
            video_url = None
            
    except Exception as e:
        print(f"❌ 動画URL取得中にエラー: {e}")
        video_url = None
    
    finally:
        # 元のページに戻る
        try:
            print(f"  🔙 元のページ {current_url} に戻ります")
            page.goto(current_url, timeout=30000)
            page.wait_for_load_state("domcontentloaded")
        except Exception as e:
            print(f"  ⚠️ 元のページに戻る際にエラー: {e}")
    
    # 動画URL取得後に投稿者情報も追加して返すように変更
    return video_url, author_id, author_name, author_username

def main():
    # データベース構造を確認
    print("📊 データベース構造を確認しています...")
    if not ensure_database_setup():
        print("❌ データベースのセットアップに失敗しました。終了します。")
        return
        
    with sync_playwright() as p:
        browser = None
        try:
            browser, context = get_browser_context(p)
            page = context.new_page()
            
            # メディア自動再生の許可
            page.set_extra_http_headers({
                'Accept': '*/*',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
                'Range': 'bytes=0-'
            })
            
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
            
            # 検索キーワードごとに処理
            for keyword in SEARCH_KEYWORDS:
                print(f"\n🔎 キーワード「{keyword}」で検索を開始")
                
                # リトライメカニズム
                max_retries = 3
                for attempt in range(max_retries):
                    try:
                        search_videos(page, keyword)
                        break  # 成功したらループを抜ける
                    except Exception as e:
                        print(f"❌ 検索中にエラーが発生しました (試行 {attempt+1}/{max_retries}): {e}")
                        if attempt < max_retries - 1:
                            print("数秒後に再試行します...")
                            time.sleep(10)  # 10秒待機してから再試行
                        else:
                            print(f"❌ キーワード「{keyword}」の検索を諦めます")
                
                time.sleep(5)  # 次の検索までの間隔
            
            print("\n✨ すべての検索が完了しました！")
            
            # 最終的なデータ保存確認
            if temp_video_data:
                print(f"🔄 未保存データ {len(temp_video_data)} 件を最終保存中...")
                conn = connect_to_db()
                if conn:
                    saved_count = 0
                    for video_data in list(temp_video_data):  # リストのコピーを使用
                        if insert_video_data(conn, video_data):
                            saved_count += 1
                    conn.close()
                    print(f"✅ 最終保存完了: {saved_count}/{len(temp_video_data)}件保存されました")
                else:
                    print("❌ 最終保存に失敗: データベース接続エラー")
            else:
                print("✅ すべてのデータは正常に保存されました")
            
            print("🛑 スクリプト終了。ブラウザを開いたままにします。手動で閉じてください。")
            
            # ブラウザを開いたままにする
            try:
                while True:
                    time.sleep(60)  # 1分ごとにループし続ける
                    autosave_data()  # 定期的に自動保存を実行
            except KeyboardInterrupt:
                print("\n👋 手動終了を検出しました。終了処理を実行します。")
        except Exception as e:
            print(f"❌ メイン処理中に予期しないエラーが発生しました: {e}")
        finally:
            # エラーが発生してもtemp_dataを保存
            save_temp_video_data()
            
            # ブラウザの閉じ方を選択
            if browser:
                try:
                    close_browser = input("\n🌐 ブラウザを閉じますか？(y/n、デフォルトはn): ").lower() == 'y'
                    if close_browser:
                        print("ブラウザを閉じています...")
                        browser.close()
                        print("ブラウザを閉じました")
                    else:
                        print("ブラウザを開いたままにします。手動で閉じてください。")
                except:
                    # 例外が発生しても何もしない（ブラウザは開いたままにする）
                    pass

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

# スクリプトの最後（main関数の後）に追加

def update_existing_video_urls():
    """既存のTwitter URLを実際の動画URLに更新する"""
    print("🔄 既存のTwitter URLを実際の動画URLに更新します...")
    
    # データベース接続
    conn = connect_to_db()
    if not conn:
        print("❌ データベース接続に失敗しました。")
        return
    
    cursor = conn.cursor()
    
    try:
        # Twitter URLを持つレコードを取得
        cursor.execute("""
            SELECT id, tweetId, videoUrl, originalUrl 
            FROM Tweet 
            WHERE videoUrl LIKE '%twitter.com%/status/%' 
            ORDER BY createdAt DESC
        """)
        
        records = cursor.fetchall()
        print(f"🔍 {len(records)}件のTwitter URLレコードが見つかりました")
        
        if not records:
            print("✅ 更新すべきレコードはありません")
            conn.close()
            return
        
        with sync_playwright() as p:
            browser, context = get_browser_context(p)
            page = context.new_page()
            
            # Xにログイン
            if not login_to_twitter(page):
                print("❌ ログインに失敗しました。")
                browser.close()
                conn.close()
                return
            
            # レコードを1件ずつ処理
            updated_count = 0
            for record in records:
                record_id, tweet_id, current_video_url, current_original_url = record
                print(f"\n処理中: ID={record_id}, ツイート={tweet_id}")
                
                # 元のURLが保存されていない場合
                tweet_url = current_original_url or current_video_url
                print(f"元のURL: {tweet_url}")
                
                # 動画URLを抽出
                if 'twitter.com' in current_video_url and 'video.twimg.com' not in current_video_url:
                    video_url = extract_video_url_from_tweet(page, current_video_url)
                    
                    # 有効な動画URLが取得できた場合は更新
                    if video_url and 'video.twimg.com' in video_url:
                        print(f"✅ 新しい動画URL: {video_url}")
                        try:
                            # 動画URLとoriginalUrlの両方を更新
                            cursor.execute("""
                                UPDATE Tweet 
                                SET videoUrl = ?, originalUrl = COALESCE(originalUrl, ?), updatedAt = GETDATE()
                                WHERE id = ?
                            """, (video_url, current_video_url, record_id))
                            conn.commit()
                            updated_count += 1
                            print(f"✅ レコードを更新しました: {record_id}")
                        except Exception as e:
                            print(f"❌ 更新エラー: {e}")
                            conn.rollback()
                    else:
                        print(f"❌ 動画URLを取得できませんでした: {current_video_url}")
                elif not current_original_url and 'twitter.com' in current_video_url:
                    # originalUrlが空でvideoUrlがTwitterのURLの場合
                    try:
                        cursor.execute("""
                            UPDATE Tweet 
                            SET originalUrl = ?, updatedAt = GETDATE()
                            WHERE id = ?
                        """, (current_video_url, record_id))
                        conn.commit()
                        updated_count += 1
                        print(f"✅ originalUrlを設定しました: {record_id}")
                    except Exception as e:
                        print(f"❌ originalUrl更新エラー: {e}")
                        conn.rollback()
                
                # 少し待機してAPIレート制限を回避
                time.sleep(2)
            
            print(f"\n✅ 更新完了: {updated_count}/{len(records)}件のレコードを更新しました")
            browser.close()
            
    except Exception as e:
        print(f"❌ 処理中にエラーが発生しました: {e}")
    finally:
        conn.close()

def update_all_tweet_data():
    """すべてのツイートデータを更新（originalUrlの追加やvideoUrlの修正など）"""
    print("🔄 すべてのツイートデータを更新します...")
    
    # データベース接続
    conn = connect_to_db()
    if not conn:
        print("❌ データベース接続に失敗しました。")
        return
    
    cursor = conn.cursor()
    
    try:
        # すべてのレコードを取得
        cursor.execute("""
            SELECT id, tweetId, videoUrl, originalUrl
            FROM Tweet
            ORDER BY createdAt DESC
        """)
        
        records = cursor.fetchall()
        print(f"🔍 合計 {len(records)} 件のレコードが見つかりました")
        
        # originalUrlがNULLの件数を確認
        missing_original_url = [r for r in records if r[3] is None]
        print(f"📊 originalUrlが空のレコード: {len(missing_original_url)} 件")
        
        # videoUrlがTwitterのURLの件数を確認
        twitter_video_urls = [r for r in records if r[2] and 'twitter.com' in r[2] and 'video.twimg.com' not in r[2]]
        print(f"📊 動画URLがTwitterのURL: {len(twitter_video_urls)} 件")
        
        if not missing_original_url and not twitter_video_urls:
            print("✅ 更新の必要があるレコードがありません")
            conn.close()
            return
        
        with sync_playwright() as p:
            browser, context = get_browser_context(p)
            page = context.new_page()
            
            # Xにログイン
            if not login_to_twitter(page):
                print("❌ ログインに失敗しました。")
                browser.close()
                conn.close()
                return
            
            # 処理対象のレコード
            target_records = missing_original_url + [r for r in twitter_video_urls if r not in missing_original_url]
            
            # レコードを1件ずつ処理
            updated_count = 0
            for record in target_records:
                # ここにインデントされたコードブロックが必要
                record_id, tweet_id, current_video_url, current_original_url = record
                print(f"\n処理中: ID={record_id}, ツイート={tweet_id}")
                
                # 動画URLを更新
                if current_video_url and 'twitter.com' in current_video_url and 'video.twimg.com' not in current_video_url:
                    # 投稿者情報も一緒に取得
                    video_url, author_id, author_name, author_username = extract_video_url_from_tweet(page, current_video_url)
                    
                    if video_url and 'video.twimg.com' in video_url:
                        print(f"✅ 新しい動画URL: {video_url}")
                        try:
                            cursor.execute("""
                                UPDATE Tweet 
                                SET videoUrl = ?, originalUrl = COALESCE(originalUrl, ?), 
                                    authorId = COALESCE(?, authorId),
                                    authorName = COALESCE(?, authorName), 
                                    authorUsername = COALESCE(?, authorUsername),
                                    updatedAt = GETDATE()
                                WHERE id = ?
                            """, (video_url, current_video_url, author_id, author_name, author_username, record_id))
                            conn.commit()
                            updated_count += 1
                            print(f"✅ レコードを更新しました: {record_id}")
                        except Exception as e:
                            print(f"❌ 更新エラー: {e}")
                            conn.rollback()
                    else:
                        print(f"❌ 動画URLを取得できませんでした: {current_video_url}")
                
                # originalUrlを更新（空の場合）
                if not current_original_url:
                    # 元のURLを設定（videoUrlがあれば、そこから）
                    original_url = current_video_url
                    if original_url:
                        try:
                            cursor.execute("""
                                UPDATE Tweet 
                                SET originalUrl = ?, updatedAt = GETDATE()
                                WHERE id = ?
                            """, (original_url, record_id))
                            conn.commit()
                            updated_count += 1
                            print(f"✅ originalUrlを設定しました: {record_id}")
                        except Exception as e:
                            print(f"❌ originalUrl更新エラー: {e}")
                            conn.rollback()
                
                # 少し待機してAPIレート制限を回避
                time.sleep(2)
            
            print(f"\n✅ 更新完了: {updated_count}/{len(target_records)}件のレコードを更新しました")
            browser.close()
            
    except Exception as e:
        print(f"❌ 処理中にエラーが発生しました: {e}")
    finally:
        conn.close()
        
def refresh_tweet_metrics():
    """保存済みツイートのいいね・リツイート・再生数を更新"""
    print("🔄 保存済みのツイート指標（いいね・RT・再生数）を更新します")
    conn = connect_to_db()
    if not conn:
        print("❌ データベース接続に失敗しました")
        return

    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, tweetId, originalUrl FROM Tweet ORDER BY updatedAt DESC")
        records = cursor.fetchall()
        print(f"📊 更新対象: {len(records)} 件")

        with sync_playwright() as p:
            browser, context = get_browser_context(p)
            page = context.new_page()
            if not login_to_twitter(page):
                print("❌ ログイン失敗")
                return

            updated = 0
            for record in records:
                db_id, tweet_id, tweet_url = record
                if not tweet_url:
                    continue
                try:
                    page.goto(tweet_url, timeout=30000)
                    page.wait_for_selector('article', timeout=10000)
                    time.sleep(2)

                    # 各メトリクス取得
                    def extract(selector_list):
                        for sel in selector_list:
                            elem = page.query_selector(sel)
                            if elem:
                                return elem.text_content().strip()
                        return "0"

                    likes = extract(['[data-testid="like"] span span'])
                    retweets = extract(['[data-testid="retweet"] span span'])
                    views = extract(['a[href*="/analytics"]', 'span:has-text("閲覧")'])

                    def convert(val):
                        val = val.replace(',', '').replace('K', '000').replace('M', '000000')
                        return int(''.join(filter(str.isdigit, val)) or "0")

                    # DB更新
                    cursor.execute("""
                        UPDATE Tweet SET 
                        likes = ?, retweets = ?, views = ?, updatedAt = GETDATE()
                        WHERE id = ?
                    """, (convert(likes), convert(retweets), convert(views), db_id))
                    conn.commit()
                    updated += 1
                    print(f"✅ {tweet_url} → ❤️{likes} 🔁{retweets} 👁️{views}")
                except Exception as e:
                    print(f"⚠️ {tweet_url} 更新失敗: {e}")
                    conn.rollback()

            print(f"✅ メトリクス更新完了: {updated}/{len(records)} 件")
            browser.close()
    except Exception as e:
        print(f"❌ 処理中エラー: {e}")
        conn.rollback()
    finally:
        conn.close()

# スクリプト起動時の引数処理に追加
if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        if sys.argv[1] == "--update-urls":
            update_existing_video_urls()
        elif sys.argv[1] == "--update-all":
            update_all_tweet_data()
        elif sys.argv[1] == "--refresh-metrics":
            refresh_tweet_metrics()
        else:
            print(f"不明なコマンド: {sys.argv[1]}")
    else:
        main()


