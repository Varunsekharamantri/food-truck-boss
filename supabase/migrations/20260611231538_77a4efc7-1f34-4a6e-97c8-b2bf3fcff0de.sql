
-- ORDERS
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number integer NOT NULL,
  date_key date NOT NULL,
  ts timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'Waiting',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public can insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update orders" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete orders" ON public.orders FOR DELETE USING (true);
CREATE INDEX orders_date_key_idx ON public.orders (date_key);

-- MENU
CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bucket text NOT NULL,
  price numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_items TO anon, authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view menu" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Public can insert menu" ON public.menu_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update menu" ON public.menu_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete menu" ON public.menu_items FOR DELETE USING (true);

-- INVENTORY
CREATE TABLE public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  quantity numeric NOT NULL,
  unit text NOT NULL,
  cost_per_unit numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory TO anon, authenticated;
GRANT ALL ON public.inventory TO service_role;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view inventory" ON public.inventory FOR SELECT USING (true);
CREATE POLICY "Public can insert inventory" ON public.inventory FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update inventory" ON public.inventory FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete inventory" ON public.inventory FOR DELETE USING (true);

-- EXPENSES: make fully public (drop auth requirement)
DROP POLICY IF EXISTS "Authenticated users can delete expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can insert expenses" ON public.expenses;
CREATE POLICY "Public can insert expenses" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update expenses" ON public.expenses FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete expenses" ON public.expenses FOR DELETE USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO anon;

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER menu_items_touch BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER inventory_touch BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
