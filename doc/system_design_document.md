# XRANKINGアプリケーション システム設計書

## 1. システムアーキテクチャ

### 1.1 全体アーキテクチャ

XRANKINGアプリケーションは、Next.jsをベースとしたフルスタックアプリケーションとして構築されます。以下に全体アーキテクチャを示します。

```
[クライアント]
    │
    ▼
[Next.js フロントエンド]
    │
    ├──► [ページコンポーネント] ──► [UIコンポーネント]
    │
    ├──► [APIクライアント] ◄──► [React Query]
    │
    ▼
[Next.js API Routes]
    │
    ├──► [ツイートAPI] ──► [データベースアクセス層]
    │                        │
    ├──► [ビデオプロキシAPI] ─┘
    │
    ▼
[外部サービス]
    │
    ├──► [SQL Server]
    │
    └──► [Twitter API]
```

### 1.2 技術スタック

- **フロントエンド**:
  - Next.js 14+
  - React 18+
  - Tailwind CSS
  - React Query
  - TypeScript

- **バックエンド**:
  - Next.js API Routes
  - Node.js
  - SQL Server
  - Prisma ORM

- **インフラストラクチャ**:
  - カスタムNext.jsサーバー
  - キャッシュ層
  - CDN (予定)

### 1.3 デプロイアーキテクチャ

```
[CDN] ◄── 静的アセット
  │
  ▼
[Next.js サーバー] ─► [プロキシレイヤー]
  │                  │
  ▼                  ▼
[SQL Server] ◄───► [Twitter API]
```

## 2. データベース設計

### 2.1 ER図

```
+----------------+       +------------------+
|     Tweet      |       |       User       |
+----------------+       +------------------+
| id (PK)        |       | id (PK)          |
| tweetId        |       | username         |
| content        |       | email            |
| videoUrl       |       | passwordHash     |
| likes          |       | createdAt        |
| retweets       |       | updatedAt        |
| views          |       +------------------+
| timestamp      |              │
| authorName     |              │
| authorUsername |              │
| authorProfileImageUrl         │
| createdAt      |              │
| updatedAt      |              │
+----------------+              │
        │                       │
        │                       │
        ▼                       ▼
+------------------+    +------------------+
|    Favorite      |    |     Setting      |
+------------------+    +------------------+
| id (PK)          |    | id (PK)          |
| userId (FK)      |    | userId (FK)      |
| tweetId (FK)     |    | darkMode         |
| createdAt        |    | autoplay         |
+------------------+    | defaultSort      |
                        | defaultPeriod    |
                        | createdAt        |
                        | updatedAt        |
                        +------------------+
```

### 2.2 テーブル定義

#### Tweet テーブル

| カラム名             | データ型      | NULL | 説明                         |
|---------------------|--------------|------|------------------------------|
| id                  | INT          | No   | 主キー、自動増分              |
| tweetId             | VARCHAR(50)  | No   | Twitter上のツイートID         |
| content             | TEXT         | Yes  | ツイート内容                  |
| videoUrl            | VARCHAR(255) | Yes  | 動画URL                      |
| likes               | INT          | Yes  | いいね数                      |
| retweets            | INT          | Yes  | リツイート数                  |
| views               | INT          | Yes  | 閲覧数                        |
| timestamp           | DATETIME     | No   | ツイート投稿日時              |
| authorName          | VARCHAR(100) | Yes  | 投稿者名                      |
| authorUsername      | VARCHAR(50)  | Yes  | 投稿者のユーザーネーム         |
| authorProfileImageUrl| VARCHAR(255)| Yes  | 投稿者のプロフィール画像URL    |
| createdAt           | DATETIME     | No   | レコード作成日時              |
| updatedAt           | DATETIME     | No   | レコード更新日時              |

#### User テーブル（将来実装予定）

| カラム名     | データ型      | NULL | 説明                 |
|-------------|--------------|------|---------------------|
| id          | INT          | No   | 主キー、自動増分      |
| username    | VARCHAR(50)  | No   | ユーザー名           |
| email       | VARCHAR(100) | No   | メールアドレス        |
| passwordHash| VARCHAR(255) | No   | パスワードハッシュ     |
| createdAt   | DATETIME     | No   | レコード作成日時      |
| updatedAt   | DATETIME     | No   | レコード更新日時      |

#### Favorite テーブル（将来実装予定）

| カラム名     | データ型      | NULL | 説明                 |
|-------------|--------------|------|---------------------|
| id          | INT          | No   | 主キー、自動増分      |
| userId      | INT          | No   | ユーザーID (FK)      |
| tweetId     | INT          | No   | ツイートID (FK)      |
| createdAt   | DATETIME     | No   | レコード作成日時      |

#### Setting テーブル（将来実装予定）

