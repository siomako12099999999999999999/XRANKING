import pyodbc

# データベース接続文字列
connection_string = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=localhost\\SQLEXPRESS;"
    "DATABASE=xranking;"
    "UID=sa;"
    "PWD=;"
    "TrustServerCertificate=yes;"
)

print("データベース接続を試みます...")
conn = pyodbc.connect(connection_string)
print("接続成功!")

cursor = conn.cursor()

# レコード数を確認
cursor.execute("SELECT COUNT(*) FROM Tweet")
total = cursor.fetchone()[0]
print(f"合計レコード数: {total}")

# テストデータを確認
cursor.execute("SELECT COUNT(*) FROM Tweet WHERE authorUsername LIKE '%test_user_%'")
test_count = cursor.fetchone()[0]
print(f"テストユーザー数: {test_count}")

# プロフィール画像URLを確認
print("\nプロフィール画像URL:")
cursor.execute("SELECT TOP 5 authorProfileImageUrl FROM Tweet")
for row in cursor.fetchall():
    print(row[0])

# テストデータを削除
if test_count > 0:
    cursor.execute("DELETE FROM Tweet WHERE authorUsername LIKE '%test_user_%'")
    deleted = cursor.rowcount
    print(f"\n{deleted}件のテストデータを削除しました")
    conn.commit()

# 終了
conn.close()
print("完了") 