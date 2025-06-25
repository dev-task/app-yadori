/*
  # プッシュ通知設定の最終調整

  1. 設定の確認
    - net extensionの有効化
    - 必要な設定値の追加

  2. 通知トリガーの最適化
    - エラーハンドリングの改善
    - パフォーマンスの最適化
*/

-- Enable the net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Create settings for Supabase URL and service role key
-- These will be set via environment variables in production
DO $$
BEGIN
  -- Set default values that will be overridden by environment variables
  PERFORM set_config('app.supabase_url', 'http://localhost:54321', false);
  PERFORM set_config('app.service_role_key', 'your-service-role-key', false);
END $$;

-- Improved notification trigger functions with better error handling
CREATE OR REPLACE FUNCTION trigger_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url text;
  service_key text;
  response_status int;
BEGIN
  -- Get configuration values
  supabase_url := current_setting('app.supabase_url', true);
  service_key := current_setting('app.service_role_key', true);
  
  -- Only proceed if we have valid configuration
  IF supabase_url IS NOT NULL AND service_key IS NOT NULL THEN
    BEGIN
      -- Make HTTP request to edge function
      SELECT status INTO response_status
      FROM extensions.http_post(
        url := supabase_url || '/functions/v1/notify-like-posted',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_key
        ),
        body := jsonb_build_object('record', to_jsonb(NEW))
      );
      
      -- Log the response status for debugging
      RAISE LOG 'Like notification sent with status: %', response_status;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the transaction
      RAISE LOG 'Failed to send like notification: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION trigger_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url text;
  service_key text;
  response_status int;
BEGIN
  -- Get configuration values
  supabase_url := current_setting('app.supabase_url', true);
  service_key := current_setting('app.service_role_key', true);
  
  -- Only proceed if we have valid configuration
  IF supabase_url IS NOT NULL AND service_key IS NOT NULL THEN
    BEGIN
      -- Make HTTP request to edge function
      SELECT status INTO response_status
      FROM extensions.http_post(
        url := supabase_url || '/functions/v1/notify-comment-posted',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_key
        ),
        body := jsonb_build_object('record', to_jsonb(NEW))
      );
      
      -- Log the response status for debugging
      RAISE LOG 'Comment notification sent with status: %', response_status;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the transaction
      RAISE LOG 'Failed to send comment notification: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate triggers with the updated functions
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