/*
  # User profile enhancements and database optimization

  1. Constraints
    - Add bio length constraint (max 500 characters)
    - Add nickname length constraint (1-50 characters)

  2. Indexes
    - Add index for nickname search
    - Add index for email search

  3. Triggers
    - Add updated_at trigger for users table

  4. Security
    - Update RLS policies for better performance
    - Ensure proper access control

  5. Views
    - Create user_stats view for efficient statistics retrieval
*/

-- bio フィールドの長さ制限を追加（500文字まで）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'users_bio_length_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_bio_length_check 
    CHECK (length(bio) <= 500);
  END IF;
END $$;

-- ニックネームの長さ制限を追加（50文字まで）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'users_nickname_length_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_nickname_length_check 
    CHECK (length(nickname) <= 50 AND length(nickname) >= 1);
  END IF;
END $$;

-- ユーザー検索用のインデックス（ニックネームでの検索を高速化）
CREATE INDEX IF NOT EXISTS idx_users_nickname 
  ON users(nickname);

-- メールアドレスでの検索用インデックス
CREATE INDEX IF NOT EXISTS idx_users_email 
  ON users(email);

-- プロフィール更新時のupdated_atトリガー関数（既に存在する場合はスキップ）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- プロフィール更新トリガー（既に存在する場合は再作成）
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLSポリシーの確認と最適化
DROP POLICY IF EXISTS "Users can read all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- 新しいRLSポリシー
CREATE POLICY "Users can read all profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ユーザー統計情報を効率的に取得するためのビュー
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  u.id,
  u.nickname,
  u.created_at as joined_date,
  COALESCE(review_stats.review_count, 0) as total_reviews,
  COALESCE(like_stats.like_count, 0) as total_likes_received,
  COALESCE(comment_stats.comment_count, 0) as total_comments_made,
  COALESCE(rating_stats.avg_rating, 0) as average_rating
FROM users u
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as review_count
  FROM reviews
  GROUP BY user_id
) review_stats ON u.id = review_stats.user_id
LEFT JOIN (
  SELECT 
    r.user_id,
    COUNT(l.review_id) as like_count
  FROM reviews r
  LEFT JOIN likes l ON r.id = l.review_id
  GROUP BY r.user_id
) like_stats ON u.id = like_stats.user_id
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as comment_count
  FROM comments
  GROUP BY user_id
) comment_stats ON u.id = comment_stats.user_id
LEFT JOIN (
  SELECT 
    user_id,
    AVG(rating_avg) as avg_rating
  FROM (
    SELECT 
      user_id,
      (COALESCE(rating_location, 0) + 
       COALESCE(rating_sunlight, 0) + 
       COALESCE(rating_soundproof, 0) + 
       COALESCE(rating_environment, 0))::DECIMAL / 
      NULLIF(
        (CASE WHEN rating_location IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN rating_sunlight IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN rating_soundproof IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN rating_environment IS NOT NULL THEN 1 ELSE 0 END), 0
      ) as rating_avg
    FROM reviews
    WHERE rating_location IS NOT NULL 
       OR rating_sunlight IS NOT NULL 
       OR rating_soundproof IS NOT NULL 
       OR rating_environment IS NOT NULL
  ) individual_ratings
  GROUP BY user_id
) rating_stats ON u.id = rating_stats.user_id;