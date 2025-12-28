-- SAFE MIGRATION SCRIPT
-- Run this to ensure all latest tables exist without errors

-- 1. Resources Table (Phase 4)
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 500;
ALTER TABLE public.mission_templates ADD COLUMN IF NOT EXISTS career_id UUID REFERENCES public.careers(id);

CREATE TABLE IF NOT EXISTS public.resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('link', 'pdf', 'image', 'note', 'book')),
    url TEXT,
    subject TEXT,
    tags TEXT[],
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users view own resources' AND tablename = 'resources') THEN
        CREATE POLICY "Users view own resources" ON public.resources FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own resources' AND tablename = 'resources') THEN
        CREATE POLICY "Users manage own resources" ON public.resources FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- 2. Calendar Events Table (Phase 5)
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    type TEXT CHECK (type IN ('exam', 'assignment', 'study_session', 'other')) DEFAULT 'study_session',
    color TEXT DEFAULT '#a855f7',
    is_all_day BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users view own events' AND tablename = 'calendar_events') THEN
        CREATE POLICY "Users view own events" ON public.calendar_events FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own events' AND tablename = 'calendar_events') THEN
        CREATE POLICY "Users manage own events" ON public.calendar_events FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;
