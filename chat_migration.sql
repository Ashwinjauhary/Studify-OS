-- Chat System Migration
-- Run this in your Supabase SQL Editor

-- 1. Create Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Users can read messages sent to them OR sent by them
CREATE POLICY "Users can read their own messages" 
ON public.messages FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send messages
CREATE POLICY "Users can send messages" 
ON public.messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

-- 4. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
