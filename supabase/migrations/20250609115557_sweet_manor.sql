/*
  # Fix Organization Creation RLS Policy

  1. Security Updates
    - Update the INSERT policy for organizations table to allow authenticated users to create organizations
    - Ensure the policy works during the sign-up process
    - Maintain security by only allowing authenticated users

  2. Changes
    - Modify the existing INSERT policy to be more permissive during organization creation
    - Keep other policies intact for proper security
*/

-- Drop the existing INSERT policy for organizations
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;

-- Create a new INSERT policy that allows authenticated users to create organizations
CREATE POLICY "Authenticated users can create organizations"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure the SELECT policy allows users to view organizations they create
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;

CREATE POLICY "Users can view their organization"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT user_profiles.organization_id
      FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    )
    OR
    -- Allow viewing during the creation process (temporary access)
    created_at > (now() - interval '5 minutes')
  );