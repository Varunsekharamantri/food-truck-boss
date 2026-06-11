-- Revoke write access from anonymous users
REVOKE INSERT, UPDATE, DELETE ON public.expenses FROM anon;

-- Keep read access for everyone
GRANT SELECT ON public.expenses TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;

-- Drop overly permissive write policies
DROP POLICY IF EXISTS "Public can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Public can delete expenses" ON public.expenses;

-- Create authenticated-only policies
CREATE POLICY "Authenticated users can insert expenses"
  ON public.expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete expenses"
  ON public.expenses FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);