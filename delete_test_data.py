import pyodbc
import os
from dotenv import load_dotenv

# .env ファイルを読み込む
load_dotenv()

def delete_test_data():
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
        
        # 削除前のレコード数を確認
        cursor.execute("SELECT COUNT(*) FROM Tweet")
        before_count = cursor.fetchone()[0]
        print(f"削除前のレコード総数: {before_count}件")
        
        # テストデータを削除
        cursor.execute("DELETE FROM Tweet WHERE authorProfileImageUrl LIKE '%test_user_%'")
        deleted_count = cursor.rowcount
        print(f"削除したテストデータ: {deleted_count}件")
        
        # テストユーザーを削除
        cursor.execute("DELETE FROM Tweet WHERE authorUsername LIKE '%test_user_%'")
        deleted_users = cursor.rowcount
        print(f"テストユーザーを削除: {deleted_users}件")
        
        # 変更をコミット
        conn.commit()
        
        # 削除後のレコード数を確認
        cursor.execute("SELECT COUNT(*) FROM Tweet")
        after_count = cursor.fetchone()[0]
        print(f"削除後のレコード総数: {after_count}件")
        
        # 残りのデータを表示
        print("\n残りのデータのサンプル:")
        cursor.execute("SELECT TOP 10 id, tweetId, authorName, authorUsername, authorProfileImageUrl FROM Tweet")
        rows = cursor.fetchall()
        for row in rows:
            print(f"ID: {row[0]}, TweetID: {row[1]}, 名前: {row[2]}, ユーザー名: {row[3]}, 画像URL: {row[4]}")
        
        return True
        
    except pyodbc.Error as e:
        print(f"❌ データベース接続/操作エラー: {e}")
        conn.rollback()
        return False
    finally:
        if 'conn' in locals():
            conn.close()
            print("データベース接続を閉じました")

if __name__ == "__main__":
    delete_test_data() 