/*
  # FloristPro Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `flower_batches`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `flower_type` (text)
      - `variety` (text)
      - `quantity` (integer)
      - `unit_of_measure` (text, default 'Stem')
      - `purchase_date` (date)
      - `expected_shelf_life` (integer)
      - `shelf_life_unit` (text, default 'Days')
      - `supplier` (text)
      - `initial_condition` (text, default 'Good')
      - `visual_notes` (text, optional)
      - `storage_environment` (text, default 'Room Temperature')
      - `water_type` (text, default 'Tap Water')
      - `humidity_level` (text, default 'Medium')
      - `floral_food_used` (boolean, default false)
      - `vase_cleanliness` (text, default 'Clean')
      - `dynamic_spoilage_date` (timestamp)
      - `ai_prediction` (integer)
      - `ai_confidence` (numeric)
      - `ai_reasoning` (text)
      - `ai_recommendations` (text[])
      - `ai_last_updated` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Automatic user profile creation on signup

  3. Performance
    - Indexes on frequently queried columns
    - Automatic timestamp updates
*/

-- Create users table to extend auth.users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create the flower_batches table
CREATE TABLE IF NOT EXISTS flower_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  flower_type text NOT NULL,
  variety text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_of_measure text NOT NULL DEFAULT 'Stem',
  purchase_date date NOT NULL,
  expected_shelf_life integer NOT NULL CHECK (expected_shelf_life > 0),
  shelf_life_unit text NOT NULL DEFAULT 'Days',
  supplier text NOT NULL,
  initial_condition text NOT NULL DEFAULT 'Good',
  visual_notes text,
  storage_environment text NOT NULL DEFAULT 'Room Temperature',
  water_type text NOT NULL DEFAULT 'Tap Water',
  humidity_level text NOT NULL DEFAULT 'Medium',
  floral_food_used boolean NOT NULL DEFAULT false,
  vase_cleanliness text NOT NULL DEFAULT 'Clean',
  dynamic_spoilage_date timestamptz NOT NULL,
  ai_prediction numeric,
  ai_confidence numeric,
  ai_reasoning text,
  ai_recommendations text[],
  ai_last_updated timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on flower_batches
ALTER TABLE flower_batches ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own flower batches
CREATE POLICY "Users can manage their own flower batches"
  ON flower_batches
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_flower_batches_user_id ON flower_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_flower_batches_spoilage_date ON flower_batches(dynamic_spoilage_date);
CREATE INDEX IF NOT EXISTS idx_flower_batches_created_at ON flower_batches(created_at DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_flower_batches_updated_at ON flower_batches;
CREATE TRIGGER update_flower_batches_updated_at
  BEFORE UPDATE ON flower_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();