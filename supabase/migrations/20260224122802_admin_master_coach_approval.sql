-- Phase 1b: Add coach_status column to trainers table
ALTER TABLE public.trainers
ADD COLUMN IF NOT EXISTS coach_status TEXT
DEFAULT 'approved'
CHECK (coach_status IN ('pending', 'approved', 'rejected', 'suspended'));

-- Phase 1c: Expand trainer_access_codes table with new fields
ALTER TABLE public.trainer_access_codes
ADD COLUMN IF NOT EXISTS franchise_name TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMPTZ DEFAULT NULL;

-- Phase 1d: Create coach_approvals table for audit trail
CREATE TABLE IF NOT EXISTS public.coach_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES public.trainers(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 1e: Enable RLS on coach_approvals
ALTER TABLE public.coach_approvals ENABLE ROW LEVEL SECURITY;

-- Phase 1f: RLS policy for coach_approvals - admin_master full access
DROP POLICY IF EXISTS "admin_master_full_access_approvals" ON public.coach_approvals;
CREATE POLICY "admin_master_full_access_approvals" ON public.coach_approvals
USING (has_role(auth.uid(), 'admin_master'));

-- Phase 1g: RLS policy for coaches to see their own approvals
DROP POLICY IF EXISTS "coaches_see_own_approvals" ON public.coach_approvals;
CREATE POLICY "coaches_see_own_approvals" ON public.coach_approvals FOR SELECT
USING (
  coach_id IN (
    SELECT id FROM public.trainers WHERE user_id = auth.uid()
  )
);

-- Phase 1h: Data migration - Ensure all users have a role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'cliente'
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = au.id
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Phase 1i: Data migration - Set admin_master role for l.vilaar@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin_master'
FROM auth.users
WHERE email = 'l.vilaar@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = id AND role = 'admin_master'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Phase 1j: RLS policy for trainers table - coaches can't see coach_status of others
DROP POLICY IF EXISTS "coaches_see_own_status" ON public.trainers;

CREATE POLICY "coaches_see_own_status" ON public.trainers FOR SELECT
USING (
  user_id = auth.uid() OR
  has_role(auth.uid(), 'admin_master') OR
  has_role(auth.uid(), 'admin')
);
