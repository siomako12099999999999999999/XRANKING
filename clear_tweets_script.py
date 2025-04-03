import os
import sys
try:
    import pyodbc
except ImportError:
    print("❌ pyodbc モジュールが見つかりません。インストールしてください: pip install pyodbc")
    sys.exit(1)
try:
    from dotenv import load_dotenv
except ImportError:
    print("❌ dotenv モジュールが見つかりません。インストールしてください: pip install python-dotenv")
    sys.exit(1)

# .env ファイルを読み込む (パスを明示的に指定)
dotenv_path = '.env'
load_dotenv(dotenv_path=dotenv_path, override=True)
print(f"ℹ️ .env ファイル読み込み試行: {dotenv_path}")

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ 環境変数 DATABASE_URL が設定されていません。")
    sys.exit(1)

print(f"ℹ️ 読み込んだ DATABASE_URL (URL形式): {DATABASE_URL}")

conn = None
cursor = None
connection_string = ""

try:
    # URL形式のDATABASE_URLを解析してODBC接続文字列を作成
    from urllib.parse import urlparse, parse_qs, unquote_plus

    parsed_url = urlparse(DATABASE_URL)
    query_params = parse_qs(parsed_url.query)

    server = parsed_url.hostname
    port = parsed_url.port if parsed_url.port else 1433 # Default SQL Server port
    database = parsed_url.path.lstrip('/')
    username = unquote_plus(parsed_url.username) if parsed_url.username else None
    password = unquote_plus(parsed_url.password) if parsed_url.password else None
    driver = "{ODBC Driver 17 for SQL Server}" # Assume this driver, adjust if needed
    trust_cert = query_params.get('trustServerCertificate', ['false'])[0].lower() == 'true'

    if not all([server, database, username, password]):
        print("❌ DATABASE_URL の解析に失敗しました。必要な情報が不足しています。")
        sys.exit(1)

    # ODBC接続文字列を構築
    connection_string = (
        f"DRIVER={driver};"
        f"SERVER={server},{port};"
        f"DATABASE={database};"
        f"UID={username};"
        f"PWD={password};"
    )
    if trust_cert:
        connection_string += "TrustServerCertificate=yes;"

    print(f"ℹ️ 生成されたODBC接続文字列: DRIVER=...;SERVER={server},{port};DATABASE={database};UID={username};PWD=***;") # パスワードは伏せる

    # ODBC接続文字列を使用して接続
    print("ℹ️ ODBC接続文字列でデータベース接続試行中...")
    conn = pyodbc.connect(connection_string)
    cursor = conn.cursor()
    print("✅ データベース接続成功")

    # テーブルクリア実行
    print("ℹ️ Tweet テーブルのクリアを実行中...")
    cursor.execute("DELETE FROM Tweet")
    conn.commit()
    # SQL Server では @@ROWCOUNT で削除件数を取得できる
    cursor.execute("SELECT @@ROWCOUNT")
    deleted_count = cursor.fetchone()[0]
    print(f"✅ 成功: {deleted_count} 件のデータを削除しました。")
    sys.exit(0) # 成功コードで終了

except pyodbc.Error as ex:
    sqlstate = ex.args[0]
    print(f"❌ データベース操作エラー: {sqlstate} - {ex}")
    if conn:
        conn.rollback() # エラー時はロールバック
    sys.exit(1) # エラーコードで終了
except Exception as e:
    print(f"❌ 予期せぬエラー: {e}")
    sys.exit(1) # エラーコードで終了
finally:
    if cursor:
        cursor.close()
    if conn:
        conn.close()
        print("ℹ️ データベース接続を閉じました。")
