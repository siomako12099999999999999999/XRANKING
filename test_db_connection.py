"""
データベース接続とテーブル作成のテスト用スクリプト
"""
import os
import pyodbc
from dotenv import load_dotenv
import uuid
import time

# .env ファイルの読み込み
load_dotenv()

def test_db_connection():
    """データベース接続をテストする関数"""
    try:
        # 環境変数から設定を取得
        server = os.getenv('SQL_SERVER', 'localhost\\SQLEXPRESS')
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
        
        # データベースが存在するか確認
        cursor = conn.cursor()
        cursor.execute("SELECT DB_NAME()")
        db_name = cursor.fetchone()[0]
        print(f"現在のデータベース: {db_name}")
        
        # テーブルの存在を確認
        try:
            cursor.execute("SELECT TOP 1 * FROM Tweet")
            print("✅ Tweet テーブルは既に存在します")
        except Exception as e:
            if 'Invalid object name' in str(e):
                print("⚠️ Tweet テーブルが見つかりません。新規作成します")
                
                # テーブル作成SQL
                cursor.execute("""
                CREATE TABLE Tweet (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    tweetId NVARCHAR(50) UNIQUE,
                    videoUrl NVARCHAR(500),
                    originalUrl NVARCHAR(500),
                    content NVARCHAR(MAX),
                    likes INT DEFAULT 0,
                    retweets INT DEFAULT 0,
                    views INT DEFAULT 0,
                    timestamp NVARCHAR(100),
                    authorId NVARCHAR(100),
                    authorName NVARCHAR(200),
                    authorUsername NVARCHAR(200),
                    authorProfileImageUrl NVARCHAR(500),
                    thumbnailUrl NVARCHAR(500),
                    createdAt DATETIME DEFAULT GETDATE(),
                    updatedAt DATETIME DEFAULT GETDATE()
                )
                """)
                
                # インデックス作成
                cursor.execute("CREATE INDEX idx_tweet_id ON Tweet(tweetId)")
                cursor.execute("CREATE INDEX idx_video_url ON Tweet(videoUrl)")
                cursor.execute("CREATE INDEX idx_likes ON Tweet(likes DESC)")
                cursor.execute("CREATE INDEX idx_views ON Tweet(views DESC)")
                cursor.execute("CREATE INDEX idx_created_at ON Tweet(createdAt DESC)")
                
                conn.commit()
                print("✅ Tweet テーブルを作成しました")
            else:
                print(f"❌ テーブル確認中にエラー: {e}")
        
        # 現在の日時を使用して一意なツイートIDを生成
        # 複数のテストデータを挿入 (5件)
        for i in range(5):
            unique_id = str(uuid.uuid4())
            test_id = f"test_{unique_id[:8]}_{int(time.time())}"
            
            try:
                cursor.execute("""
                INSERT INTO Tweet 
                (tweetId, videoUrl, originalUrl, content, likes, retweets, views, authorId, authorName, authorUsername, authorProfileImageUrl)
                VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    test_id, 
                    f"https://video.twimg.com/test_{i}.mp4", 
                    f"https://twitter.com/test/status/{1000000 + i}", 
                    f"テスト投稿 #{i}", 
                    100 + i*10, 
                    50 + i*5, 
                    1000 + i*100,
                    f"user_{1000 + i}",
                    f"テストユーザー {i}",
                    f"test_user_{i}",
                    f"https://pbs.twimg.com/profile_images/test_user_{i}/{uuid.uuid4().hex[:8]}_normal.jpg"
                ))
                conn.commit()
                print(f"✅ テストデータ #{i+1} を挿入しました: {test_id}")
            except Exception as e:
                if 'Violation of UNIQUE KEY constraint' in str(e):
                    print(f"⚠️ 同じIDのデータが既に存在します: {test_id}")
                else:
                    print(f"❌ データ #{i+1} 挿入中にエラー: {e}")
        
        # データを確認
        cursor.execute("SELECT COUNT(*) FROM Tweet")
        count = cursor.fetchone()[0]
        print(f"Tweet テーブルのレコード数: {count}")
        
        # 直近の5件を表示
        cursor.execute("SELECT TOP 5 id, tweetId, videoUrl, likes, createdAt FROM Tweet ORDER BY createdAt DESC")
        rows = cursor.fetchall()
        print("\n最新のツイートデータ:")
        for row in rows:
            print(f"ID: {row[0]}, TweetID: {row[1]}, VideoURL: {row[2][:30]}..., Likes: {row[3]}, CreatedAt: {row[4]}")
        
        return True
        
    except pyodbc.Error as e:
        print(f"❌ データベース接続/操作エラー: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()
            print("データベース接続を閉じました")

if __name__ == "__main__":
    test_db_connection() 