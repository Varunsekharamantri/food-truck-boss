
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date_key DATE NOT NULL,
  item TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  merchant TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX expenses_date_key_idx ON public.expenses (date_key DESC, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO anon, authenticated;
GRANT ALL ON public.expenses TO service_role;

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view expenses"
  ON public.expenses FOR SELECT
  USING (true);

CREATE POLICY "Public can insert expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can delete expenses"
  ON public.expenses FOR DELETE
  USING (true);
