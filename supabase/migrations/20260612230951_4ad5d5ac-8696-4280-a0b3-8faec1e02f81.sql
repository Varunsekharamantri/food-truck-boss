CREATE TABLE public.daily_sales (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date_key date NOT NULL UNIQUE,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_sales TO anon, authenticated;
GRANT ALL ON public.daily_sales TO service_role;

ALTER TABLE public.daily_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view daily_sales" ON public.daily_sales FOR SELECT USING (true);
CREATE POLICY "Public can insert daily_sales" ON public.daily_sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update daily_sales" ON public.daily_sales FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete daily_sales" ON public.daily_sales FOR DELETE USING (true);

CREATE TRIGGER touch_daily_sales_updated_at
BEFORE UPDATE ON public.daily_sales
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();