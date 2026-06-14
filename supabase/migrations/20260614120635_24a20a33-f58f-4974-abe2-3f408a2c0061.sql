CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  daily_wage numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO anon, authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view employees" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Public can insert employees" ON public.employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update employees" ON public.employees FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete employees" ON public.employees FOR DELETE USING (true);
CREATE TRIGGER trg_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date_key date NOT NULL,
  present boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, date_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO anon, authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view attendance" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Public can insert attendance" ON public.attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update attendance" ON public.attendance FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete attendance" ON public.attendance FOR DELETE USING (true);

CREATE TABLE public.salary_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date_key date NOT NULL,
  amount numeric NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_payouts TO anon, authenticated;
GRANT ALL ON public.salary_payouts TO service_role;
ALTER TABLE public.salary_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view payouts" ON public.salary_payouts FOR SELECT USING (true);
CREATE POLICY "Public can insert payouts" ON public.salary_payouts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update payouts" ON public.salary_payouts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete payouts" ON public.salary_payouts FOR DELETE USING (true);