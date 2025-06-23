/*
  # コメント機能のRLSポリシー強化

  1. Security Updates
    - コメントのRLSポリシーを強化
    - ユーザーが自分のコメントのみ編集・削除できるように制限
    - 認証済みユーザーのみコメント投稿可能

  2. Performance
    - コメント取得時のインデックス最適化
    - ユーザー情報の効率的な結合
*/

-- コメントのRLSポリシーを更新（既存のポリシーがある場合は削除して再作成）
DROP POLICY IF EXISTS "Users can insert own comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
DROP POLICY IF EXISTS "Anyone can read comments" ON comments;

-- 新しいRLSポリシーを作成
CREATE POLICY "Authenticated users can read all comments"
  ON comments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert own comments"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- コメント数の効率的な取得のためのインデックス（既に存在する場合はスキップ）
CREATE INDEX IF NOT EXISTS idx_comments_review_id_created_at 
  ON comments(review_id, created_at DESC);

-- コメント投稿時の通知機能用のトリガー関数（将来の拡張用）
CREATE OR REPLACE FUNCTION notify_comment_posted()
RETURNS TRIGGER AS $$
BEGIN
  -- 将来的にリアルタイム通知やメール通知を実装する際に使用
  PERFORM pg_notify('comment_posted', json_build_object(
    'comment_id', NEW.id,
    'review_id', NEW.review_id,
    'user_id', NEW.user_id
  )::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- コメント投稿時のトリガー
DROP TRIGGER IF EXISTS trigger_notify_comment_posted ON comments;
CREATE TRIGGER trigger_notify_comment_posted
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment_posted();