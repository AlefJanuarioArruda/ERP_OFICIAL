/*
  # Simplified Authentication Schema

  1. New Tables
    - `user_profiles` (simplified)
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text, optional)
      - `cpf` (text, optional)
      - `organization_id` (uuid, optional)
      - `role` (text, default 'user')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on user_profiles table
    - Simple policies without circular dependencies
    - Users can only access their own data
*/

-- Drop existing tables and policies to start fresh
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Create simplified user_profiles table
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  cpf text,
  organization_id uuid,
  role text DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Simple policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();