| カラム名       | データ型      | NULL | 説明                 |
|---------------|--------------|------|---------------------|
| id            | INT          | No   | 主キー、自動増分      |
| userId        | INT          | No   | ユーザーID (FK)      |
| darkMode      | BOOLEAN      | No   | ダークモード設定      |
| autoplay      | BOOLEAN      | No   | 自動再生設定          |
| defaultSort   | VARCHAR(20)  | No   | デフォルトソート      |
| defaultPeriod | VARCHAR(20)  | No   | デフォルト期間        |
| createdAt     | DATETIME     | No   | レコード作成日時      |
| updatedAt     | DATETIME     | No   | レコード更新日時      |

## 3. API設計

### 3.1 RESTful API エンドポイント

#### ツイート関連API

| エンドポイント                  | メソッド | 説明                              | パラメータ                      |
|--------------------------------|---------|----------------------------------|--------------------------------|
| `/api/tweets`                  | GET     | ツイート一覧の取得                 | sort, period, page, limit      |
| `/api/tweets/[id]`             | GET     | 特定ツイートの取得                 | id                             |
| `/api/tweets/single/[id]`      | GET     | tweetIdによるツイート取得          | id                             |

#### ビデオ関連API

| エンドポイント                  | メソッド | 説明                              | パラメータ                      |
|--------------------------------|---------|----------------------------------|--------------------------------|
| `/api/video/[id]`              | GET     | 特定ビデオの情報取得               | id                             |
| `/api/video-proxy`             | GET     | ビデオのプロキシ                   | url                            |
| `/api/proxy`                   | GET     | 汎用プロキシ                       | url, headers                   |
| `/api/videoproxy`              | GET     | ビデオプロキシ (レガシー)           | url                            |

### 3.2 API リクエスト/レスポンス例

#### GET /api/tweets

**リクエスト**:
```
GET /api/tweets?sort=likes&period=week&page=1&limit=10
```

**レスポンス**:
```json
{
  "tweets": [
    {
      "id": 1,
      "tweetId": "1234567890",
      "content": "サンプルツイート内容",
      "videoUrl": "https://video.twimg.com/ext_tw_video/1234567890/pu/vid/720x1280/video.mp4",
      "likes": 1000,
      "retweets": 500,
      "views": 5000,
      "timestamp": "2023-06-15T12:30:45Z",
      "authorName": "サンプルユーザー",
      "authorUsername": "sampleuser",
      "authorProfileImageUrl": "https://pbs.twimg.com/profile_images/sample.jpg",
      "createdAt": "2023-06-15T12:45:00Z",
      "updatedAt": "2023-06-15T12:45:00Z"
    },
    // ... その他のツイート
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pageCount": 10
  }
}
```

#### GET /api/video-proxy

**リクエスト**:
```
GET /api/video-proxy?url=https://video.twimg.com/ext_tw_video/1234567890/pu/vid/720x1280/video.mp4
```

**レスポンス**:
- ビデオストリームが直接返される
- 適切なContent-TypeとCache-Controlヘッダー付き

## 4. コンポーネント設計

### 4.1 コンポーネント階層

```
App
├── Layout
│   ├── Header
│   │   ├── Logo
│   │   ├── Navigation
│   │   └── ThemeToggle
│   └── Footer
│
├── HomePage
│   ├── SearchFilters
│   │   ├── PeriodFilter
│   │   └── SortOptions
│   ├── TweetList
│   │   └── TweetCard
│   │       ├── TweetHeader
│   │       ├── TweetContent
│   │       └── VideoPlayer
│   │           ├── PlaybackControls
│   │           └── VolumeControls
│   └── LoadMore
│
├── MobilePage
│   └── MobileVideoFeed
│       ├── VideoPlayer
│       └── TweetInfo
│
└── Shared
    ├── ErrorDisplay
    ├── LoadingIndicator
    └── EmptyState
```

### 4.2 主要コンポーネント仕様

#### VideoPlayer

**Props**:
- `videoUrl: string` - 再生する動画のURL
- `initialMuted?: boolean` - 初期ミュート状態
- `autoplay?: boolean` - 自動再生フラグ
- `className?: string` - カスタムスタイルクラス
- `onError?: (error: Error) => void` - エラーハンドラ

**状態**:
- `isPlaying: boolean` - 再生中かどうか
- `isMuted: boolean` - ミュート状態
- `volume: number` - ボリューム (0-1)
- `progress: number` - 再生進行状況 (%)
- `isFullscreen: boolean` - フルスクリーン状態
- `isLoading: boolean` - ロード中状態

**機能**:
- 再生/一時停止の切り替え
- ボリューム調整とミュート
- フルスクリーン表示
- 再生進行状況の表示
- エラーハンドリング

#### TweetList

**Props**:
- `tweets: Tweet[]` - 表示するツイートの配列
- `isLoading: boolean` - ロード中状態
- `hasMore: boolean` - 追加データがあるかのフラグ
- `onLoadMore: () => void` - 追加データロード時のコールバック

**状態**:
- `visibleTweets: Tweet[]` - 現在表示中のツイート

**機能**:
- ツイートのリスト表示
- 無限スクロール
- ローディング状態の表示
- エラーハンドリング

#### MobileVideoFeed

