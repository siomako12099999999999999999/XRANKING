#!/bin/bash

# パッケージのインストール
npm install

# Prismaの生成とデータベースのマイグレーション
npm run db:setup

# 開発サーバーの起動
npm run dev
