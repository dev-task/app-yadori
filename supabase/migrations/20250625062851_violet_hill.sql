/*
  # プッシュ通知トリガーの設定

  1. トリガー関数の作成
    - いいね投稿時のプッシュ通知トリガー
    - コメント投稿時のプッシュ通知トリガー

  2. トリガーの設定
    - likes テーブルの INSERT 時にプッシュ通知を送信
    - comments テーブルの INSERT 時にプッシュ通知を送信
*/

-- Function to trigger like notification
CREATE OR REPLACE FUNCTION trigger_like_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the edge function to send push notification
  PERFORM
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/notify-like-posted',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object('record', to_jsonb(NEW))
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to trigger comment notification
CREATE OR REPLACE FUNCTION trigger_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the edge function to send push notification
  PERFORM
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/notify-comment-posted',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object('record', to_jsonb(NEW))
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_like_notification ON likes;
CREATE TRIGGER trigger_like_notification
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_like_notification();

DROP TRIGGER IF EXISTS trigger_comment_notification ON comments;
CREATE TRIGGER trigger_comment_notification
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_comment_notification();