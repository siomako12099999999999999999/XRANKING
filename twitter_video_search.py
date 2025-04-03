"""
Twitter動画検索・保存スクリプト
================================

機能：
- Twitter(X)で動画付きツイートを検索
- 動画URL、いいね数、リツイート数、閲覧数などのメトリクスを取得
- ツイート内容、投稿者情報、サムネイル画像も収集
- 収集したデータをSQLデータベースに保存
- 既存データの更新と最新化

使用方法：
- 基本検索: python twitter_video_search.py "検索キーワード" --limit 10 --save
- 指標更新: python twitter_video_search.py --refresh-metrics
- URL更新: python twitter_video_search.py --update-urls
- 全データ更新: python twitter_video_search.py --update-all

前提条件：
- Playwright (自動インストール)
- pyodbc (SQL Server接続用)
- aiosqlite (非同期SQLite操作用)
- .env ファイルに接続情報を設定

データベース：
- SQLite: 非同期操作にaiosqliteを使用
- SQL Server: 従来の同期操作にpyodbcを使用
- 両方のデータベースに対応し、環境に応じて適切なものを使用

更新履歴：
- 2023/12: 初期バージョン
- 2024/06: 動画URL取得ロジックを改善、新メタデータ対応
- 2024/06: aiosqlite導入による非同期データベース操作に対応

作者: XRANKING開発チーム
"""

# Add a blank line between docstring and imports
import time
import sys
import os
import atexit
import pyodbc  # 追加
import random  # ランダム化のために追加
import datetime  # 追加: datetimeモジュールをインポート
import asyncio
import uuid
import argparse
import urllib.parse
try:
    from playwright.async_api import async_playwright, TimeoutError
except ImportError:
    print("playwright モジュールが見つかりません。インストールを試みます...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "playwright"])
    from playwright.async_api import async_playwright, TimeoutError
try:
    from dotenv import load_dotenv
except ImportError:
    print("dotenv モジュールが見つかりません。インストールを試みます...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "python-dotenv"])
    from dotenv import load_dotenv

# .env ファイルを読み込む
load_dotenv()

# pyodbcがインストールされているか確認
try:
    import pyodbc
except ImportError:
    print("pyodbc モジュールが見つかりません。インストールを試みます...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pyodbc"])
    import pyodbc

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
    "",
    
]
# スクロール回数（取得動画数の調整用）
SCROLL_COUNT = 5000 # 値を 10 から 50 に増やしました
# スクロール間隔（秒）
SCROLL_INTERVAL = 2 # 値を 1 から 2 に増やしました

# --- SQL Server 接続 ---
def connect_to_sql_server():
    """SQL Server データベースに接続する"""
    # --- .env ファイルのパスを明示的に指定して強制的に再読み込み ---
    dotenv_path = '.env'
    load_dotenv(dotenv_path=dotenv_path, override=True)
    print(f"ℹ️ .env ファイルを再読み込み: {dotenv_path}") # デバッグ出力追加
    # -------------------------------------------------------
    conn_str_getenv = os.getenv("DATABASE_URL")
    conn_str_environ = os.environ.get("DATABASE_URL")
    print(f"[Python Script] DATABASE_URL from os.getenv: {conn_str_getenv}") # Log the URL
    print(f"[Python Script] DATABASE_URL from os.environ.get: {conn_str_environ}") # Log the URL
    conn_str = conn_str_getenv

    if not conn_str:
        print("❌ [Python Script] DATABASE_URL is not set in environment variables.")
        return None

    print(f"[Python Script] Attempting to connect with URL: {conn_str}") # Log before connect

    try:
        drivers = pyodbc.drivers()
        print(f"ℹ️ 利用可能な ODBC ドライバー: {drivers}") # デバッグ出力追加
    except Exception as e:
        print(f"⚠️ pyodbc.drivers() の実行中にエラー: {e}") # エラーハンドリング追加

    if not conn_str:
        print("❌ 環境変数 DATABASE_URL が設定されていません。")
        return None
    try:
        # --- 接続文字列を ODBC 形式に変換 ---
        driver_name = "ODBC Driver 17 for SQL Server" # 利用可能なドライバーから選択
        odbc_conn_str = conn_str # デフォルトは元の文字列

        if conn_str.startswith("sqlserver://"):
            try:
                parsed_url = urllib.parse.urlparse(conn_str)
                server = f"{parsed_url.hostname},{parsed_url.port}" if parsed_url.port else parsed_url.hostname
                database = parsed_url.path.lstrip('/') if parsed_url.path else None # データベース名がない場合も考慮
                uid = parsed_url.username
                pwd = parsed_url.password
                query_params = urllib.parse.parse_qs(parsed_url.query)
                trust_cert_param = query_params.get('trustServerCertificate', ['false'])[0].lower()
                trust_cert = 'yes' if trust_cert_param == 'true' else 'no'

                # 必須パラメータをチェック
                if not server or not uid or not pwd:
                     raise ValueError("接続URLに必要な情報 (Server, Uid, Pwd) が不足しています。")

                odbc_parts = [
                    f"Driver={{{driver_name}}}",
                    f"Server={server}",
                    f"Uid={uid}",
                    f"Pwd={pwd}",
                    f"TrustServerCertificate={trust_cert}",
                ]
                # データベース名があれば追加
                if database:
                    odbc_parts.append(f"Database={database}")

                odbc_conn_str = ";".join(odbc_parts) + ";" # 末尾にセミコロンを追加
                print(f"ℹ️ 生成された ODBC 接続文字列: {odbc_conn_str}")
            except Exception as parse_ex:
                print(f"⚠️ 接続URLの解析に失敗しました: {parse_ex}。元の接続文字列を使用します。")
                odbc_conn_str = conn_str # 解析失敗時は元の文字列に戻す
        else:
             print(f"ℹ️ URL形式でないため、元の接続文字列を使用します: {conn_str}")


        # ---------------------------------
        conn = pyodbc.connect(odbc_conn_str) # 変換後の接続文字列を使用
        print("✅ SQL Server 接続成功")
        return conn
    except pyodbc.Error as ex:
        sqlstate = ex.args[0]
        print(f"❌ SQL Server 接続エラー: {sqlstate} - {ex}")
        # エラーメッセージに試行した接続文字列を含める
        print(f"  (試行した接続文字列: {odbc_conn_str})")
        return None

