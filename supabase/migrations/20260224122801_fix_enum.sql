-- Fix for Postgres Enum transaction issue
-- Adds 'admin_master' to app_role in a separate transaction from the rest of the linking system
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'admin_master') THEN
    ALTER TYPE public.app_role ADD VALUE 'admin_master';
  END IF;
END $$;
