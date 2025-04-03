# -*- coding: utf-8 -*-
"""
Twitter ランキング上位ツイートへの自動リプライボット
==================================================

機能:
- データベースからランキング上位のツイートを取得
- Twitterにログイン
- 各ツイートに定型文でリプライを送信

注意:
- TwitterのUI変更によりセレクタの調整が必要になる場合があります。
- レート制限やスパム判定を避けるため、適切な待機時間を設けてください。
- 1時間ごとの実行は外部スケジューラで行う必要があります。
"""

import time
import sys
import os
# import asyncio # No longer needed for sync version
import argparse
import pyodbc
from playwright.sync_api import sync_playwright, TimeoutError, Error as PlaywrightError # Use sync_api
from dotenv import load_dotenv
from urllib.parse import urlparse, parse_qs, unquote_plus

# --- 設定 ---
RANKING_LIMIT = 20  # リプライ対象のランキング上限
REPLY_DELAY_SECONDS = 60 # 各リプライ間の待機時間（秒） - スパム判定回避のため長めに設定

# --- 環境変数読み込み ---
load_dotenv()
TWITTER_EMAIL = os.getenv("TWITTER_EMAIL")
TWITTER_PASSWORD = os.getenv("TWITTER_PASSWORD")
TWITTER_ID = os.getenv("TWITTER_ID") # ログイン時のユーザー名確認用
DATABASE_URL = os.getenv("DATABASE_URL")

# --- ログ関数 ---
def log_info(message):
    print(f"[INFO] {message}")

def log_error(message):
    print(f"[ERROR] {message}", file=sys.stderr)

def log_warning(message):
    print(f"[WARN] {message}")

# --- データベース接続 ---
def connect_db():
    """データベースに接続する (pyodbc, ODBC接続文字列)"""
    if not DATABASE_URL:
        log_error("環境変数 DATABASE_URL が設定されていません。")
        return None

    connection_string = ""
    try:
        # URL形式を解析してODBC接続文字列を作成
        from urllib.parse import urlparse, parse_qs, unquote_plus

        # Add debug print before parsing
        print(f"[DEBUG] String being parsed by urlparse: '{DATABASE_URL}'")

        parsed_url = urlparse(DATABASE_URL)
        query_params = parse_qs(parsed_url.query)

        server = parsed_url.hostname
        port = parsed_url.port if parsed_url.port else 1433
        database = parsed_url.path.lstrip('/')
        username = unquote_plus(parsed_url.username) if parsed_url.username else None
        password = unquote_plus(parsed_url.password) if parsed_url.password else None
        driver = "{ODBC Driver 17 for SQL Server}" # 必要に応じて調整
        trust_cert = query_params.get('trustServerCertificate', ['false'])[0].lower() == 'true'

        if not all([server, database, username, password]):
            log_error("DATABASE_URL の解析に失敗。情報不足。")
            return None

        connection_string = (
            f"DRIVER={driver};"
            f"SERVER={server},{port};"
            f"DATABASE={database};"
            f"UID={username};"
            f"PWD={password};"
        )
        if trust_cert:
            connection_string += "TrustServerCertificate=yes;"

        log_info(f"生成されたODBC接続文字列 (パスワード伏字): DRIVER=...;SERVER={server},{port};DATABASE={database};UID={username};PWD=***;")
        log_info("ODBC接続文字列でデータベース接続試行中...")
        conn = pyodbc.connect(connection_string, autocommit=False) # 自動コミットはFalse推奨
        log_info("データベース接続成功")
        return conn
    except pyodbc.Error as ex:
        sqlstate = ex.args[0]
        log_error(f"データベース接続エラー (pyodbc): {sqlstate} - {ex}")
        log_error(f"試行した接続文字列: {connection_string}") # エラー時に接続文字列もログ出力
        return None
    except Exception as e:
        log_error(f"データベース接続中に予期せぬエラー: {e}")
        log_error(f"試行した接続文字列: {connection_string}")
        return None

