@REM 機能概要：
@REM Twitter動画検索スクリプトの実行バッチファイル
@REM 
@REM 主な機能：
@REM 1. 作業ディレクトリの設定
@REM 2. Python環境の指定
@REM 3. 動画検索スクリプトの実行
@REM 4. メトリクス更新の実行
@REM 
@REM 用途：
@REM - 動画データの自動収集
@REM - メトリクスの定期更新
@REM - データベースの更新
@REM - バッチ処理の自動化

@echo off
cd /d C:\Users\sioma\XRANKING
"C:\Users\sioma\anaconda3\python.exe" twitter_video_search.py --refresh-metrics
