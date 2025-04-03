import os
import pyodbc
from dotenv import load_dotenv
import datetime

# .env ファイルから環境変数を読み込む
load_dotenv()

def connect_to_db():
    """データベースに接続する"""
    try:
        # 接続情報を取得
        server = os.getenv("SQL_SERVER")
        database = os.getenv("SQL_DATABASE")
        user = os.getenv("SQL_USER")
        password = os.getenv("SQL_PASSWORD")
        
        # 接続文字列の表示（パスワードは隠す）
        connection_string = (
            "DRIVER={ODBC Driver 17 for SQL Server};"
            f"SERVER={server};"
            f"DATABASE={database};"
            f"UID={user};"
            "PWD=********;"
            "TrustServerCertificate=yes;"
        )
        print(f"接続文字列: {connection_string}")
        
        # 実際の接続
        conn = pyodbc.connect(
            "DRIVER={ODBC Driver 17 for SQL Server};"
            f"SERVER={server};"
            f"DATABASE={database};"
            f"UID={user};"
            f"PWD={password};"
            "TrustServerCertificate=yes;"
        )
        print("✅ データベース接続成功！")
        return conn
    except pyodbc.Error as e:
        print(f"❌ データベース接続失敗: {e}")
        return None

def ensure_database_setup(conn):
    """データベースとテーブルが存在することを確認する"""
    try:
        cursor = conn.cursor()
        
        # Tweetテーブルの存在確認と作成
        cursor.execute("""
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Tweet]') AND type in (N'U'))
        BEGIN
            CREATE TABLE [dbo].[Tweet] (
                [id] NVARCHAR(128) PRIMARY KEY NOT NULL DEFAULT NEWID(),
                [tweetId] NVARCHAR(128) UNIQUE,
                [content] NVARCHAR(MAX) NULL,
                [videoUrl] NVARCHAR(2048) NULL,
                [originalUrl] NVARCHAR(2048) NULL,
                [likes] INT DEFAULT 0,
                [retweets] INT DEFAULT 0,
                [views] INT DEFAULT 0,
                [timestamp] DATETIME2 DEFAULT GETDATE(),
                [authorId] NVARCHAR(128) NULL,
                [authorName] NVARCHAR(255) NULL,
                [authorUsername] NVARCHAR(255) NULL,
                [authorProfileImageUrl] NVARCHAR(2048) NULL,
                [thumbnailUrl] NVARCHAR(2048) NULL,
                [createdAt] DATETIME2 DEFAULT GETDATE(),
                [updatedAt] DATETIME2 DEFAULT GETDATE()
            );
            PRINT 'Tweetテーブルが作成されました。';
        END
        """)
        
        cursor.execute("SELECT COUNT(*) FROM Tweet")
        count = cursor.fetchone()[0]
        print(f"✅ データベース接続成功: 現在のレコード数は {count} 件です")
        
        conn.commit()
        return True
        
    except pyodbc.Error as e:
        print(f"❌ データベースセットアップエラー: {e}")
        return False

def insert_test_data(conn):
    """テスト用データを挿入する"""
    cursor = conn.cursor()
    try:
        # テストデータの作成
        tweet_id = "test_" + datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        tweet_url = "https://twitter.com/test/status/" + tweet_id
        video_url = "https://video.twimg.com/ext_tw_video/test/test.mp4"
        content = "これはテスト投稿です。#テスト"
        author_name = "テストユーザー"
        author_username = "test_user"
        timestamp = datetime.datetime.now()
        
        # データを挿入
        cursor.execute("""
            INSERT INTO Tweet 
            (id, tweetId, videoUrl, originalUrl, likes, retweets, views, timestamp, 
             content, authorName, authorUsername, createdAt, updatedAt)
            VALUES (NEWID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())
        """, (
            tweet_id, video_url, tweet_url, 123, 45, 6789, timestamp, 
            content, author_name, author_username
        ))
        
        conn.commit()
        print(f"✅ テストデータを挿入しました: {tweet_id}")
        
        # 挿入を確認
        cursor.execute("SELECT COUNT(*) FROM Tweet")
        count = cursor.fetchone()[0]
        print(f"📊 現在のレコード総数: {count}件")
        
        return True
    except Exception as e:
        print(f"❌ データ挿入エラー: {e}")
        conn.rollback()
        return False

def main():
    """メイン処理"""
    print("🔍 データベーステスト開始")
    
    # データベース接続
    conn = connect_to_db()
    if not conn:
        print("❌ データベース接続に失敗しました。終了します。")
        return
    
    try:
        # テーブル作成確認
        if not ensure_database_setup(conn):
            print("❌ テーブル作成に失敗しました。")
            return
        
        # テストデータ挿入
        if insert_test_data(conn):
            print("✅ テストデータの挿入に成功しました。")
        else:
            print("❌ テストデータの挿入に失敗しました。")
    
    finally:
        # 接続を閉じる
        conn.close()
        print("🏁 テスト終了")

if __name__ == "__main__":
    main() 