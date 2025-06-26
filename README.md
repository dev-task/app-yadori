# Yadori - 住まいの口コミSNS / Housing Review Social Network

[English](#english) | [日本語](#japanese)

<a id="japanese"></a>
## 日本語

### 📝 プロジェクト概要

Yadoriは、実際に住んだ経験をもとに、リアルな住まい情報を共有・発見できるプラットフォームです。ユーザーは住まいのレビューを投稿し、他のユーザーはそれらのレビューを検索・閲覧することができます。住まい探しをより良い体験にするためのSNSアプリケーションです。

### ✨ 主な機能

- **ユーザー認証**: 登録・ログイン機能
- **レビュー投稿**: 住まいの評価、コメント、写真のアップロード
- **地図からの住所選択**: Mapboxを使用した直感的な位置選択
- **レビュー検索・フィルタリング**: 様々な条件での検索が可能
- **いいね機能**: レビューへの「いいね」
- **コメント機能**: レビューへのコメント投稿
- **プロフィール管理**: ユーザープロフィールの編集
- **多言語対応**: 日本語と英語のサポート
- **レスポンシブデザイン**: モバイルからデスクトップまで対応

### 🛠️ 技術スタック

- **フロントエンド**: 
  - React 18.3.1
  - TypeScript 5.5.3
  - Tailwind CSS 3.4.1
  - Vite 5.4.2 (ビルドツール)
  - React Router DOM 6.20.1 (ルーティング)
  - React i18next 13.5.0 (国際化)
  - Lucide React 0.344.0 (アイコン)
  - Mapbox GL JS 3.13.0 (地図機能)

- **バックエンド**: 
  - Supabase 2.39.0 (BaaS)
    - PostgreSQL (データベース)
    - Supabase Auth (認証)
    - Supabase Storage (ストレージ)
    - Auto-generated REST API

### 🔧 Supabase設定

Supabaseは、このプロジェクトのバックエンドとして使用されています。以下の機能を提供しています：

1. **認証 (Auth)**
   - メールアドレス/パスワードによるユーザー認証
   - セッション管理
   - ユーザープロフィール情報の保存

2. **データベース (Database)**
   - PostgreSQLデータベース
   - Row Level Security (RLS) によるデータアクセス制御
   - リアルタイムサブスクリプション

3. **ストレージ (Storage)**
   - レビュー画像の保存
   - アクセス制御とセキュリティルール

4. **API**
   - 自動生成されたRESTful API
   - クライアントライブラリによる簡単なアクセス

Supabaseプロジェクトを設定するには：

1. [Supabase](https://supabase.com/)でアカウントを作成
2. 新しいプロジェクトを作成
3. `supabase/migrations`ディレクトリ内のSQLスクリプトを実行してデータベーススキーマを設定
4. プロジェクトURLと匿名キーを`.env`ファイルに設定

### 🗺️ 地図機能の詳細

Yadoriでは、Mapbox GL JSを使用して以下の地図機能を提供しています：

1. **地図からの住所選択**
   - 投稿フォームで「地図で選択」ボタンをクリックすると地図モーダルが表示されます
   - 住所検索バーで場所を検索するか、地図上で直接ピンをドラッグして位置を選択できます
   - 選択した位置の住所は自動的にフォームに入力されます

2. **位置情報の表示**
   - レビュー詳細ページでは、投稿された住所の位置が地図上に表示されます
   - プライバシーに配慮し、正確な住所ではなく最寄り駅からの距離表記を推奨しています

3. **地図コンポーネント構成**
   - MapModal: 地図選択モーダル
   - MapboxMap: Mapbox地図コンポーネント
   - AddressSearchBar: 住所検索バー
   - LocationPicker: 位置選択ピン

### 🚀 セットアップ方法

#### 前提条件

- Node.js (v18以上)
- npm または yarn
- Supabaseアカウント
- Mapbox APIキー

#### インストール手順

1. リポジトリをクローンする
   ```bash
   git clone https://github.com/yourusername/yadori.git
   cd yadori
   ```

2. 依存関係をインストールする
   ```bash
   npm install
   # または
   yarn install
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
   ```bash
   npm run dev
   # または
   yarn dev
   ```

5. ブラウザで http://localhost:5173 にアクセスする

#### ビルド方法

本番環境用のビルドを作成するには:

```bash
npm run build
# または
yarn build
```

ビルドされたファイルは `dist` ディレクトリに生成されます。

### 📊 データベース構造

Yadoriは以下のテーブル構造を使用しています：

- **users**: ユーザープロフィール情報
  - id (uuid): プライマリキー
  - nickname (string): ニックネーム
  - email (string): メールアドレス
  - bio (string): 自己紹介
  - created_at (timestamp): 作成日時
  - updated_at (timestamp): 更新日時

- **reviews**: レビュー投稿データ
  - id (int): プライマリキー
  - user_id (uuid): 投稿者ID (外部キー)
  - address_text (string): 住所テキスト
  - latitude (float): 緯度
  - longitude (float): 経度
  - rent (int): 家賃
  - layout (string): 間取り
  - period_lived (string): 居住期間
  - pros_text (string): 良かった点
  - cons_text (string): 悪かった点
  - rating_location (int): 立地評価
  - rating_sunlight (int): 日当たり評価
  - rating_soundproof (int): 防音評価
  - rating_environment (int): 環境評価
  - created_at (timestamp): 作成日時
  - updated_at (timestamp): 更新日時

- **review_images**: レビュー画像
- **comments**: コメントデータ
- **likes**: いいね情報

### 📁 プロジェクト構造

```
src/
├── components/       # 再利用可能なUIコンポーネント
│   ├── Layout.tsx    # アプリケーションのレイアウト
│   ├── auth/         # 認証関連コンポーネント
│   └── map/          # 地図関連コンポーネント
├── contexts/         # Reactコンテキスト
│   ├── AuthContext.tsx  # 認証状態管理
│   └── I18nContext.tsx  # 国際化コンテキスト
├── i18n/             # 国際化リソース
│   ├── index.ts      # i18n設定
│   └── locales/      # 翻訳ファイル
│       ├── ja.json   # 日本語翻訳
│       └── en.json   # 英語翻訳
├── lib/              # ユーティリティライブラリ
├── pages/            # アプリケーションのページ
│   ├── HomePage.tsx  # ホームページ
│   ├── PostPage.tsx  # 投稿ページ
│   └── ...           # その他のページ
├── utils/            # ユーティリティ関数
├── App.tsx           # メインアプリケーションコンポーネント
└── main.tsx          # アプリケーションのエントリーポイント
```

### 🌍 多言語対応

このアプリケーションは、`react-i18next`を使用して日本語と英語の両方をサポートしています。

#### 言語ファイル

翻訳ファイルは以下の場所にあります：
- 日本語: `src/i18n/locales/ja.json`
- 英語: `src/i18n/locales/en.json`

#### 言語切り替え

アプリケーション内で言語を切り替えることができます。言語設定はローカルストレージに保存され、次回のアクセス時に自動的に適用されます。

#### 新しい言語の追加方法

1. `src/i18n/locales/`に新しい言語ファイル（例：`fr.json`）を作成
2. `src/i18n/index.ts`に新しい言語を追加
3. 言語切り替えUIに新しい言語オプションを追加

#### 翻訳の使用例

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('home.title')}</h1>
      <p>{t('home.subtitle')}</p>
    </div>
  );
}
```

### 🔒 セキュリティ考慮事項

#### APIキー管理
- Mapbox APIキーは環境変数で管理しています
- フロントエンド用の制限付きAPIキーを使用しています
- 本番環境では適切なリファラー制限を設定することを推奨します

#### 位置情報プライバシー
- 正確な住所ではなく、最寄り駅からの距離表記を推奨しています
- ユーザーが詳細な住所を入力した場合の注意喚起を行っています
- 位置情報の精度調整オプションを提供しています

### 🌐 デプロイ

フロントエンドは Netlify などの静的サイトホスティングサービスにデプロイすることができます。

### 📝 コントリビューション

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

Yadori is a platform where users can share and discover real housing information based on actual living experiences. Users can post reviews of their housing, and others can search and browse these reviews. It's a social networking application designed to make house hunting a better experience.

### ✨ Key Features

- **User Authentication**: Registration and login functionality
- **Review Posting**: Housing evaluations, comments, and photo uploads
- **Map-based Address Selection**: Intuitive location selection using Mapbox
- **Review Search & Filtering**: Search by various criteria
- **Like Functionality**: "Like" reviews
- **Comment Functionality**: Post comments on reviews
- **Profile Management**: Edit user profiles
- **Multilingual Support**: Japanese and English languages
- **Responsive Design**: Works from mobile to desktop

### 🛠️ Technology Stack

- **Frontend**: 
  - React 18.3.1
  - TypeScript 5.5.3
  - Tailwind CSS 3.4.1
  - Vite 5.4.2 (build tool)
  - React Router DOM 6.20.1 (routing)
  - React i18next 13.5.0 (internationalization)
  - Lucide React 0.344.0 (icons)
  - Mapbox GL JS 3.13.0 (map functionality)

- **Backend**: 
  - Supabase 2.39.0 (BaaS)
    - PostgreSQL (database)
    - Supabase Auth (authentication)
    - Supabase Storage (storage)
    - Auto-generated REST API

### 🔧 Supabase Configuration

Supabase is used as the backend for this project. It provides the following features:

1. **Authentication (Auth)**
   - Email/password user authentication
   - Session management
   - User profile information storage

2. **Database**
   - PostgreSQL database
   - Row Level Security (RLS) for data access control
   - Real-time subscriptions

3. **Storage**
   - Review image storage
   - Access control and security rules

4. **API**
   - Auto-generated RESTful API
   - Easy access via client libraries

To set up a Supabase project:

1. Create an account on [Supabase](https://supabase.com/)
2. Create a new project
3. Run the SQL scripts in the `supabase/migrations` directory to set up the database schema
4. Set the project URL and anonymous key in your `.env` file

### 🗺️ Map Functionality Details

Yadori uses Mapbox GL JS to provide the following map features:

1. **Map-based Address Selection**
   - Click the "Select on Map" button in the post form to display the map modal
   - Search for a location using the address search bar or drag the pin directly on the map
   - The address of the selected location is automatically entered into the form

2. **Location Display**
   - The review detail page displays the location of the posted address on a map
   - For privacy considerations, we recommend indicating the distance from the nearest station rather than the exact address

3. **Map Component Structure**
   - MapModal: Map selection modal
   - MapboxMap: Mapbox map component
   - AddressSearchBar: Address search bar
   - LocationPicker: Location selection pin

### 🚀 Setup Instructions

#### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account
- Mapbox API key

#### Installation Steps

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/yadori.git
   cd yadori
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
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

4. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Access the application in your browser at http://localhost:5173

#### Build Instructions

To create a production build:

```bash
npm run build
# or
yarn build
```

The built files will be generated in the `dist` directory.

### 📊 Database Structure

Yadori uses the following table structure:

- **users**: User profile information
  - id (uuid): Primary key
  - nickname (string): User nickname
  - email (string): Email address
  - bio (string): User bio
  - created_at (timestamp): Creation timestamp
  - updated_at (timestamp): Update timestamp

- **reviews**: Review post data
  - id (int): Primary key
  - user_id (uuid): Poster ID (foreign key)
  - address_text (string): Address text
  - latitude (float): Latitude
  - longitude (float): Longitude
  - rent (int): Rent amount
  - layout (string): Room layout
  - period_lived (string): Period lived
  - pros_text (string): Positive points
  - cons_text (string): Negative points
  - rating_location (int): Location rating
  - rating_sunlight (int): Sunlight rating
  - rating_soundproof (int): Soundproofing rating
  - rating_environment (int): Environment rating
  - created_at (timestamp): Creation timestamp
  - updated_at (timestamp): Update timestamp

- **review_images**: Review images
- **comments**: Comment data
- **likes**: Like information

### 📁 Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── Layout.tsx    # Application layout
│   ├── auth/         # Authentication-related components
│   └── map/          # Map-related components
├── contexts/         # React contexts
│   ├── AuthContext.tsx  # Authentication state management
│   └── I18nContext.tsx  # Internationalization context
├── i18n/             # Internationalization resources
│   ├── index.ts      # i18n configuration
│   └── locales/      # Translation files
│       ├── ja.json   # Japanese translations
│       └── en.json   # English translations
├── lib/              # Utility libraries
├── pages/            # Application pages
│   ├── HomePage.tsx  # Home page
│   ├── PostPage.tsx  # Post page
│   └── ...           # Other pages
├── utils/            # Utility functions
├── App.tsx           # Main application component
└── main.tsx          # Application entry point
```

### 🌍 Internationalization

This application supports both Japanese and English using `react-i18next`.

#### Language Files

Translation files are located at:
- Japanese: `src/i18n/locales/ja.json`
- English: `src/i18n/locales/en.json`

#### Language Switching

You can switch languages within the application. Language settings are saved in local storage and automatically applied on subsequent visits.

#### Adding a New Language

1. Create a new language file in `src/i18n/locales/` (e.g., `fr.json`)
2. Add the new language to `src/i18n/index.ts`
3. Add the new language option to the language switcher UI

#### Translation Usage Example

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('home.title')}</h1>
      <p>{t('home.subtitle')}</p>
    </div>
  );
}
```

### 🔒 Security Considerations

#### API Key Management
- Mapbox API keys are managed using environment variables
- We use restricted API keys for frontend use
- We recommend setting appropriate referrer restrictions in production environments

#### Location Privacy
- We recommend indicating the distance from the nearest station rather than the exact address
- We provide warnings when users enter detailed address information
- We offer location precision adjustment options

### 🌐 Deployment

The frontend can be deployed to static site hosting services like Netlify.

### 📝 Contributing

Contributions to the project are welcome. Please follow these steps:

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

### 📄 License

This project is released under the MIT License.