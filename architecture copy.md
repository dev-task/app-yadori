# アーキテクチャ設計書：住まい口コミ SNS (v5)

## 1. 概要

本アプリケーションは、BaaS (Backend as a Service) を活用した Jamstack 構成を採用する。
フロントエンドは`Next.js` (React/TypeScript)で構築する。レビュー投稿プロセスには**地図からの住所選択機能**が追加され、ユーザー体験の向上を図る。
バックエンド機能（データベース、認証、API、ストレージ）はすべて`Supabase`に集約し、サーバー管理不要の構成を実現する。フロントエンドは`Netlify`にデプロイする。

## 2. 全体構成図

```mermaid
graph TD
    subgraph "ユーザーのブラウザ"
        A[Next.js App on Netlify]
    end

    subgraph "BaaS (Supabase)"
        B[Authentication]
        C[PostgreSQL Database]
        D[Storage]
        E[Auto-generated API]
    end

    A -- "認証 / データ操作 / 画像RW" --> E
    E -- "DB/Auth/Storage" --> B
    E -- "DB/Auth/Storage" --> C
    E -- "DB/Auth/Storage" --> D

    style A fill:#e6f7ff,stroke:#0050b3
    style F fill:#f0f5ff,stroke:#597ef7
```

## 3. フロントエンド

| 要素               | 技術選定       | 備考                              |
| ------------------ | -------------- | --------------------------------- |
| フレームワーク     | Next.js        | App Routerを採用                 |
| 言語               | TypeScript     | 型安全な開発を実現                |
| UI ライブラリ      | React          | v18以降を採用                     |
| スタイリング       | Tailwind CSS   | Spotify風ダークテーマをカスタム実装 |
| 国際化 (i18n)      | next-intl      | 軽量な国際化ソリューション        |
| 地図機能           | Mapbox GL JS, Mapbox Geocoding API | レビュー投稿時の住所検索・位置選択、住所の自動入力に使用。APIキーの安全な管理が必要。 |
| デプロイ先         | Netlify        | ISR対応あり                      |

## 4. バックエンド (BaaS)

| 要素             | 技術選定                           |
| ---------------- | ---------------------------------- |
| プラットフォーム | Supabase                           |
| データベース     | PostgreSQL (Supabase)              |
| API              | Auto-generated REST API (Supabase) |
| 認証             | Auth (Supabase)                    |
| ストレージ       | Storage (Supabase)                 |

自前のバックエンドサーバー（NestJS 等）は不要となり、すべての機能を Supabase が提供します。

## 5. ER 図 (データベース設計)

ER 図はデータ構造を示すため、バックエンドの技術変更による影響はありません。このスキーマを Supabase 上で構築します。

```mermaid
erDiagram
    USERS {
        uuid id PK
        string nickname
        string email
    }

    REVIEWS {
        int id PK
        uuid user_id FK
        string address_text
        float latitude
        float longitude
        int rent
        string layout
        string pros_text
        string cons_text
        int rating_location
        int rating_sunlight
        int rating_soundproof
    }

    REVIEW_IMAGES {
        int id PK
        int review_id FK
        string image_url
    }

    COMMENTS {
        int id PK
        uuid user_id FK
        int review_id FK
        string body
    }

    LIKES {
        uuid user_id PK,FK
        int review_id PK,FK
    }

    USERS ||--o{ REVIEWS : "投稿する"
    USERS ||--o{ COMMENTS : "コメントする"
    USERS ||--o{ LIKES : "いいねする"
    REVIEWS ||--o{ REVIEW_IMAGES : "持つ"
    REVIEWS ||--o{ COMMENTS : "持たれる"
    REVIEWS ||--o{ LIKES : "持たれる"
```

**注意事項：**
Supabase Auth の users テーブルと連携するため、USERS テーブルの id は uuid 型を想定しています。
