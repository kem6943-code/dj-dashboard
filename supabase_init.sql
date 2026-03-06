-- Supabase Initialization Script for DJ Dashboard

-- 1. Create the table for storing dashboard data
CREATE TABLE IF NOT EXISTS public.dashboard_data (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS) but allow anonymous access (since we use anon key for now)
ALTER TABLE public.dashboard_data ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy that allows anyone to select, insert, and update
-- Note: In a real production app, you'd want proper authentication, but for this prototype/internal tool, we allow anon access.
CREATE POLICY "Allow anonymous read" ON public.dashboard_data FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON public.dashboard_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON public.dashboard_data FOR UPDATE USING (true);
