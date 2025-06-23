/*
  # Create storage bucket for review images

  1. Storage Setup
    - Create 'review-images' bucket for storing review photos
    - Set up public access policies for image viewing
    - Configure upload policies for authenticated users

  2. Security
    - Only authenticated users can upload images
    - Public read access for all images
    - File size and type restrictions handled in client
*/

-- Create storage bucket for review images
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload review images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'review-images');

-- Allow public access to view images
CREATE POLICY "Public can view review images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'review-images');

-- Allow users to delete their own uploaded images
CREATE POLICY "Users can delete own review images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'review-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );