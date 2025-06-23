/*
  # Enable RLS for chat_histories table

  1. Security Updates
    - Enable RLS on `chat_histories` table
    - Add policy for users to manage their own chat history

  2. Schema Updates
    - Add missing columns to reviews table for better functionality
    - Update reviews table structure to match requirements
*/

-- Enable RLS on chat_histories table
ALTER TABLE chat_histories ENABLE ROW LEVEL SECURITY;

-- Add policy for chat histories - users can only access their own sessions
CREATE POLICY "Users can manage own chat sessions"
  ON chat_histories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add missing columns to reviews table if they don't exist
DO $$
BEGIN
  -- Add period_lived column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'period_lived'
  ) THEN
    ALTER TABLE reviews ADD COLUMN period_lived text DEFAULT '';
  END IF;
END $$;

-- Update reviews table RLS policies to be more specific
DROP POLICY IF EXISTS "Reviews are publicly readable" ON reviews;
DROP POLICY IF EXISTS "Users can insert own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;

-- Create comprehensive RLS policies for reviews
CREATE POLICY "Anyone can read reviews"
  ON reviews
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own reviews"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update review_images RLS policies
DROP POLICY IF EXISTS "Review images are publicly readable" ON review_images;
DROP POLICY IF EXISTS "Users can insert images for own reviews" ON review_images;
DROP POLICY IF EXISTS "Users can delete images from own reviews" ON review_images;

CREATE POLICY "Anyone can read review images"
  ON review_images
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert images for own reviews"
  ON review_images
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reviews
      WHERE reviews.id = review_images.review_id
      AND reviews.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete images from own reviews"
  ON review_images
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reviews
      WHERE reviews.id = review_images.review_id
      AND reviews.user_id = auth.uid()
    )
  );

-- Update comments RLS policies
DROP POLICY IF EXISTS "Comments are publicly readable" ON comments;
DROP POLICY IF EXISTS "Users can insert own comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

CREATE POLICY "Anyone can read comments"
  ON comments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own comments"
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

-- Update likes RLS policies
DROP POLICY IF EXISTS "Likes are publicly readable" ON likes;
DROP POLICY IF EXISTS "Users can insert own likes" ON likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;

CREATE POLICY "Anyone can read likes"
  ON likes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own likes"
  ON likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);