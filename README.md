# Yadori - 住まい口コミSNS (モノレポ版)

[English](#english) | [日本語](#japanese)

<a id="japanese"></a>
## 日本語

### 📝 プロジェクト概要

Yadoriは、実際に住んだ経験をもとに、リアルな住まい情報を共有・発見できるプラットフォームです。Webアプリとモバイルアプリをモノレポ構成で開発し、コードの再利用性と開発効率を最大化しています。

### ✨ 主な機能

#### 共通機能（Web・Mobile両対応）
- **ユーザー認証**: 登録・ログイン機能
- **レビュー投稿**: 住まいの評価、コメント、写真のアップロード
- **地図からの住所選択**: Mapboxを使用した直感的な位置選択
- **レビュー検索・フィルタリング**: 様々な条件での検索が可能
- **いいね機能**: レビューへの「いいね」
- **コメント機能**: レビューへのコメント投稿
- **プロフィール管理**: ユーザープロフィールの編集
- **多言語対応**: 日本語と英語のサポート
- **レスポンシブデザイン**: モバイルからデスクトップまで対応

#### Mobile専用機能
- **プッシュ通知**: いいね・コメント通知をリアルタイムで受信
- **リアルタイム機能**: いいね・コメントの即座反映
- **ネイティブ地図表示**: React Native Maps使用
- **カメラ・ギャラリー連携**: 写真撮影・選択機能

### 🛠️ 技術スタック

#### モノレポ管理
- **Turborepo**: 効率的なビルドとキャッシュ管理

#### フロントエンド
- **Web**: Vite + React + TypeScript + Tailwind CSS
- **Mobile**: React Native + Expo + TypeScript
- **共通UI**: Tamagui (Web・Mobile両対応)

#### バックエンド・サービス
- **BaaS**: Supabase (PostgreSQL, Auth, Storage, Functions, Realtime)
- **地図**: Mapbox GL JS, Mapbox Geocoding API
- **プッシュ通知**: Expo Push Notification Service
- **国際化**: React i18next

### 🏗️ プロジェクト構造

```
yadori-monorepo/
├── apps/
│   ├── web/                 # Webアプリケーション (Vite + React)
│   └── mobile/              # モバイルアプリ (React Native + Expo)
├── packages/
│   ├── ui/                  # 共有UIライブラリ (Tamagui)
│   └── logic/               # 共有ビジネスロジック
├── supabase/
│   ├── migrations/          # データベースマイグレーション
│   └── functions/           # Edge Functions (プッシュ通知)
├── package.json             # ルートパッケージ設定
└── turbo.json              # Turborepo設定
```

### 🔧 セットアップ方法

#### 前提条件

- Node.js (v18以上)
- npm または yarn
- Supabaseアカウント
- Mapbox APIキー
- Expo CLI (モバイル開発用)

#### インストール手順

1. リポジトリをクローンする
   ```bash
   git clone https://github.com/yourusername/yadori-monorepo.git
   cd yadori-monorepo
   ```

2. 依存関係をインストールする
   ```bash
   npm install
   ```

3. 環境変数を設定する
   - `.env.example`ファイルを`.env`にコピーし、必要な環境変数を設定します
   ```bash
   cp .env.example .env
   ```
   - 以下の環境変数を設定してください:
     - `VITE_SUPABASE_URL`: SupabaseプロジェクトのURL
     - `VITE_SUPABASE_ANON_KEY`: Supabaseの匿名キー
     - `VITE_MAPBOX_ACCESS_TOKEN`: MapboxのアクセストークンAPI

4. 開発サーバーを起動する

   **全体の開発サーバー起動:**
   ```bash
   npm run dev
   ```

   **個別アプリの開発:**
   ```bash
   # Webアプリのみ
   npm run dev --filter=@yadori/web
   
   # モバイルアプリのみ
   npm run dev --filter=@yadori/mobile
   ```

5. ブラウザで http://localhost:5173 にアクセス（Web）
   モバイルアプリはExpo Goアプリで開発サーバーに接続

#### ビルド方法

**全体のビルド:**
```bash
npm run build
```

**個別ビルド:**
```bash
# Webアプリのビルド
npm run build --filter=@yadori/web

# モバイルアプリのビルド（Expo）
cd apps/mobile && expo build
```

### 📊 データベース構造

- **users**: ユーザープロフィール情報
- **reviews**: レビュー投稿データ（位置情報含む）
- **review_images**: レビュー画像
- **comments**: コメントデータ
- **likes**: いいね情報
- **user_devices**: プッシュ通知用デバイス情報

### 🔔 プッシュ通知システム

モバイルアプリでは、以下の通知を受信できます：

1. **いいね通知**: 自分のレビューにいいねがついた時
2. **コメント通知**: 自分のレビューにコメントがついた時

#### 通知フロー
1. モバイルアプリ起動時にプッシュトークンを取得・登録
2. いいね・コメント投稿時にSupabase Edge Functionがトリガー
3. Expo Push Serviceを通じて通知配信

### 🌍 多言語対応

このアプリケーションは、`react-i18next`を使用して日本語と英語の両方をサポートしています。

#### 言語ファイル

翻訳ファイルは以下の場所にあります：
- 日本語: `packages/logic/src/locales/ja.json`
- 英語: `packages/logic/src/locales/en.json`

### 🚀 デプロイメント

#### Web版
- **プラットフォーム**: Netlify
- **ビルドコマンド**: `npm run build --filter=@yadori/web`
- **公開ディレクトリ**: `apps/web/dist`

#### Mobile版
- **ビルドサービス**: Expo Application Services (EAS)
- **配信**: App Store, Google Play Store

```bash
# EAS設定
cd apps/mobile
eas build --platform all

# 配信
eas submit --platform all
```

### 📝 開発コマンド

```bash
# 全体の開発
npm run dev

# 型チェック
npm run type-check

# リント
npm run lint

# クリーンビルド
npm run clean && npm run build
```

### 🤝 コントリビューション

プロジェクトへの貢献は歓迎します。以下の手順に従ってください:

1. このリポジトリをフォークする
2. 機能ブランチを作成する (`git checkout -b feature/amazing-feature`)
3. 変更をコミットする (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュする (`git push origin feature/amazing-feature`)
5. プルリクエストを作成する

### 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

---

<a id="english"></a>
## English

### 📝 Project Overview

Yadori is a platform where users can share and discover real housing information based on actual living experiences. Developed as a monorepo with Web and Mobile applications to maximize code reusability and development efficiency.

### ✨ Key Features

#### Common Features (Web & Mobile)
- **User Authentication**: Registration and login functionality
- **Review Posting**: Housing evaluations, comments, and photo uploads
- **Map-based Address Selection**: Intuitive location selection using Mapbox
- **Review Search & Filtering**: Search by various criteria
- **Like Functionality**: "Like" reviews
- **Comment Functionality**: Post comments on reviews
- **Profile Management**: Edit user profiles
- **Multilingual Support**: Japanese and English languages
- **Responsive Design**: Works from mobile to desktop

#### Mobile-Exclusive Features
- **Push Notifications**: Real-time notifications for likes and comments
- **Real-time Features**: Instant reflection of likes and comments
- **Native Map Display**: Using React Native Maps
- **Camera & Gallery Integration**: Photo capture and selection

### 🛠️ Technology Stack

#### Monorepo Management
- **Turborepo**: Efficient build and cache management

#### Frontend
- **Web**: Vite + React + TypeScript + Tailwind CSS
- **Mobile**: React Native + Expo + TypeScript
- **Shared UI**: Tamagui (Web & Mobile compatible)

#### Backend & Services
- **BaaS**: Supabase (PostgreSQL, Auth, Storage, Functions, Realtime)
- **Maps**: Mapbox GL JS, Mapbox Geocoding API
- **Push Notifications**: Expo Push Notification Service
- **Internationalization**: React i18next

### 🏗️ Project Structure

```
yadori-monorepo/
├── apps/
│   ├── web/                 # Web Application (Vite + React)
│   └── mobile/              # Mobile App (React Native + Expo)
├── packages/
│   ├── ui/                  # Shared UI Library (Tamagui)
│   └── logic/               # Shared Business Logic
├── supabase/
│   ├── migrations/          # Database Migrations
│   └── functions/           # Edge Functions (Push Notifications)
├── package.json             # Root Package Configuration
└── turbo.json              # Turborepo Configuration
```

### 🔧 Setup Instructions

#### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account
- Mapbox API key
- Expo CLI (for mobile development)

#### Installation Steps

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/yadori-monorepo.git
   cd yadori-monorepo
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   - Copy the `.env.example` file to `.env` and configure the necessary environment variables
   ```bash
   cp .env.example .env
   ```
   - Set the following environment variables:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
     - `VITE_MAPBOX_ACCESS_TOKEN`: Your Mapbox access token API

4. Start the development servers

   **Start all development servers:**
   ```bash
   npm run dev
   ```

   **Individual app development:**
   ```bash
   # Web app only
   npm run dev --filter=@yadori/web
   
   # Mobile app only
   npm run dev --filter=@yadori/mobile
   ```

5. Access the application
   - Web: http://localhost:5173
   - Mobile: Connect to development server via Expo Go app

#### Build Instructions

**Build all:**
```bash
npm run build
```

**Individual builds:**
```bash
# Web app build
npm run build --filter=@yadori/web

# Mobile app build (Expo)
cd apps/mobile && expo build
```

### 📊 Database Structure

- **users**: User profile information
- **reviews**: Review post data (including location information)
- **review_images**: Review images
- **comments**: Comment data
- **likes**: Like information
- **user_devices**: Device information for push notifications

### 🔔 Push Notification System

The mobile app can receive the following notifications:

1. **Like Notifications**: When someone likes your review
2. **Comment Notifications**: When someone comments on your review

#### Notification Flow
1. Push token acquisition and registration on mobile app startup
2. Supabase Edge Function triggers on like/comment posting
3. Notification delivery through Expo Push Service

### 🌍 Internationalization

This application supports both Japanese and English using `react-i18next`.

#### Language Files

Translation files are located at:
- Japanese: `packages/logic/src/locales/ja.json`
- English: `packages/logic/src/locales/en.json`

### 🚀 Deployment

#### Web Version
- **Platform**: Netlify
- **Build Command**: `npm run build --filter=@yadori/web`
- **Publish Directory**: `apps/web/dist`

#### Mobile Version
- **Build Service**: Expo Application Services (EAS)
- **Distribution**: App Store, Google Play Store

```bash
# EAS setup
cd apps/mobile
eas build --platform all

# Submit
eas submit --platform all
```

### 📝 Development Commands

```bash
# Development for all
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Clean build
npm run clean && npm run build
```

### 🤝 Contributing

Contributions to the project are welcome. Please follow these steps:

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

### 📄 License

This project is released under the MIT License.