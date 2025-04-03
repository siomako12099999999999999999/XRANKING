import pyodbc
from dotenv import load_dotenv
import os

# 環境変数を読み込む
load_dotenv()

# データベース接続情報
server = os.getenv('SQL_SERVER', 'localhost')
database = os.getenv('SQL_DATABASE', 'xranking')
username = os.getenv('SQL_USER', 'sa')
password = os.getenv('SQL_PASSWORD', '')

print(f"接続情報: サーバー={server}, データベース={database}, ユーザー={username}")

try:
    # データベースに接続
    conn = pyodbc.connect(
        f'DRIVER={{ODBC Driver 17 for SQL Server}};'
        f'SERVER={server};'
        f'DATABASE={database};'
        f'UID={username};'
        f'PWD={password};'
        f'TrustServerCertificate=yes;'
    )
    
    print("✅ データベース接続成功！")
    
    # カーソルを作成
    cursor = conn.cursor()
    
    # 固定IDのデータを確認
    fixed_id = 'test_fixed_id_123'
    cursor.execute("SELECT * FROM Tweet WHERE tweetId = ?", fixed_id)
    result = cursor.fetchone()
    
    if result:
        print(f"✅ 固定ID '{fixed_id}' のデータが見つかりました")
        print(f"ID: {result.id}")
        print(f"TweetID: {result.tweetId}")
        print(f"VideoURL: {result.videoUrl}")
        print(f"Likes: {result.likes}")
        print(f"Retweets: {result.retweets if hasattr(result, 'retweets') else 'N/A'}")
        print(f"Views: {result.views if hasattr(result, 'views') else 'N/A'}")
        print(f"作成日時: {result.createdAt}")
        print(f"更新日時: {result.updatedAt if hasattr(result, 'updatedAt') else 'N/A'}")
    else:
        print(f"❌ 固定ID '{fixed_id}' のデータは見つかりませんでした")
        
        # テストデータを挿入する
        print(f"🔄 固定ID '{fixed_id}' のテストデータを挿入します...")
        
        now = "GETDATE()"
        sql = f"""
        INSERT INTO Tweet (tweetId, videoUrl, author, authorId, likes, retweets, views, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, {now}, {now})
        """
        
        cursor.execute(sql, 
            fixed_id, 
            "https://video.twimg.com/fixed_test_video",
            "テストユーザー",
            "test_user_123",
            200,
            100,
            2000
        )
        conn.commit()
        print("✅ テストデータを挿入しました")
    
except Exception as e:
    print(f"❌ エラー: {e}")
finally:
    # 接続を閉じる
    if 'conn' in locals():
        conn.close()
        print("データベース接続を閉じました") 