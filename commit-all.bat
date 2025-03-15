@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo ===== XRANKINGプロジェクト 自動コミット＆プッシュスクリプト =====
echo.

:: GitHubリポジトリURL（ここで設定可能）
set GIT_URL=https://github.com/siomako12099999999999999999/XRANKING.git

:: 日時取得
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set COMMIT_DATE=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%
set COMMIT_TIME=%datetime:~8,2%%datetime:~10,2%

:: 不正ファイル削除
if exist "tsconfig." (
  echo 不正なファイル tsconfig. を削除します。
  del "tsconfig."
)

:: Git設定調整
git config core.autocrlf true

:: 全ファイル追加
git add -A

:: コミットメッセージ生成
set COMMIT_MSG=XRANKINGプロジェクトの更新 [%COMMIT_DATE%_%COMMIT_TIME%]

:: コミット実行
git commit -m "%COMMIT_MSG%"
if %errorlevel% neq 0 (
  echo コミット対象の変更がありません。
  goto :end
)

:: リモート設定確認
git remote -v | findstr origin > nul
if %errorlevel% neq 0 (
  echo リモートリポジトリが設定されていないため追加します。
  git remote add origin %GIT_URL%
)

:: 現在のブランチ名を取得
git rev-parse --abbrev-ref HEAD > branch.txt
set /p CURRENT_BRANCH=<branch.txt
del branch.txt
if "%CURRENT_BRANCH%"=="" set CURRENT_BRANCH=main

:: プッシュ実行
git push -u origin %CURRENT_BRANCH%
if %errorlevel% neq 0 (
  echo プッシュに失敗しました。認証情報を再確認してください。
)

echo ===== 完了 =====
timeout /t 5
exit /b 0