# --- ランキングデータ取得 ---
def fetch_top_tweets(conn, limit=RANKING_LIMIT):
    """データベースから閲覧数上位のツイートを取得する"""
    log_info(f"閲覧数上位{limit}件のツイートを取得中...")
    cursor = conn.cursor()
    tweets = []
    try:
        # いいね数(likes), リツイート数(retweets), 閲覧数(views) の合計値でランキング
        log_info("いいね数+リツイート数+閲覧数の合計でランキングデータを取得中...")
        query = f"""
        WITH RankedTweets AS (
            SELECT
                originalUrl,
                (ISNULL(likes, 0) + ISNULL(retweets, 0) + ISNULL(views, 0)) AS totalScore,
                ROW_NUMBER() OVER (ORDER BY (ISNULL(likes, 0) + ISNULL(retweets, 0) + ISNULL(views, 0)) DESC) as rank
            FROM Tweet
            WHERE originalUrl IS NOT NULL AND originalUrl != ''
        )
        SELECT TOP (?)
            originalUrl,
            rank
        FROM RankedTweets
        ORDER BY rank ASC;
        """
        cursor.execute(query, (limit,))
        rows = cursor.fetchall()
        tweets = [{"url": row.originalUrl, "rank": row.rank} for row in rows]
        log_info(f"{len(tweets)}件のツイートを取得しました。")
    except pyodbc.Error as ex:
        sqlstate = ex.args[0]
        log_error(f"ランキングデータ取得エラー: {sqlstate} - {ex}")
    except Exception as e:
        log_error(f"ランキングデータ取得中に予期せぬエラー: {e}")
    finally:
        cursor.close()
    return tweets

# --- Twitterログイン (Sync version) ---
def login_to_twitter(page): # Remove async
    """X（旧Twitter）にログインする"""
    log_info("ログインページを開きます...")
    try:
        page.goto("https://x.com/i/flow/login", timeout=120000) # Remove await
        page.wait_for_load_state("networkidle", timeout=60000) # Remove await
    except (TimeoutError, PlaywrightError) as e:
        log_error(f"ログインページの読み込みに失敗: {e}")
        return False

    try:
        log_info("メールアドレスを入力します...")
        input_selector = "input[autocomplete='username']"
        page.wait_for_selector(input_selector, timeout=30000) # Remove await
        if TWITTER_EMAIL:
            page.locator(input_selector).fill(TWITTER_EMAIL) # Remove await
            page.locator(input_selector).press("Enter") # Remove await
            time.sleep(3) # Use time.sleep instead of asyncio.sleep
        else:
            log_warning("TWITTER_EMAIL が設定されていません")
            return False

        # ユーザー名確認画面 (必要な場合)
        username_selector = "input[data-testid='ocfEnterTextTextInput']"
        try:
            page.wait_for_selector(username_selector, timeout=5000) # Remove await
            if TWITTER_ID:
                log_info("ユーザー名を入力します...")
                page.locator(username_selector).fill(TWITTER_ID) # Remove await
                page.locator(username_selector).press("Enter") # Remove await
                time.sleep(2) # Use time.sleep
            else:
                # ユーザー名確認画面が出たがIDがない場合、エラーにするか、手動介入を促すか
                log_warning("ユーザー名確認画面が表示されましたが、TWITTER_ID が設定されていません")
                # return False # または手動介入を待つ処理
        except TimeoutError:
            log_info("ユーザーネーム確認画面はスキップされました。")
        except PlaywrightError as e:
             log_warning(f"ユーザーネーム確認画面の処理中にエラー: {e}")


        log_info("パスワードを入力します...")
        password_selector = "input[name='password']"
        page.wait_for_selector(password_selector, timeout=15000) # Remove await
        if TWITTER_PASSWORD:
            page.locator(password_selector).fill(TWITTER_PASSWORD) # Remove await
            page.locator(password_selector).press("Enter") # Remove await
            time.sleep(5) # Use time.sleep
        else:
            log_warning("TWITTER_PASSWORD が設定されていません")
            return False

        # 2FAチェック (基本的な可視性チェックのみ)
        try:
            two_fa_input = page.locator("input[data-testid='ocfEnterTextTextInput']")
            if two_fa_input.is_visible(timeout=5000): # Remove await
                log_warning("2FAが有効です。このスクリプトは現在2FAに自動対応していません。")
                # ここでスクリプトを停止するか、手動介入を促す
                return False # 自動処理不可のため失敗とする
        except TimeoutError:
            log_info("2FA入力画面は表示されませんでした。")
        except PlaywrightError as e:
            log_warning(f"2FAチェック中にエラー: {e}")


        # ログイン成功確認 (ホームタイムラインが表示されるか)
        log_info("ログイン後の画面遷移を確認中...")
        home_timeline_selector = "div[aria-label='Home timeline'], div[data-testid='primaryColumn']" # いくつかの可能性
        try:
            page.wait_for_selector(home_timeline_selector, timeout=20000) # Remove await
            log_info("ログイン成功！")
            return True
        except TimeoutError:
            log_error("ログインに失敗しました。ホーム画面が表示されませんでした。")
            # ログイン失敗時のスクリーンショットやHTMLを保存するとデバッグに役立つ
            # await page.screenshot(path="login_failure.png")
            # html = await page.content()
            # with open("login_failure.html", "w", encoding="utf-8") as f:
            #     f.write(html)
            return False

    except (TimeoutError, PlaywrightError) as e:
        log_error(f"ログイン処理中にエラーが発生しました: {e}")
        return False
    except Exception as e:
        log_error(f"ログイン処理中に予期せぬエラー: {e}")
        return False


