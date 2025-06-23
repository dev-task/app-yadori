/*
  # 住まい口コミSNS - 初期データベーススキーマ

  1. 新しいテーブル
    - `users` - ユーザープロフィール情報
      - `id` (uuid, primary key) - Supabase Auth連携
      - `nickname` (text) - ユーザーのニックネーム
      - `email` (text) - メールアドレス
      - `created_at` (timestamp) - 作成日時
      - `updated_at` (timestamp) - 更新日時

    - `reviews` - 物件レビュー情報
      - `id` (int, primary key) - レビューID
      - `user_id` (uuid, foreign key) - 投稿者ID
      - `address_text` (text) - 住所テキスト（プライバシー配慮）
      - `latitude` (float) - 緯度
      - `longitude` (float) - 経度
      - `rent` (int) - 家賃
      - `layout` (text) - 間取り
      - `period_lived` (text) - 居住期間
      - `pros_text` (text) - 良かった点
      - `cons_text` (text) - 悪かった点
      - `rating_location` (int) - 立地評価(1-5)
      - `rating_sunlight` (int) - 日当たり評価(1-5)
      - `rating_soundproof` (int) - 防音性評価(1-5)
      - `rating_environment` (int) - 周辺環境評価(1-5)
      - `created_at` (timestamp) - 作成日時
      - `updated_at` (timestamp) - 更新日時

    - `review_images` - レビュー画像
      - `id` (int, primary key) - 画像ID
      - `review_id` (int, foreign key) - レビューID
      - `image_url` (text) - 画像URL
      - `created_at` (timestamp) - 作成日時

    - `comments` - レビューコメント
      - `id` (int, primary key) - コメントID
      - `user_id` (uuid, foreign key) - コメント投稿者ID
      - `review_id` (int, foreign key) - レビューID
      - `body` (text) - コメント本文
      - `created_at` (timestamp) - 作成日時
      - `updated_at` (timestamp) - 更新日時

    - `likes` - いいね機能
      - `user_id` (uuid, foreign key) - ユーザーID
      - `review_id` (int, foreign key) - レビューID
      - `created_at` (timestamp) - 作成日時
      - 複合主キー (user_id, review_id)

  2. セキュリティ
    - 全テーブルでRLS (Row Level Security) を有効化
    - 各テーブルに適切なポリシーを設定
    - 認証済みユーザーのみアクセス可能

  3. インデックス
    - パフォーマンス向上のため必要なカラムにインデックス作成
*/

-- Users profile table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  bio text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_text text NOT NULL,
  latitude double precision,
  longitude double precision,
  rent integer,
  layout text DEFAULT '',
  period_lived text DEFAULT '',
  pros_text text DEFAULT '',
  cons_text text DEFAULT '',
  rating_location integer CHECK (rating_location >= 1 AND rating_location <= 5),
  rating_sunlight integer CHECK (rating_sunlight >= 1 AND rating_sunlight <= 5),
  rating_soundproof integer CHECK (rating_soundproof >= 1 AND rating_soundproof <= 5),
  rating_environment integer CHECK (rating_environment >= 1 AND rating_environment <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Review images table
CREATE TABLE IF NOT EXISTS review_images (
  id bigserial PRIMARY KEY,
  review_id bigint NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  review_id bigint NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Likes table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS likes (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  review_id bigint NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, review_id)
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read all profiles" ON users
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Reviews policies
CREATE POLICY "Reviews are publicly readable" ON reviews
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own reviews" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON reviews
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Review images policies
CREATE POLICY "Review images are publicly readable" ON review_images
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert images for own reviews" ON review_images
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reviews 
      WHERE reviews.id = review_images.review_id 
      AND reviews.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete images from own reviews" ON review_images
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reviews 
      WHERE reviews.id = review_images.review_id 
      AND reviews.user_id = auth.uid()
    )
  );

-- Comments policies
CREATE POLICY "Comments are publicly readable" ON comments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own comments" ON comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Likes are publicly readable" ON likes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own likes" ON likes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON likes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_location ON reviews(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_review_id ON comments(review_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_review_id ON likes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_images_review_id ON review_images(review_id);

-- Create function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at 
  BEFORE UPDATE ON reviews 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at 
  BEFORE UPDATE ON comments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();