/*
  # プッシュ通知用のuser_devicesテーブル作成

  1. 新しいテーブル
    - `user_devices` - プッシュ通知用デバイス情報
      - `push_token` (text, primary key) - Expoプッシュトークン
      - `user_id` (uuid, foreign key) - ユーザーID
      - `device_type` (text) - デバイスタイプ ('ios', 'android')
      - `platform` (text) - プラットフォーム ('mobile')
      - `active` (boolean) - アクティブ状態
      - `created_at` (timestamp) - 作成日時
      - `updated_at` (timestamp) - 更新日時

  2. セキュリティ
    - RLS (Row Level Security) を有効化
    - ユーザーが自分のデバイス情報のみアクセス可能

  3. インデックス
    - パフォーマンス向上のため必要なカラムにインデックス作成
*/

-- Create user_devices table
CREATE TABLE IF NOT EXISTS user_devices (
  push_token text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_type text NOT NULL CHECK (device_type IN ('ios', 'android')),
  platform text NOT NULL DEFAULT 'mobile',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read own devices"
  ON user_devices
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices"
  ON user_devices
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own devices"
  ON user_devices
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices"
  ON user_devices
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id 
  ON user_devices(user_id);

CREATE INDEX IF NOT EXISTS idx_user_devices_active 
  ON user_devices(active) WHERE active = true;

-- Create trigger for updated_at
CREATE TRIGGER update_user_devices_updated_at
  BEFORE UPDATE ON user_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();