# --- リプライ処理 (Sync version) ---
def reply_to_tweet(page, tweet_url, rank, app_url, test_mode=False): # Remove async
    """指定されたツイートにリプライを送信する"""
    log_info(f"ツイート {rank}位 ({tweet_url}) へのリプライ処理開始... (テストモード: {test_mode})")
    try:
        # ツイートページに移動 (wait_until を変更)
        log_info(f"  ページ移動: {tweet_url}")
        page.goto(tweet_url, timeout=60000, wait_until="domcontentloaded") # Change wait_until
        log_info("  ページDOM読み込み完了。ツイート本体を待機中...")

        # ツイート本体が表示されるのを待つ
        tweet_body_selector = 'article[data-testid="tweet"]'
        page.wait_for_selector(tweet_body_selector, timeout=30000) # Wait for main tweet article
        log_info("  ツイート本体を検出。")

        # リプライボタンを探してクリック
        # セレクタはTwitterのUI変更に合わせて調整が必要
        # Try using page.click directly with a more specific selector and fallback
        reply_button_selector_primary = 'button[data-testid="reply"]' # Try button first
        reply_button_selector_fallback = '[aria-label*="Reply"][role="button"]' # Fallback using aria-label

        log_info(f"  リプライボタン ({reply_button_selector_primary} または {reply_button_selector_fallback}) を検索・クリック試行...")
        try:
            # page.click waits for the element and clicks it
            page.click(reply_button_selector_primary, timeout=15000)
            log_info(f"  リプライボタン ({reply_button_selector_primary}) をクリックしました。")
            time.sleep(2) # Wait for reply box to appear
        except TimeoutError:
            log_warning(f"  セレクター '{reply_button_selector_primary}' でボタンが見つかりませんでした。フォールバック試行...")
            try:
                page.click(reply_button_selector_fallback, timeout=10000)
                log_info(f"  フォールバックセレクター ({reply_button_selector_fallback}) でリプライボタンをクリックしました。")
                time.sleep(2) # Wait for reply box to appear
            except TimeoutError:
                log_error(f"  フォールバックセレクターでもリプライボタンが見つかりませんでした。")
                raise # Re-raise the exception to be caught by the outer try-except
            except Exception as e_fallback:
                log_error(f"  フォールバックセレクターでのクリック中にエラー: {e_fallback}")
                raise
        except Exception as e_click:
             log_error(f"  リプライボタンのクリック中に予期せぬエラー: {e_click}")
             raise # Re-raise the exception

        # リプライ入力欄の検索は不要 (フィードバックに基づき削除)
        # リプライボタンクリック後にフォーカスが当たっていると仮定し、直接入力
        reply_message = f"現在XRANKINGで{rank}位にランクインです。 {app_url}"
        log_info(f"  メッセージ入力 (キーボード入力): {reply_message}")
        page.keyboard.type(reply_message) # Use keyboard type assuming focus is correct
        time.sleep(1)

        # 投稿ボタンを探してクリック (より具体的なセレクターに変更)
        # Target the specific post button within the reply context, ensuring it's enabled
        post_button_selector = 'div[data-testid="tweetButton"]:not([aria-disabled="true"])'
        log_info(f"  投稿ボタン ({post_button_selector}) を検索中...")
        # Find the button that contains the text "Reply" or "Post"
        post_button = page.locator(post_button_selector).filter(has_text="Reply") \
                          .or_(page.locator(post_button_selector).filter(has_text="Post"))
        post_button.wait_for(state="visible", timeout=10000)

        # ボタンが無効化されていないか確認 (オプション)
        is_disabled = post_button.is_disabled() # Remove await
        if is_disabled:
            log_warning("  投稿ボタンが無効化されています。スキップします。")
            return False

        if test_mode:
            log_info("  [テストモード] 投稿ボタンをクリックする代わりにスキップします。")
            # テストモードではクリックせずに成功したとみなす
        else:
            post_button.click() # Remove await
            log_info("  投稿ボタンをクリックしました。")
            time.sleep(5) # Use time.sleep

        # 投稿成功確認 (テストモードでも成功扱い)
        # ここでは簡易的にエラーがないことを成功とみなす
        log_info(f"✅ ツイート {rank}位 ({tweet_url}) へのリプライ成功！")
        return True

    except TimeoutError as e:
        log_error(f"❌ リプライ処理中にタイムアウト ({tweet_url}): 要素が見つからないか、ページの読み込みに時間がかかりすぎている可能性があります。 {e}")
        return False
    except PlaywrightError as e:
         log_error(f"❌ リプライ処理中に Playwright エラー ({tweet_url}): {e}")
         return False
    except Exception as e:
        log_error(f"❌ リプライ処理中に予期せぬエラー ({tweet_url}): {e}")
        return False

