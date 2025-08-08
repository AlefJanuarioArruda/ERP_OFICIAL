/*
  # Authentication System Schema

  1. New Tables
    - `organizations`
      - `id` (uuid, primary key)
      - `name` (text)
      - `cnpj` (text, unique)
      - `business_area` (text)
      - `employee_count` (integer)
      - `phone` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `cpf` (text, unique)
      - `organization_id` (uuid, references organizations)
      - `role` (text, default 'user')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
    - Add policies for organization members to view organization data
*/

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cnpj text UNIQUE NOT NULL,
  business_area text NOT NULL,
  employee_count integer NOT NULL DEFAULT 1,
  phone text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  cpf text UNIQUE NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  role text DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view their organization"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create organizations"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Organization admins can update their organization"
  ON organizations
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User profiles policies
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can view profiles in their organization"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own profile"
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

-- Triggers for updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();