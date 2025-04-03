import pyodbc
import sys
import os
from dotenv import load_dotenv

def main():
    # 環境変数を読み込む
    load_dotenv()
    
    # データベース接続情報を取得
    server = os.getenv("SQL_SERVER")
    database = os.getenv("SQL_DATABASE")
    user = os.getenv("SQL_USER")
    password = os.getenv("SQL_PASSWORD")
    
    # 接続情報を表示
    print(f"接続先: SERVER={server}, DATABASE={database}, USER={user}")
    
    # データベース接続
    try:
        conn = pyodbc.connect(
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={server};"
            f"DATABASE={database};"
            f"UID={user};"
            f"PWD={password};"
            f"TrustServerCertificate=yes;"
        )
        
        cursor = conn.cursor()
        
        # テーブルの存在確認
        cursor.execute("""
            SELECT COUNT(*) 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'Tweet'
        """)
        table_exists = cursor.fetchone()[0] > 0
        
        if not table_exists:
            print("Tweet テーブルが存在しません")
            return
            
        # レコード数を確認
        cursor.execute("SELECT COUNT(*) FROM Tweet")
        count = cursor.fetchone()[0]
        print(f"テーブル内のレコード数: {count}")
        
        if count > 0:
            # レコードのサンプルを取得
            cursor.execute("""
                SELECT TOP 3 id, tweetId, videoUrl, originalUrl, content, 
                       likes, retweets, views, authorName, authorUsername, 
                       authorProfileImageUrl, thumbnailUrl
                FROM Tweet
            """)
            
            # カラム名を取得
            columns = [column[0] for column in cursor.description]
            
            # レコードを表示
            rows = cursor.fetchall()
            for i, row in enumerate(rows):
                print(f"\n=== レコード {i+1} ===")
                for j, col in enumerate(columns):
                    value = row[j]
                    # 長い文字列を切り詰める
                    if isinstance(value, str) and len(value) > 100:
                        value = value[:97] + "..."
                    print(f"{col}: {value}")
        
        # データベース接続を閉じる
        conn.close()
        
    except Exception as e:
        print(f"エラー: {str(e)}")

if __name__ == "__main__":
    main()
    print("完了しました") 