# --- データ挿入 (SQL Server 用) ---
async def insert_video_data_sql_server(conn, video_data):
    """動画データを SQL Server に挿入または更新する"""
    tweet_id_str = video_data['tweet_url'].split('/')[-1]
    original_url = video_data['tweet_url']
    video_url = video_data.get('video_url')
    content = video_data.get('tweet_text', '')
    likes = int(video_data['metrics'].get('likes', 0))
    retweets = int(video_data['metrics'].get('retweets', 0))
    views = int(video_data['metrics'].get('views', 0))
    # timestamp はツイート日時だが、現状取得できないため現在時刻
    timestamp = datetime.datetime.now()
    # authorId は現状取得できないため None
    author_id = None
    author_name = video_data.get('display_name', '')
    author_username = video_data.get('username', '')
    author_profile_image_url = video_data.get('profile_image_url', '')
    # thumbnailUrl は現状取得できないため None
    thumbnail_url = None
    created_at = datetime.datetime.now()
    updated_at = datetime.datetime.now()

    sql_check = "SELECT COUNT(*) FROM Tweet WHERE tweetId = ?"
    sql_insert = """
        INSERT INTO Tweet (
            id, tweetId, videoUrl, originalUrl, content, likes, retweets, views,
            timestamp, authorId, authorName, authorUsername, authorProfileImageUrl,
            thumbnailUrl, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """ # id と VALUES の ? を追加
    sql_update = """
        UPDATE Tweet SET
            videoUrl = ?, content = ?, likes = ?, retweets = ?, views = ?,
            timestamp = ?, authorName = ?, authorUsername = ?, authorProfileImageUrl = ?,
            updatedAt = ?
        WHERE tweetId = ?
    """

    def db_operation():
        cursor = conn.cursor()
        try:
            # 既存チェック
            cursor.execute(sql_check, (tweet_id_str,))
            exists = cursor.fetchone()[0] > 0

            if exists:
                # --- 更新前のデータを取得 (オプション、デバッグ用) ---
                # cursor.execute("SELECT likes, retweets, views FROM Tweet WHERE tweetId = ?", (tweet_id_str,))
                # old_metrics = cursor.fetchone()
                # if old_metrics:
                #     print(f"  📊 更新前メトリクス: Likes={old_metrics[0]}, Retweets={old_metrics[1]}, Views={old_metrics[2]}")
                # ------------------------------------
                print(f"🔄 データ更新中: {tweet_id_str} (Likes: {likes}, Retweets: {retweets}, Views: {views})") # 更新する値をログに追加
                cursor.execute(sql_update, (
                    video_url, content, likes, retweets, views, timestamp,
                    author_name, author_username, author_profile_image_url,
                    updated_at, tweet_id_str
                ))
            else:
                print(f"📝 データ挿入中: {tweet_id_str}")
                # --- UUID を生成 ---
                new_id = str(uuid.uuid4())
                # -----------------
                cursor.execute(sql_insert, (
                    new_id, # 生成した ID を追加
                    tweet_id_str, video_url, original_url, content, likes, retweets, views,
                    timestamp, author_id, author_name, author_username, author_profile_image_url,
                    thumbnail_url, created_at, updated_at
                ))
            conn.commit()
            print(f"✅ データを保存しました: {original_url}")
            return True
        except pyodbc.Error as ex:
            sqlstate = ex.args[0]
            print(f"❌ SQL Server データ保存エラー ({tweet_id_str}): {sqlstate} - {ex}")
            conn.rollback() # エラー時はロールバック
            return False
        finally:
            cursor.close()

    # 同期処理を非同期で実行
    return await asyncio.to_thread(db_operation)


