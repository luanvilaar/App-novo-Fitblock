
-- Allow anyone (including anon) to read boxes - they're public data
CREATE POLICY "Public read boxes" ON public.boxes
  FOR SELECT TO anon USING (true);
