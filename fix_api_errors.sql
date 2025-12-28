-- 1. Fix Relationships Table & RLS
-- Ensure the relationships table allows 'select' for authorized users
-- The error 400 with 'or=' filter often implies recursion limits or bad policy.
-- Note: Supabase sometimes throws 400 for bad query syntax too, but let's ensure policies are open.

ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;

-- Allow users to see relationships where they are follower OR following
DROP POLICY IF EXISTS "Users can view their own relationships" ON public.relationships;
CREATE POLICY "Users can view their own relationships"
ON public.relationships FOR SELECT
TO authenticated
USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- Allow users to insert (follow)
DROP POLICY IF EXISTS "Users can follow others" ON public.relationships;
CREATE POLICY "Users can follow others"
ON public.relationships FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = follower_id);

-- Allow users to update (accept/reject) - checking following_id for acceptance
DROP POLICY IF EXISTS "Users can update their own received requests" ON public.relationships;
CREATE POLICY "Users can update their own received requests"
ON public.relationships FOR UPDATE
TO authenticated
USING (auth.uid() = following_id);

-- 2. Fix Daily Missions 400 (Missing Column 'is_anticheat_enabled'?)
-- Add the column if it doesn't exist.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_missions' AND column_name = 'is_anticheat_enabled') THEN 
        ALTER TABLE public.daily_missions ADD COLUMN is_anticheat_enabled BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mission_templates' AND column_name = 'is_anticheat_enabled') THEN 
        ALTER TABLE public.mission_templates ADD COLUMN is_anticheat_enabled BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 3. Fix Notifications 403 (Forbidden)
-- Allow admins (or anyone for now, strictly secured later) to INSERT notifications
-- AND allow users to SELECT their own notifications.

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select their own notifications" ON public.notifications;
CREATE POLICY "Users can select their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow admins to insert. For now, since we handle logic in backend/frontend, 
-- we might need to allow authenticated users to insert if the Admin UI sends it directly.
-- Ideally this should be a stored procedure with creating privileges, but for this dev stage:
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- 4. Fix Skills/Careers 400/406
-- Ensure public read access for skills and careers
ALTER TABLE public.careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for careers" ON public.careers;
CREATE POLICY "Public read access for careers"
ON public.careers FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Public read access for skills" ON public.skills;
CREATE POLICY "Public read access for skills"
ON public.skills FOR SELECT
TO authenticated
USING (true);

-- 5. Fix potentially missing 'channel_id' in messages just in case
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'channel_id') THEN 
        ALTER TABLE public.messages ADD COLUMN channel_id TEXT DEFAULT 'global';
    END IF;
END $$;
