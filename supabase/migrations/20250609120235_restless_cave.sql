/*
  # Fix RLS infinite recursion between user_profiles and organizations

  1. Policy Changes
    - Update organizations SELECT policy to avoid circular dependency
    - Simplify user_profiles SELECT policies to prevent recursion
    - Ensure users can access their organization data without infinite loops

  2. Security
    - Maintain data isolation between organizations
    - Users can only access their own profile and organization
    - Prevent unauthorized access to other organizations' data
*/

-- Drop existing problematic policies on organizations
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;

-- Drop existing problematic policies on user_profiles  
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;

-- Create simplified SELECT policy for organizations
-- Users can only see the organization they belong to
CREATE POLICY "Users can view their organization"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid()));

-- Create simplified SELECT policies for user_profiles
-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Users can view other profiles in their organization (for admin/manager features)
CREATE POLICY "Users can view profiles in their organization"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    organization_id IS NOT NULL 
    AND organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
    AND id != auth.uid()
  );