async def login_to_twitter(page):
    """
    X（旧Twitter）にログインする
    
    環境変数に設定されたアカウント情報を使用してTwitter/Xにログインします。
    
    ログインプロセス:
    1. ログインページへのアクセス
    2. メールアドレス/ユーザー名の入力
    3. パスワードの入力
    4. 二段階認証（2FA）対応（必要な場合）
    5. ログイン成功の確認
    
    様々なログインフローパターンに対応し、複数のセレクターを試行します。
    ログイン状態は複数の要素の存在確認によって判定されます。
    
    パラメータ:
        page: Playwrightのページオブジェクト
    
    戻り値:
        ログイン成功時はTrue、失敗時はFalse
    """
    print("🔑 ログインページを開きます...")
    try:
        await page.goto("https://x.com/i/flow/login", timeout=120000)
        await page.wait_for_load_state("networkidle")  # ページの完全な読み込みを待つ
    except Exception as e:
        print(f"❌ ログインページの読み込みに失敗しました: {e}")
        return False

    try:
        # メールアドレス入力フィールドを待機
        print("✍️ メールアドレスを入力します...")
        
        # セレクターを見つけるためにより長く待機
        input_selector = "input[autocomplete='username']"
        await page.wait_for_selector(input_selector, timeout=30000)
        
        # 値を設定してEnterキーを押す
        if TWITTER_EMAIL:
            await page.type(input_selector, TWITTER_EMAIL)
            time.sleep(1)
            await page.press(input_selector, "Enter")
            time.sleep(3)
        else:
            print("⚠️ TWITTER_EMAIL が設定されていません")
            return False
            
        # ユーザーネーム確認画面が表示される場合
        try:
            username_selector = "input[data-testid='ocfEnterTextTextInput']"
            if await page.is_visible(username_selector, timeout=5000):
                TWITTER_ID = os.getenv("TWITTER_ID")
                if TWITTER_ID:
                    print("✍️ ユーザー名を入力します...")
                    await page.type(username_selector, TWITTER_ID)
                    await page.press(username_selector, "Enter")
                    time.sleep(2)
                else:
                    print("⚠️ TWITTER_ID が設定されていません")
        except Exception as e:
            print(f"ℹ️ ユーザーネーム確認画面はスキップされました: {e}")

        # パスワードを入力
        print("🔒 パスワードを入力します...")
        password_selector = "input[name='password']"
        await page.wait_for_selector(password_selector, timeout=10000)
        if TWITTER_PASSWORD:
            await page.type(password_selector, TWITTER_PASSWORD)
            time.sleep(1)
            await page.press(password_selector, "Enter")
            time.sleep(5)
        else:
            print("⚠️ TWITTER_PASSWORD が設定されていません")
            return False

        # 2FA（2段階認証）が求められるかチェック
        try:
            if await page.is_visible("input[data-testid='ocfEnterTextTextInput']", timeout=5000):
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
            if await page.is_visible(selector, timeout=5000):
                logged_in = True
                break
        
        if logged_in:
            print("✅ ログイン成功！")
            return True
        else:
            print("❌ ログインに失敗しました。ホーム画面が表示されませんでした。")
            return False

    except Exception as e:
        print(f"❌ ログイン処理中にエラーが発生しました: {e}")
        return False

