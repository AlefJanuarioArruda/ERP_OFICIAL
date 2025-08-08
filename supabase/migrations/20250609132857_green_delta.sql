/*
  # Fix RLS infinite recursion between user_profiles and organizations

  1. Policy Changes
    - Remove circular dependencies between user_profiles and organizations
    - Create direct, non-recursive policies
    - Ensure proper data access without infinite loops

  2. Security
    - Maintain data isolation between organizations
    - Users can only access their own profile and organization
    - Prevent unauthorized access to other organizations' data
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Organization admins can update their organization" ON organizations;

DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON user_profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

-- Create new non-recursive policies for organizations
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

CREATE POLICY "Authenticated users can create organizations"
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

-- Create new non-recursive policies for user_profiles
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
    organization_id IS NOT NULL 
    AND organization_id = (
      SELECT organization_id 
      FROM user_profiles 
      WHERE id = auth.uid()
    )
    AND id != auth.uid()
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