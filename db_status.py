"""
データベースの状態を確認するスクリプト
"""
import os
import pyodbc
from dotenv import load_dotenv

# .env ファイルの読み込み
load_dotenv()

def check_db_status():
    """データベースの状態を確認"""
    try:
        # 環境変数から設定を取得
        server = os.getenv('SQL_SERVER', 'localhost')
        database = os.getenv('SQL_DATABASE', 'xranking')
        username = os.getenv('SQL_USER', 'sa')
        password = os.getenv('SQL_PASSWORD', '')
        
        print(f"接続情報: サーバー={server}, データベース={database}, ユーザー={username}")
        
        # 接続
        conn = pyodbc.connect(
            "DRIVER={ODBC Driver 17 for SQL Server};"
            f"SERVER={server};"
            f"DATABASE={database};"
            f"UID={username};"
            f"PWD={password};"
            "TrustServerCertificate=yes;"
        )
        print("✅ データベース接続成功！")
        
        cursor = conn.cursor()
        
        # レコード数を確認
        cursor.execute("SELECT COUNT(*) FROM Tweet")
        count = cursor.fetchone()[0]
        print(f"Tweet テーブルのレコード数: {count}")
        
        if count == 0:
            print("データがありません。")
            return True
        
        # テーブルのカラム情報を取得
        cursor.execute("""
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'Tweet'
            ORDER BY ORDINAL_POSITION
        """)
        
        columns = [row[0] for row in cursor.fetchall()]
        print(f"テーブルのカラム: {', '.join(columns)}")
        
        # 正しいカラム名を使用して直近の10件を表示
        cursor.execute("""
        SELECT TOP 10 
            id, tweetId, videoUrl, originalUrl, 
            likes, retweets, views, 
            authorUsername, authorName, authorProfileImageUrl, content, createdAt, updatedAt 
        FROM Tweet 
        ORDER BY createdAt DESC
        """)
        
        rows = cursor.fetchall()
        print("\n📋 最新のツイートデータ:")
        for row in rows:
            id, tweet_id, video_url, original_url, likes, retweets, views, author_username, author_name, profile_img, content, created, updated = row
            # 短縮表示
            video_url_display = (video_url[:50] + '...') if video_url and len(video_url) > 50 else video_url
            content_display = (content[:50] + '...') if content and len(content) > 50 else content
            
            print(f"ID: {id}, TweetID: {tweet_id}")
            print(f"  📝 内容: {content_display}")
            print(f"  🔗 URL: {video_url_display}")
            print(f"  👍 いいね: {likes:,}, 🔄 リツイート: {retweets:,}, 👁 視聴: {views:,}")
            if author_username:
                print(f"  👤 投稿者: {author_name} (@{author_username})")
                if profile_img:
                    print(f"  🖼 プロフィール画像: {profile_img}")
            print(f"  ⏰ 作成: {created}, 🔄 更新: {updated}")
            print("---")
        
        # 統計情報
        cursor.execute("SELECT SUM(likes), SUM(retweets), SUM(views) FROM Tweet")
        result = cursor.fetchone()
        total_likes = result[0] or 0
        total_retweets = result[1] or 0
        total_views = result[2] or 0
        
        print(f"\n📊 統計情報:")
        print(f"合計いいね数: {total_likes:,}")
        print(f"合計リツイート数: {total_retweets:,}")
        print(f"合計視聴回数: {total_views:,}")
        print(f"平均いいね数: {total_likes/count if count > 0 else 0:.1f}")
        print(f"平均リツイート数: {total_retweets/count if count > 0 else 0:.1f}")
        print(f"平均視聴回数: {total_views/count if count > 0 else 0:.1f}")
        
        # 最も人気のツイート (いいね数)
        cursor.execute("""
        SELECT TOP 5 
            tweetId, videoUrl, originalUrl, 
            likes, retweets, views, 
            authorUsername, authorName, content
        FROM Tweet 
        ORDER BY likes DESC
        """)
        
        rows = cursor.fetchall()
        print("\n👍 いいね数トップ5:")
        for i, row in enumerate(rows, 1):
            tweet_id, video_url, original_url, likes, retweets, views, author_username, author_name, content = row
            content_display = (content[:50] + '...') if content and len(content) > 50 else content
            
            print(f"{i}. いいね: {likes:,}, リツイート: {retweets:,}, 視聴: {views:,}")
            print(f"   📝 内容: {content_display}")
            print(f"   🔗 URL: {original_url or video_url}")
            if author_username:
                print(f"   👤 投稿者: {author_name} (@{author_username})")
            print("---")
        
        # 最も視聴回数の多いツイート
        cursor.execute("""
        SELECT TOP 5 
            tweetId, videoUrl, originalUrl, 
            likes, retweets, views, 
            authorUsername, authorName, content
        FROM Tweet 
        ORDER BY views DESC
        """)
        
        rows = cursor.fetchall()
        print("\n👁 視聴回数トップ5:")
        for i, row in enumerate(rows, 1):
            tweet_id, video_url, original_url, likes, retweets, views, author_username, author_name, content = row
            content_display = (content[:50] + '...') if content and len(content) > 50 else content
            
            print(f"{i}. 視聴: {views:,}, いいね: {likes:,}, リツイート: {retweets:,}")
            print(f"   📝 内容: {content_display}")
            print(f"   🔗 URL: {original_url or video_url}")
            if author_username:
                print(f"   👤 投稿者: {author_name} (@{author_username})")
            print("---")
        
        # ユーザー統計
        cursor.execute("""
        SELECT 
            authorUsername, authorName,
            COUNT(*) as tweet_count,
            SUM(likes) as total_likes,
            SUM(views) as total_views
        FROM Tweet
        WHERE authorUsername IS NOT NULL
        GROUP BY authorUsername, authorName
        ORDER BY total_likes DESC
        """)
        
        rows = cursor.fetchall()
        print("\n👥 ユーザー統計:")
        for row in rows:
            author_username, author_name, tweet_count, user_likes, user_views = row
            print(f"@{author_username} ({author_name})")
            print(f"  ツイート数: {tweet_count}, 合計いいね: {user_likes:,}, 合計視聴: {user_views:,}")
            print("---")
        
        return True
        
    except pyodbc.Error as e:
        print(f"❌ データベース接続/操作エラー: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()
            print("データベース接続を閉じました")

if __name__ == "__main__":
    check_db_status() 