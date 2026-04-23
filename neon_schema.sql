-- NEON POSTGRESQL SCHEMA (Mood Tracker)
-- Objective: Support custom authentication handshake, language preferences, and strict row-level security.

-- Drop previous iterations if existing during dev reset
DROP TABLE IF EXISTS public.mood_entries;
DROP TABLE IF EXISTS public.users;

-- 1. Create the users table
CREATE TABLE public.users (
    id BIGINT PRIMARY KEY, -- External ID provided by the MantraCare authentication handshake
    preferred_language VARCHAR(10) DEFAULT 'en', -- Tracks language standard (e.g. 'en', 'es', 'zh-CN') based on translation script
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create the mood_entries table
CREATE TABLE public.mood_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    mood_value INT NOT NULL, -- Numeric scale: 1 to 5
    mood_label TEXT NOT NULL, -- Text fallback label
    day_name TEXT NOT NULL,
    note TEXT,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Performance Indexes
CREATE INDEX idx_mood_entries_user_id ON public.mood_entries (user_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- When connecting from your backend to Neon, ensure you set a local session variable for the verified `user_id`.
-- Example SQL usage in your backend before executing queries: 
-- SET LOCAL app.current_user_id = '9999';

CREATE POLICY "Users can view their own profile" 
    ON public.users 
    FOR SELECT 
    USING (id = nullif(current_setting('app.current_user_id', true), '')::BIGINT);

CREATE POLICY "Users can update their own profile" 
    ON public.users 
    FOR UPDATE
    USING (id = nullif(current_setting('app.current_user_id', true), '')::BIGINT)
    WITH CHECK (id = nullif(current_setting('app.current_user_id', true), '')::BIGINT);

CREATE POLICY "Users can insert their own profile" 
    ON public.users 
    FOR INSERT
    WITH CHECK (id = nullif(current_setting('app.current_user_id', true), '')::BIGINT);

CREATE POLICY "Users can view their own moods" 
    ON public.mood_entries 
    FOR SELECT 
    USING (user_id = nullif(current_setting('app.current_user_id', true), '')::BIGINT);

CREATE POLICY "Users can insert their own moods" 
    ON public.mood_entries 
    FOR INSERT 
    WITH CHECK (user_id = nullif(current_setting('app.current_user_id', true), '')::BIGINT);

CREATE POLICY "Users can update their own moods" 
    ON public.mood_entries 
    FOR UPDATE 
    USING (user_id = nullif(current_setting('app.current_user_id', true), '')::BIGINT)
    WITH CHECK (user_id = nullif(current_setting('app.current_user_id', true), '')::BIGINT);

CREATE POLICY "Users can delete their own moods" 
    ON public.mood_entries 
    FOR DELETE
    USING (user_id = nullif(current_setting('app.current_user_id', true), '')::BIGINT);
