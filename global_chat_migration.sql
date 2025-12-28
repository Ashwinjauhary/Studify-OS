-- Global Chat Support Migration

-- 1. Modify messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS channel_id TEXT;
ALTER TABLE public.messages ALTER COLUMN receiver_id DROP NOT NULL;

-- 2. Update RLS Policies
-- Allow reading global messages
CREATE POLICY "Everyone can read global messages" 
ON public.messages FOR SELECT 
USING (channel_id = 'global');

-- Allow sending to global
CREATE POLICY "Users can send to global" 
ON public.messages FOR INSERT 
WITH CHECK (channel_id = 'global');
