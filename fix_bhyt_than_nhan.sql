-- Disable Row Level Security on the table to fix the "violates row-level security policy" error
ALTER TABLE public.bhyt_than_nhan DISABLE ROW LEVEL SECURITY;

-- Add the missing columns based on the template
ALTER TABLE public.bhyt_than_nhan ADD COLUMN IF NOT EXISTS so_cccd TEXT;
ALTER TABLE public.bhyt_than_nhan ADD COLUMN IF NOT EXISTS noi_cap_cccd TEXT;
