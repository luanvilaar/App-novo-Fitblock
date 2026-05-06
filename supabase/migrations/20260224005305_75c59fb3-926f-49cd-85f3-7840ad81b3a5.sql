
-- Table to store weekly ranking snapshots
CREATE TABLE public.ranking_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start date NOT NULL,
  week_end date NOT NULL,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  avatar_url text,
  group_name text NOT NULL DEFAULT '',
  total_points integer NOT NULL DEFAULT 0,
  position integer NOT NULL DEFAULT 0,
  workout_details jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast week lookups
CREATE INDEX idx_ranking_history_week ON public.ranking_history (week_start, week_end);
CREATE INDEX idx_ranking_history_student ON public.ranking_history (student_id);

-- Enable RLS
ALTER TABLE public.ranking_history ENABLE ROW LEVEL SECURITY;

-- Public read (landing page ranking history)
CREATE POLICY "Anyone can read ranking history"
  ON public.ranking_history FOR SELECT
  USING (true);

-- Only service role inserts (via edge function)
CREATE POLICY "Service role inserts ranking history"
  ON public.ranking_history FOR INSERT
  WITH CHECK (false);

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
