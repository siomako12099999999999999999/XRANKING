import pyodbc
import os
from dotenv import load_dotenv

# .env ファイルを読み込む
load_dotenv()

def check_profiles():
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
        
        cursor = conn.cursor()
        
        # プロフィール画像URLを確認
        cursor.execute("SELECT TOP 20 id, tweetId, authorName, authorUsername, authorProfileImageUrl FROM Tweet")
        rows = cursor.fetchall()
        
        print(f"\n合計レコード数を確認")
        cursor.execute("SELECT COUNT(*) FROM Tweet")
        total_count = cursor.fetchone()[0]
        print(f"テーブル内のレコード総数: {total_count}件")
        
        print("\nテストデータを検索")
        cursor.execute("SELECT COUNT(*) FROM Tweet WHERE authorProfileImageUrl LIKE '%test_user_%'")
        test_count = cursor.fetchone()[0]
        print(f"test_user_ を含むURLのレコード数: {test_count}件")
        
        print("\nプロフィール画像URLのサンプル:")
        for row in rows:
            print(f"ID: {row[0]}, TweetID: {row[1]}, 名前: {row[2]}, ユーザー名: {row[3]}, 画像URL: {row[4]}")
        
        return True
        
    except pyodbc.Error as e:
        print(f"❌ データベース接続/操作エラー: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()
            print("データベース接続を閉じました")

if __name__ == "__main__":
    check_profiles() 