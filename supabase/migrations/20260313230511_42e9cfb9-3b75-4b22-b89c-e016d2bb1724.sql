
-- 1. Create boxes table structure (ensure columns exist)
CREATE TABLE IF NOT EXISTS public.boxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure specific columns added in this patch exist
ALTER TABLE public.boxes ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.boxes ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Enable RLS
ALTER TABLE public.boxes ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read boxes
DROP POLICY IF EXISTS "Authenticated read boxes" ON public.boxes;
CREATE POLICY "Authenticated read boxes" ON public.boxes
  FOR SELECT TO authenticated USING (true);

-- Only admins can manage boxes
DROP POLICY IF EXISTS "Admins manage boxes" ON public.boxes;
CREATE POLICY "Admins manage boxes" ON public.boxes
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Deny anon
DROP POLICY IF EXISTS "Deny anonymous access to boxes" ON public.boxes;
CREATE POLICY "Deny anonymous access to boxes" ON public.boxes
  FOR ALL TO anon USING (false);

-- 2. Seed default boxes
INSERT INTO public.boxes (name, slug) VALUES
  ('FitBlock Training', 'fitblock-training'),
  ('PulseFit', 'pulsefit')
ON CONFLICT (slug) DO NOTHING;

-- 3. Add box_id to profiles (ensure columns/refs exist)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS box_id uuid REFERENCES public.boxes(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date date;

-- 4. Add box_id to students (ensure columns/refs exist)
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS box_id uuid REFERENCES public.boxes(id);