# --- メイン処理 (Sync version) ---
def main(app_url, test_mode): # Remove async
    """メイン処理"""
    log_info(f"リプライボット処理開始... (テストモード: {test_mode})")

    conn = connect_db()
    if not conn:
        return # DB接続失敗時は終了

    top_tweets = fetch_top_tweets(conn)
    conn.close() # DBからデータ取得後は接続を閉じる

    if not top_tweets:
        log_info("リプライ対象のツイートが見つかりませんでした。処理を終了します。")
        return

    log_info(f"リプライ対象ツイート数: {len(top_tweets)}")

    playwright = None # Keep track for stopping later
    browser = None
    try:
        # Use sync_playwright context manager
        with sync_playwright() as p:
            playwright = p # Assign to outer scope variable if needed for stopping, though context manager handles it
            # headfulモードで起動 (headless=False)
            browser = p.chromium.launch(headless=False) # Use p instead of await playwright
            context = browser.new_context( # Use browser instead of await browser
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
            )
            page = context.new_page() # Use context instead of await context
            log_info("ブラウザを起動しました。")

            if not login_to_twitter(page): # Remove await
                log_error("ログインに失敗したため、処理を中断します。")
                return # ログイン失敗時は終了

            success_count = 0
            fail_count = 0
            for tweet in top_tweets:
                # Pass test_mode to reply_to_tweet
                if reply_to_tweet(page, tweet["url"], tweet["rank"], app_url, test_mode): # Remove await
                    success_count += 1
                else:
                    fail_count += 1
                    log_warning(f"ツイート {tweet['rank']}位 ({tweet['url']}) へのリプライに失敗しました。")

                # 次のリプライまでの待機
                log_info(f"{REPLY_DELAY_SECONDS}秒待機します...")
                time.sleep(REPLY_DELAY_SECONDS) # Use time.sleep

            log_info(f"処理完了 - 成功: {success_count}件, 失敗: {fail_count}件")

    # Context manager handles browser closing automatically
    # No need for explicit browser.close() or playwright.stop() in finally
    except Exception as e:
        log_error(f"メイン処理中に予期せぬエラー: {e}")
    # finally block is less critical with context manager, but can be kept for extra cleanup if needed

if __name__ == "__main__":
    # No need to set event loop policy for sync version
    # if sys.version_info >= (3, 8) and sys.platform == "win32":
    #     asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

    parser = argparse.ArgumentParser(description="Twitter ランキング上位ツイートへの自動リプライボット")
    parser.add_argument("app_url", help="リプライに含めるXRANKINGアプリのURL")
    parser.add_argument("--test", action="store_true", help="テストモードで実行（リプライ投稿を行わない）")
    args = parser.parse_args()

    main(args.app_url, args.test) # Call main directly, no asyncio.run needed