async def extract_video_url_from_tweet(page, tweet_url):
    """ツイートから動画URLを抽出する"""
    try:
        # 現在のURLを保存
        current_url = page.url
        video_urls = []
        
        # ツイートページに移動
        print(f"  🌐 {tweet_url} に移動中...")
        await page.goto(tweet_url, timeout=60000)  # タイムアウトを60秒に延長
        await page.wait_for_load_state("networkidle", timeout=30000)  # タイムアウトを30秒に延長
        
        # ツイート内容を取得
        try:
            content_elem = await page.wait_for_selector('div[data-testid="tweetText"]', timeout=10000)
            if content_elem:
                content = await content_elem.text_content()
                content = content.strip()
                print(f"  📝 ツイート内容: {content}")
        except Exception as e:
            print(f"  ⚠️ ツイート内容の取得に失敗: {e}")
            content = None
            
        # ユーザー情報を取得
        try:
            username_elem = await page.wait_for_selector('div[data-testid="User-Name"] a[href^="/"]', timeout=10000)
            if username_elem:
                author_username = await username_elem.get_attribute("href")
                author_username = author_username.replace("/", "")
                print(f"  📝 ユーザー名: {author_username}")
        except Exception as e:
            print(f"  ⚠️ ユーザー名の取得に失敗: {e}")
            author_username = None
            
        # プロフィール画像URLの取得
        try:
            avatar_elem = await page.wait_for_selector('img[data-testid="tweetPhoto"], img[src*="profile_images"]', timeout=10000)
            if avatar_elem:
                author_profile_image_url = await avatar_elem.get_attribute("src")
                print(f"  📝 プロフィール画像URL: {author_profile_image_url}")
        except Exception as e:
            print(f"  ⚠️ プロフィール画像URLの取得に失敗: {e}")
            author_profile_image_url = None
            
        # 動画URLの取得
        try:
            video_elem = await page.wait_for_selector('video', timeout=10000)
            if video_elem:
                video_url = await video_elem.get_attribute("src")
                if video_url:
                    print(f"  ✅ 動画URLを取得: {video_url}")
                    return video_url
                else:
                    print("  ⚠️ 動画URLが見つかりませんでした")
        except Exception as e:
            print(f"  ⚠️ 動画URLの取得に失敗: {e}")
            
        # 元のページに戻る
        print(f"  🔙 元のページ {current_url} に戻ります")
        await page.goto(current_url, timeout=30000)
        
        return None
        
    except Exception as e:
        print(f"  ❌ 動画URL抽出中にエラーが発生: {str(e)}")
        try:
            # エラーが発生しても元のページに戻る
            await page.goto(current_url, timeout=30000)
        except:
            pass
        return None

