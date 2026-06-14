ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS wage_snapshot numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS without_helper boolean NOT NULL DEFAULT false;