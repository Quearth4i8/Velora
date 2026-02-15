-- Fix infinite recursion in profiles RLS policies
-- The issue is that policies referencing profiles within themselves cause recursion

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- Create a security definer function to check admin status in public schema
-- This bypasses RLS and prevents recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND is_admin = TRUE
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO anon;

-- Recreate profiles policies using the security definer function
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Also fix admin_activity_log policies to use the function
DROP POLICY IF EXISTS "Only admins can view admin logs" ON admin_activity_log;
DROP POLICY IF EXISTS "Only admins can insert admin logs" ON admin_activity_log;

CREATE POLICY "Only admins can view admin logs"
  ON admin_activity_log
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can insert admin logs"
  ON admin_activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- Fix video_requests admin policies
DROP POLICY IF EXISTS "Admins can manage video requests" ON video_requests;

CREATE POLICY "Admins can manage video requests"
  ON video_requests
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
