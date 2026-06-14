
-- 1) Replace public policies with authenticated-only policies on all business tables
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['daily_sales','attendance','employees','salary_payouts','expenses','menu_items','inventory','orders'];
  pol record;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;
  END LOOP;
END $$;

-- Recreate as authenticated-only (anonymous sign-in users have role authenticated)
CREATE POLICY "Authenticated can select daily_sales" ON public.daily_sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert daily_sales" ON public.daily_sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update daily_sales" ON public.daily_sales FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete daily_sales" ON public.daily_sales FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can select attendance" ON public.attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update attendance" ON public.attendance FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete attendance" ON public.attendance FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can select employees" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert employees" ON public.employees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update employees" ON public.employees FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete employees" ON public.employees FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can select payouts" ON public.salary_payouts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert payouts" ON public.salary_payouts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update payouts" ON public.salary_payouts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete payouts" ON public.salary_payouts FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can select expenses" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update expenses" ON public.expenses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete expenses" ON public.expenses FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can select menu" ON public.menu_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert menu" ON public.menu_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update menu" ON public.menu_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete menu" ON public.menu_items FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can select inventory" ON public.inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert inventory" ON public.inventory FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update inventory" ON public.inventory FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete inventory" ON public.inventory FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can select orders" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update orders" ON public.orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete orders" ON public.orders FOR DELETE TO authenticated USING (true);

-- 2) Fix mutable search_path on existing function
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- 3) Realtime authorization: restrict channel subscriptions to authenticated users
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can read realtime messages" ON realtime.messages;
CREATE POLICY "Authenticated can read realtime messages"
ON realtime.messages FOR SELECT TO authenticated USING (true);
