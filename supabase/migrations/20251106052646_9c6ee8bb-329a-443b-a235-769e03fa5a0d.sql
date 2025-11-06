-- Create security definer function to check user role
-- This prevents infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id;
$$;

-- Drop the existing INSERT policy that causes recursion
DROP POLICY IF EXISTS "Students can join classes" ON public.class_memberships;

-- Recreate the INSERT policy using the security definer function
CREATE POLICY "Students can join classes"
ON public.class_memberships
FOR INSERT
WITH CHECK (
  auth.uid() = student_id 
  AND public.get_user_role(auth.uid()) = 'student'::app_role
);