async def search_videos(page, keyword, limit=10):
    """指定されたキーワードでTwitterを検索し、動画付きツイートを取得する"""
    print(f"🔍 キーワード '{keyword}' で検索中...")
    search_url = f"https://twitter.com/search?q={urllib.parse.quote(keyword)}&src=typed_query&f=video"
    await page.goto(search_url, wait_until="domcontentloaded", timeout=60000)

    # 検索結果の読み込みを待つ
    await page.wait_for_selector('[data-testid="tweet"]', timeout=30000)

    # --- SQL Server 接続 ---
    conn = connect_to_sql_server()
    if not conn:
        print("❌ SQL Server 接続に失敗しました。")
        return

    try:
        # スクロールとデータ収集
        processed_urls = set()
        for _ in range(min(SCROLL_COUNT, limit // 20)):
            try:
                # ページをスクロール
                print("🔄 ページをスクロール中...")
                await page.evaluate("window.scrollBy(0, document.body.scrollHeight)")
                await asyncio.sleep(SCROLL_INTERVAL)
                
                # 動画付きツイートを取得
                tweets = await page.query_selector_all('[data-testid="tweet"]')
                print(f"🔍 {len(tweets)}件のツイートを検出しました。")
                for tweet in tweets:
                    tweet_url = "N/A" # エラーログ用
                    try:
                        # ツイートURLを取得 (より具体的なセレクタ)
                        tweet_url_elem = await tweet.query_selector('a[href*="/status/"]')
                        if not tweet_url_elem:
                            print("  ⚠️ ツイートURL要素が見つかりませんでした")
                            continue

                        tweet_url_path = await tweet_url_elem.get_attribute("href")
                        # status を含まないリンク (例: /shiba_program) はスキップ
                        if "/status/" not in tweet_url_path:
                            # print(f"  ℹ️ status を含まないリンクはスキップ: {tweet_url_path}")
                            continue
                        tweet_url = "https://twitter.com" + tweet_url_path

                        if tweet_url in processed_urls:
                            # print(f"  ℹ️ 既に処理済みのツイート: {tweet_url}") # ログ削減
                            continue
                        processed_urls.add(tweet_url)
                        print(f"🔄 ツイート処理中: {tweet_url}")

                        # --- 動画URLを検索結果ページから直接取得試行 ---
                        video_url = None
                        try:
                            # ツイートコンテナ内の video 要素を探す
                            video_elem = await tweet.query_selector('video')
                            if video_elem:
                                video_url = await video_elem.get_attribute("src")
                                if video_url:
                                     print(f"  ✅ 動画URLを直接取得: {video_url}")
                                else:
                                     # srcがない場合、他の属性 (例: poster) も確認できるかもしれない
                                     poster_url = await video_elem.get_attribute("poster")
                                     if poster_url:
                                         print(f"  ⚠️ video要素にsrcはないがposterあり: {poster_url}")
                                     else:
                                         print(f"  ⚠️ video要素にsrcもposterもありません: {tweet_url}")
                            # else:
                                # print(f"  ℹ️ video要素が直接見つかりません: {tweet_url}")
                                # ここで他の抽出方法を試すことも可能 (例: data-* 属性、埋め込みJSON)
                        except Exception as video_e:
                            print(f"  ⚠️ 動画URLの直接取得中にエラー: {video_e}")

                        if not video_url:
                            print(f"  ❌ 動画URLが見つかりませんでした (スキップ): {tweet_url}")
                            continue # 動画URLがなければ保存しない

                        # メトリクスを取得 (検索結果ページの要素から)
                        metrics = await extract_tweet_metrics(tweet)
                        print(f"  📊 メトリクス: {metrics}")

                        # ユーザー情報を取得 (検索結果ページの要素から)
                        user_info = await extract_user_info(tweet)
                        print(f"  👤 ユーザー情報: {user_info.get('username')}")

                        # データを保存用に準備
                        video_data = {
                            'tweet_url': tweet_url,
                            'video_url': video_url,
                            'metrics': metrics,
                            **user_info
                        }

                        # --- SQL Server に保存 ---
                        await insert_video_data_sql_server(conn, video_data)

                        # 上限チェック
                        if len(processed_urls) >= limit:
                            print(f"🏁 取得上限 ({limit}件) に達しました。")
                            break # 内側ループを抜ける

                    except Exception as e:
                        print(f"❌ ツイート処理中の予期せぬエラー ({tweet_url}): {e}")
                        # このツイートの処理はスキップして次に進む
                        continue

                # 上限チェック (外側ループ用)
                if len(processed_urls) >= limit:
                    break # スクロールループも抜ける
                    
            except Exception as e:
                print(f"⚠️ スクロール中のエラー: {e}")

    finally:
        if conn:
            conn.close()
            print("ℹ️ SQL Server 接続を閉じました")

    print(f"✅ {len(processed_urls)}件のツイートを処理しました")

async def extract_user_info(tweet):
    """ツイートからユーザー情報を抽出する"""
    try:
        username = ''
        display_name = ''
        profile_image_url = ''
        tweet_text = ''
        
        # ユーザー名を取得
        username_elem = await tweet.query_selector('div[data-testid="User-Name"] a[href^="/"]')
        if username_elem:
            username = (await username_elem.get_attribute("href")).replace("/", "")
            
        # 表示名を取得
        display_name_elem = await tweet.query_selector('div[data-testid="User-Name"] a span')
        if display_name_elem:
            display_name = await display_name_elem.text_content()
            
        # プロフィール画像を取得
        avatar_elem = await tweet.query_selector('img[data-testid="tweetPhoto"], img[src*="profile_images"]')
        if avatar_elem:
            profile_image_url = await avatar_elem.get_attribute("src")
            
        # ツイート内容を取得
        content_elem = await tweet.query_selector('div[data-testid="tweetText"]')
        if content_elem:
            tweet_text = await content_elem.text_content()
            
        return {
            'username': username,
            'display_name': display_name,
            'profile_image_url': profile_image_url,
            'tweet_text': tweet_text
        }
    except Exception as e:
        print(f"⚠️ ユーザー情報の取得に失敗: {e}")
        return {}

async def extract_tweet_metrics(tweet):
    """ツイートからメトリクス（いいね数、リツイート数、閲覧数）を抽出する"""
    metrics = {
        'likes': 0,
        'retweets': 0,
        'views': 0
    }
    
    try:
        # いいね数を取得
        like_elem = await tweet.query_selector('[data-testid="like"] span span')
        if like_elem:
            likes_text = await like_elem.text_content()
            metrics['likes'] = convert_metric(likes_text)
        
        # リツイート数を取得
        retweet_elem = await tweet.query_selector('[data-testid="retweet"] span span')
        if retweet_elem:
            retweet_text = await retweet_elem.text_content()
            metrics['retweets'] = convert_metric(retweet_text)
        
        # 閲覧数を取得
        view_elem = await tweet.query_selector('a[href*="/analytics"]')
        if view_elem:
            view_text = await view_elem.text_content()
            metrics['views'] = convert_metric(view_text)
        
        return metrics
    except Exception as e:
        print(f"⚠️ メトリクス抽出中にエラー: {e}")
        return metrics

def convert_metric(value):
    """メトリクスの文字列を数値に変換する"""
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

async def setup_browser():
    """
    ブラウザをセットアップする
    
    ブラウザを起動し、必要な設定を行います。
    
    戻り値:
        Playwrightのブラウザオブジェクト
    """
    try:
        playwright = await async_playwright().start()
        browser = await playwright.chromium.launch(headless=False)
        return browser
    except Exception as e:
        print(f"❌ ブラウザセットアップ中にエラーが発生: {e}")
        return None

async def refresh_tweet_metrics(page):
    """
    ツイートのメトリクスを SQL Server で更新する
    """
    print("🔄 SQL Server のツイートメトリクスを更新中...")
    conn = connect_to_sql_server()
    if not conn:
        print("❌ SQL Server 接続に失敗しました。")
        return

    updated_count = 0
    total_tweets = 0

    def db_fetch_tweets():
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT tweetId, originalUrl FROM Tweet")
            return cursor.fetchall()
        except pyodbc.Error as ex:
            print(f"❌ SQL Server データ取得エラー: {ex}")
            return []
        finally:
            cursor.close()

    def db_update_metrics(tweet_id, metrics):
        cursor = conn.cursor()
        try:
            cursor.execute("""
                UPDATE Tweet
                SET likes = ?, retweets = ?, views = ?, updatedAt = GETDATE()
                WHERE tweetId = ?
            """, (metrics['likes'], metrics['retweets'], metrics['views'], tweet_id))
            conn.commit()
            return True
        except pyodbc.Error as ex:
            print(f"❌ SQL Server メトリクス更新エラー ({tweet_id}): {ex}")
            conn.rollback()
            return False
        finally:
            cursor.close()

    try:
        # データを取得 (同期処理を非同期で実行)
        tweets = await asyncio.to_thread(db_fetch_tweets)
        total_tweets = len(tweets)

        for tweet_id, tweet_url in tweets:
            try:
                # ツイートページに移動
                await page.goto(tweet_url, timeout=30000)
                await page.wait_for_load_state("networkidle", timeout=10000)

                # メトリクスを取得
                tweet_elem = await page.query_selector('[data-testid="tweet"]')
                if tweet_elem:
                    metrics = await extract_tweet_metrics(tweet_elem)

                    # データベースを更新 (同期処理を非同期で実行)
                    if await asyncio.to_thread(db_update_metrics, tweet_id, metrics):
                        print(f"  ✅ メトリクスを更新: {tweet_url}")
                        updated_count += 1
                else:
                    print(f"  ❌ ツイート要素が見つかりません: {tweet_url}")
            except Exception as e:
                print(f"  ❌ メトリクス更新中にエラー ({tweet_url}): {e}")

        print(f"✅ 合計 {updated_count}/{total_tweets} のツイートメトリクスを更新しました")
    except Exception as e:
        print(f"❌ メトリクス更新処理中にエラー: {e}")
    finally:
        if conn:
            conn.close()
            print("ℹ️ SQL Server 接続を閉じました")


async def update_all_tweet_data(page):
    """
    すべてのツイートデータを SQL Server で更新する
    """
    print("🔄 SQL Server の全ツイートデータを更新中...")
    conn = connect_to_sql_server()
    if not conn:
        print("❌ SQL Server 接続に失敗しました。")
        return

    updated_count = 0
    error_count = 0
    total_tweets = 0

    def db_fetch_tweets():
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT tweetId, originalUrl FROM Tweet")
            return cursor.fetchall()
        except pyodbc.Error as ex:
            print(f"❌ SQL Server データ取得エラー: {ex}")
            return []
        finally:
            cursor.close()

    def db_update_all(tweet_id, metrics, video_url, user_info):
        cursor = conn.cursor()
        try:
            cursor.execute("""
                UPDATE Tweet
                SET likes = ?, retweets = ?, views = ?,
                    videoUrl = COALESCE(?, videoUrl),
                    authorName = COALESCE(?, authorName),
                    authorUsername = COALESCE(?, authorUsername),
                    authorProfileImageUrl = COALESCE(?, authorProfileImageUrl),
                    content = COALESCE(?, content), -- content も更新対象に追加
                    updatedAt = GETDATE()
                WHERE tweetId = ?
            """, (
                metrics['likes'], metrics['retweets'], metrics['views'],
                video_url,
                user_info.get('display_name'), user_info.get('username'),
                user_info.get('profile_image_url'),
                user_info.get('tweet_text'), # content を追加
                tweet_id
            ))
            conn.commit()
            return True
        except pyodbc.Error as ex:
            print(f"❌ SQL Server 全データ更新エラー ({tweet_id}): {ex}")
            conn.rollback()
            return False
        finally:
            cursor.close()

    try:
        # データを取得 (同期処理を非同期で実行)
        tweets = await asyncio.to_thread(db_fetch_tweets)
        total_tweets = len(tweets)

        for tweet_id, tweet_url in tweets:
            try:
                # ツイートページに移動
                await page.goto(tweet_url, timeout=30000)
                await page.wait_for_load_state("networkidle", timeout=10000)

                # メトリクスとビデオURLを更新
                tweet_elem = await page.query_selector('[data-testid="tweet"]')
                if tweet_elem:
                    # メトリクスを取得
                    metrics = await extract_tweet_metrics(tweet_elem)

                    # ビデオURLを取得 (元のページに戻る処理を含む extract_video_url_from_tweet を使用)
                    # 注意: この関数は内部で page.goto を使うため、ループ内で使うと非効率になる可能性がある
                    # 本来はツイートページ上で必要な情報をまとめて取得する方が効率的
                    video_url = await extract_video_url_from_tweet(page, tweet_url)

                    # ユーザー情報を取得 (ツイート要素から取得)
                    user_info = await extract_user_info(tweet_elem)

                    # データベースを更新 (同期処理を非同期で実行)
                    if await asyncio.to_thread(db_update_all, tweet_id, metrics, video_url, user_info):
                        print(f"  ✅ データを更新: {tweet_url}")
                        updated_count += 1
                else:
                    print(f"  ❌ ツイート要素が見つかりません: {tweet_url}")
                    error_count += 1
            except Exception as e:
                print(f"  ❌ データ更新中にエラー ({tweet_url}): {e}")
                error_count += 1

        print(f"✅ 合計 {updated_count}/{total_tweets} のツイートを更新しました（エラー: {error_count}件）")
    except Exception as e:
        print(f"❌ データ更新処理中にエラー: {e}")
    finally:
        if conn:
            conn.close()
            print("ℹ️ SQL Server 接続を閉じました")


async def test_database_connection():
    """SQL Server データベース接続テスト"""
    print("🧪 SQL Server 接続テスト実行中...")
    conn = connect_to_sql_server()
    if not conn:
        print("❌ SQL Server 接続失敗")
        return False

    cursor = conn.cursor()
    try:
        # 簡単なクエリを実行して接続を確認
        cursor.execute("SELECT @@VERSION")
        version = cursor.fetchone()
        print(f"✅ SQL Server 接続成功: {version[0]}")

        # テーブル存在確認 (スキーマ名を指定する必要があるかもしれない)
        # ここではデフォルトスキーマ 'dbo' を仮定
        table_name = 'Tweet'
        schema_name = 'dbo' # 必要に応じて変更
        cursor.execute(f"SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?", (schema_name, table_name))
        if cursor.fetchone()[0] > 0:
            print(f"✅ テーブル '{schema_name}.{table_name}' が存在します")

            # カラム情報取得 (簡易版)
            cursor.execute(f"SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?", (schema_name, table_name))
            columns = cursor.fetchall()
            print(f"✅ テーブル '{table_name}' のカラム:")
            for col in columns:
                print(f"  - {col[0]} ({col[1]})")

            # テストデータの挿入・確認・削除 (非同期関数を呼び出す)
            test_id_str = f"test_{int(time.time())}"
            test_data = {
                'tweet_url': f'https://twitter.com/test/{test_id_str}',
                'video_url': 'https://video.twimg.com/test.mp4',
                'username': 'test_user',
                'display_name': 'Test User',
                'profile_image_url': 'https://pbs.twimg.com/profile_images/test.jpg',
                'tweet_text': 'This is a test tweet for SQL Server',
                'metrics': {'likes': 10, 'retweets': 5, 'views': 100}
            }

            # テストデータ挿入 (非同期関数を同期的に呼び出す)
            # 注意: test_database_connection 自体は非同期だが、insert_video_data_sql_server は非同期
            # 本来は test_database_connection も非同期にするか、ここでイベントループを使うべき
            # ここでは簡略化のため直接呼び出すが、実行コンテキストによっては問題が起きる可能性あり
            # → insert_video_data_sql_server は await が必要なので、この関数も async def にする
            insert_result = await insert_video_data_sql_server(conn, test_data)

            if insert_result:
                print("✅ テストデータ挿入成功")

                # 挿入したデータを確認
                cursor.execute("SELECT * FROM Tweet WHERE tweetId = ?", (test_id_str,))
                data = cursor.fetchone()
                if data:
                    print("✅ 挿入データの読み取り成功")
                else:
                    print("❌ 挿入データの読み取り失敗")

                # テストデータを削除
                cursor.execute("DELETE FROM Tweet WHERE tweetId = ?", (test_id_str,))
                conn.commit()
                print("✅ テストデータ削除完了")
            else:
                print("❌ テストデータ挿入失敗")

        else:
            print(f"❌ テーブル '{schema_name}.{table_name}' が見つかりません")
            return False

        return True

    except pyodbc.Error as ex:
        sqlstate = ex.args[0]
        print(f"❌ SQL Server テスト中にエラー: {sqlstate} - {ex}")
        return False
    finally:
        cursor.close()
        conn.close()
        print("ℹ️ SQL Server 接続を閉じました")


async def autosave_data():
    """一時データを SQL Server に保存する"""
    if not temp_video_data:
        return

    conn = connect_to_sql_server()
    if not conn:
        print("❌ SQL Server 接続に失敗しました (自動保存)。")
        # 接続失敗時はデータを失わないようにクリアしない
        return

    try:
        print(f"🔄 {len(temp_video_data)}件のデータを SQL Server に自動保存します...")
        saved_count = 0
        failed_data = []
        for video_data in temp_video_data:
            # insert_video_data_sql_server は非同期なので await する
            if await insert_video_data_sql_server(conn, video_data):
                saved_count += 1
            else:
                failed_data.append(video_data) # 失敗したデータを保持

        print(f"✅ {saved_count}/{len(temp_video_data)}件のデータを保存しました")
        # 成功したデータのみクリアし、失敗したデータは残す
        temp_video_data[:] = failed_data
        if failed_data:
             print(f"⚠️ {len(failed_data)}件のデータの保存に失敗しました。データは保持されます。")

    except Exception as e:
        print(f"❌ 自動保存中にエラー: {e}")
        # エラー時もデータはクリアしない
    finally:
        if conn:
            conn.close()
            print("ℹ️ SQL Server 接続を閉じました (自動保存)")


# 終了時に一時データを保存するための設定
# (register_autosave と exit_handler は非同期処理に対応させる必要あり)
# atexit は非同期関数を直接サポートしないため、工夫が必要
# ここでは exit_handler 内で新しいイベントループを作成して実行する
def register_autosave():
    """終了時の自動保存を登録する"""
    def exit_handler():
        if temp_video_data:
            print(f"🔄 終了時に{len(temp_video_data)}件のデータを SQL Server に保存します...")
            try:
                # 新しいイベントループを作成して非同期関数を実行
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                # autosave_data は非同期なので run_until_complete で実行
                loop.run_until_complete(autosave_data())
                loop.close()
                print("✅ 終了時の自動保存処理が完了しました。")
            except Exception as e:
                print(f"❌ 終了時の自動保存中にエラー: {e}")

    atexit.register(exit_handler)


async def main():
    """メイン関数"""
    parser = argparse.ArgumentParser(description="Twitter動画検索・保存ツール")
    parser.add_argument("query", nargs="?", help="検索キーワード")
    parser.add_argument("--limit", type=int, default=10, help="取得する動画の最大数")
    parser.add_argument("--save", action="store_true", help="結果をデータベースに保存")
    parser.add_argument("--refresh-metrics", action="store_true", help="保存済みツイートのメトリクスを更新")
    parser.add_argument("--update-all", action="store_true", help="保存済みツイートの全データを更新")
    parser.add_argument("--test", action="store_true", help="データベース接続テストを実行")
    args = parser.parse_args()
    
    # 自動保存を設定
    register_autosave()
    
    # テストモード
    if args.test:
        return await test_database_connection()
    
    # 操作の種類をチェック
    if not (args.query or args.refresh_metrics or args.update_all):
        parser.print_help()
        return
    
    try:
        # ブラウザを起動
        print("🌐 ブラウザを起動中...")
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False)
            page = await browser.new_page()
            print("🌐 ブラウザが起動しました")
            
            # ログイン
            if not await login_to_twitter(page):
                print("❌ ログインに失敗しました")
                return
            
            # 実行する操作を決定
            if args.refresh_metrics:
                await refresh_tweet_metrics(page)
            elif args.update_all:
                await update_all_tweet_data(page)
            elif args.query:
                await search_videos(page, args.query, args.limit)
                
                # 自動保存が設定されていない場合は、終了前に明示的に保存
                if args.save:
                    await autosave_data()
            
            print("\n✨ 処理が完了しました")
            
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        # エラー発生時も保存を試みる
        if temp_video_data:
            print("⚠️ エラーが発生しましたが、収集したデータの保存を試みます...")
            await autosave_data()

if __name__ == "__main__":
    asyncio.run(main())
