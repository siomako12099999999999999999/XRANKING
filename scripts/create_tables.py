import os
import pyodbc
from dotenv import load_dotenv

# .env ファイルを読み込む
load_dotenv()

def create_tweet_table():
    """Tweetテーブルを作成する"""
    try:
        # 接続文字列
        conn = pyodbc.connect(
            "DRIVER={ODBC Driver 17 for SQL Server};"
            f"SERVER={os.getenv('SQL_SERVER')};"
            f"DATABASE={os.getenv('SQL_DATABASE')};"
            f"UID={os.getenv('SQL_USER')};"
            f"PWD={os.getenv('SQL_PASSWORD')};"
            "TrustServerCertificate=yes;"
        )
        
        cursor = conn.cursor()
        
        # テーブルが存在しない場合のみ作成
        print("Tweetテーブルの存在を確認しています...")
        cursor.execute("""
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Tweet]') AND type in (N'U'))
        BEGIN
            CREATE TABLE [dbo].[Tweet] (
                [id] NVARCHAR(128) PRIMARY KEY,
                [tweetId] NVARCHAR(128) UNIQUE,
                [content] NVARCHAR(MAX) NULL,
                [videoUrl] NVARCHAR(2048) NULL,
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
        ELSE
        BEGIN
            PRINT 'Tweetテーブルは既に存在します。';
        END
        """)
        
        conn.commit()
        print("✅ Tweetテーブルの確認/作成が完了しました")
        
        # テーブル情報を表示
        print("\n📊 Tweetテーブルの構造:")
        cursor.execute("SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Tweet'")
        for row in cursor.fetchall():
            col_name, data_type, max_length = row
            max_length_str = f"({max_length})" if max_length else ""
            print(f" - {col_name}: {data_type}{max_length_str}")
        
        conn.close()
        return True
        
    except pyodbc.Error as e:
        print(f"❌ データベースエラー: {e}")
        return False

if __name__ == "__main__":
    create_tweet_table()