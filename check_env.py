import os
import sys
from dotenv import load_dotenv

# .env ファイルを読み込む
load_dotenv()

# データベース接続情報を表示
server = os.getenv("SQL_SERVER")
database = os.getenv("SQL_DATABASE")
user = os.getenv("SQL_USER")
password = os.getenv("SQL_PASSWORD")

print(f"SQL_SERVER: {server}")
print(f"SQL_DATABASE: {database}")
print(f"SQL_USER: {user}")
print(f"SQL_PASSWORD: {'*' * len(password) if password else 'None'}")

# twitter_video_search.pyが使っている接続文字列
connection_string = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    f"SERVER={server};"
    f"DATABASE={database};"
    f"UID={user};"
    "PWD=********;"
    "TrustServerCertificate=yes;"
)
print(f"接続文字列: {connection_string}")

# 完了メッセージ
print("環境変数確認完了") 