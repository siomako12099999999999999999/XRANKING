import os
import pyodbc
from dotenv import load_dotenv

# .env ファイルから環境変数を読み込む
load_dotenv()

def clear_all_tweets():
    """データベース内のツイートを全て削除する関数"""
    try:
        # 環境変数から設定を取得
        server = os.getenv('SQL_SERVER', 'localhost\\SQLEXPRESS')
        database = os.getenv('SQL_DATABASE', 'xranking')
        username = os.getenv('SQL_USER', 'sa')
        password = os.getenv('SQL_PASSWORD', '')
        
        print(f"接続情報: サーバー={server}, データベース={database}, ユーザー={username}")
        
        # 接続文字列の表示（パスワードはマスク）
        conn_str = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={'*' * len(password) if password else ''};TrustServerCertificate=yes;"
        print(f"接続文字列: {conn_str}")
        
        # 実際の接続文字列（パスワードを含む）
        real_conn_str = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password};TrustServerCertificate=yes;"
        
        # 接続
        conn = pyodbc.connect(real_conn_str)
        print("✅ データベース接続成功！")
        
        cursor = conn.cursor()
        
        # 削除前のレコード数を確認
        cursor.execute("SELECT COUNT(*) FROM Tweet")
        before_count = cursor.fetchone()[0]
        print(f"削除前のレコード総数: {before_count}件")
        
        # テーブル内のデータを全て削除
        cursor.execute("DELETE FROM Tweet")
        deleted_count = cursor.rowcount
        print(f"削除したレコード数: {deleted_count}件")
        
        # 変更をコミット
        conn.commit()
        
        # 削除後のレコード数を確認
        cursor.execute("SELECT COUNT(*) FROM Tweet")
        after_count = cursor.fetchone()[0]
        print(f"削除後のレコード総数: {after_count}件")
        
        return True
        
    except pyodbc.Error as e:
        print(f"❌ データベース接続/操作エラー: {e}")
        if 'conn' in locals():
            conn.rollback()
        return False
    finally:
        if 'conn' in locals():
            conn.close()
            print("データベース接続を閉じました")

if __name__ == "__main__":
    # ユーザーに確認
    confirm = input("データベース内のツイートを全て削除します。この操作は元に戻せません。続行しますか？ (y/n): ")
    if confirm.lower() == 'y':
        clear_all_tweets()
        print("処理が完了しました。")
    else:
        print("操作をキャンセルしました。") 