**Props**:
- `tweets: Tweet[]` - 表示するツイートの配列
- `isLoading: boolean` - ロード中状態
- `hasMore: boolean` - 追加データがあるかのフラグ
- `onLoadMore: () => void` - 追加データロード時のコールバック

**状態**:
- `currentIndex: number` - 現在表示中のツイートインデックス
- `isSwiping: boolean` - スワイプ中フラグ
- `swipeDirection: 'up' | 'down' | null` - スワイプ方向

**機能**:
- スワイプナビゲーション
- ビデオの自動再生/停止
- ツイート情報の表示
- プリローディング

## 5. 画面設計

### 5.1 画面一覧

1. **ホーム画面** - デスクトップ向けメイン画面
2. **モバイルビデオフィード画面** - モバイル向けTikTokスタイル画面
3. **エラー画面** - エラー発生時の表示
4. **ローディング画面** - 初期ロード中の表示

### 5.2 画面遷移図

```
     ┌────────────┐
     │   開始    │
     └─────┬──────┘
           │
           ▼
┌──────────────────┐     ┌──────────────────┐
│   ホーム画面     │ ──► │  モバイル画面     │
│  (デスクトップ)   │ ◄── │    (モバイル)     │
└──────────┬───────┘     └──────────────────┘
           │
           │ エラー発生
           ▼
┌──────────────────┐
│   エラー画面     │
└──────────────────┘
```

### 5.3 レイアウト設計

#### ホーム画面 (デスクトップ)

```
+----------------------------------+
|           ヘッダー               |
+----------------------------------+
| フィルター | ソートオプション     |
+------------+---------------------+
|                                  |
|                                  |
|         ツイートリスト           |
|                                  |
|  +-------------------------+     |
|  |      ツイートカード     |     |
|  |  +-------------------+  |     |
|  |  |   ビデオプレーヤー  |  |     |
|  |  +-------------------+  |     |
|  |                         |     |
|  |  ツイート情報           |     |
|  +-------------------------+     |
|                                  |
|  +-------------------------+     |
|  |      ツイートカード     |     |
|  +-------------------------+     |
|                                  |
+----------------------------------+
|           フッター               |
+----------------------------------+
```

#### モバイルビデオフィード画面

```
+----------------------------------+
|           ヘッダー (最小化)      |
+----------------------------------+
|                                  |
|                                  |
|                                  |
|                                  |
|         ビデオプレーヤー         |
|         (全画面表示)            |
|                                  |
|                                  |
|                                  |
|                                  |
+----------------------------------+
|                                  |
|        ツイート情報             |
|        作者名, いいね数等       |
|                                  |
+----------------------------------+
|        スワイプインジケーター    |
+----------------------------------+
```

## 6. セキュリティ設計

### 6.1 CORS設定

```javascript
// next.config.js
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'Access-Control-Allow-Credentials', value: 'true' },
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
        { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
      ],
    },
  ];
}
```

### 6.2 CSP設定

```javascript
{
  key: 'Content-Security-Policy',
  value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; media-src 'self' blob: https://*.twimg.com https://* data:; connect-src 'self' https://*.twimg.com https://*; img-src 'self' https://*.twimg.com data:; style-src 'self' 'unsafe-inline'; frame-ancestors 'self';"
}
```

### 6.3 API保護

- **レート制限**: APIエンドポイントに対するレート制限の実装
- **入力検証**: すべてのAPIリクエストパラメータの検証
- **エラーハンドリング**: センシティブな情報を漏らさないエラーメッセージ

## 7. パフォーマンス最適化

### 7.1 フロントエンド最適化

- React Query によるキャッシュ戦略
- 画像の最適化（Next.js Image）
- コンポーネントの遅延ロード（React.lazy）
- メモ化によるレンダリング最適化

### 7.2 バックエンド最適化

- データベースインデックスの適切な設定
- クエリの最適化
- 接続プールの管理
- キャッシュ戦略（Memory Cache, Redis等）

### 7.3 ビデオ最適化

- 適応ビットレートストリーミングの検討
- ビデオのプリロード戦略
- モバイルデバイスでのビデオ品質の自動調整

## 8. テスト計画

### 8.1 単体テスト

- コンポーネントのレンダリングテスト
- ユーティリティ関数のテスト
- APIハンドラのテスト

### 8.2 統合テスト

- APIエンドポイントの統合テスト
- コンポーネント間の相互作用テスト

### 8.3 E2Eテスト

- ユーザーフローのテスト
- モバイルデバイスでのテスト
- パフォーマンステスト

## 9. デプロイメント戦略

### 9.1 CI/CD

- GitHubワークフローの設定
- 自動テストとビルド
- 自動デプロイプロセス

### 9.2 環境構成

- 開発環境
- ステージング環境
- 本番環境

### 9.3 監視とログ

- パフォーマンスモニタリング
- エラーログ
- ユーザー行動分析

## 10. 将来的な拡張計画

- ユーザーアカウント機能
- ツイートのお気に入り機能
- パーソナライズされたおすすめ機能
- プッシュ通知
- オフラインサポート（PWA強化） 