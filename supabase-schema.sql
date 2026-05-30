-- Farcaster Frame App Schema
-- Run this in Supabase SQL Editor

-- 1. Users table
CREATE TABLE IF NOT EXISTS public.users (
  fid BIGINT PRIMARY KEY,
  username TEXT,
  display_name TEXT,
  pfp_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- 3. Notifications log
CREATE TABLE IF NOT EXISTS public.notifications (
  id BIGSERIAL PRIMARY KEY,
  fid BIGINT REFERENCES public.users(fid),
  type TEXT NOT NULL, -- 'welcome', 'swap_thankyou', 'announcement'
  title TEXT,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Frame installs tracking
CREATE TABLE IF NOT EXISTS public.frame_installs (
  id BIGSERIAL PRIMARY KEY,
  fid BIGINT REFERENCES public.users(fid),
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  notifications_enabled BOOLEAN DEFAULT FALSE
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frame_installs ENABLE ROW LEVEL SECURITY;

-- Allow public read for announcements
CREATE POLICY "Anyone can read announcements"
  ON public.announcements FOR SELECT
  USING (TRUE);

-- Allow insert for anyone (we'll handle auth in-app)
CREATE POLICY "Anyone can upsert users"
  ON public.users FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Anyone can update users"
  ON public.users FOR UPDATE
  USING (TRUE);

-- Insert sample announcement
INSERT INTO public.announcements (title, content) VALUES
  ('Welcome to My Frame!', 'This is your first announcement. Check back for updates.')
ON CONFLICT DO NOTHING;

-- 5. Tokens/Swap table
CREATE TABLE IF NOT EXISTS public.tokens (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  address TEXT NOT NULL UNIQUE,
  chain_id BIGINT DEFAULT 8453, -- Base
  decimals INT DEFAULT 18,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read tokens"
  ON public.tokens FOR SELECT
  USING (TRUE);

-- Insert Base chain tokens
INSERT INTO public.tokens (name, symbol, address, chain_id, decimals) VALUES
  ('Ether', 'ETH', '0x0000000000000000000000000000000000000000', 8453, 18),
  ('USDC', 'USDC', '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 8453, 6),
  ('DEGEN', 'DEGEN', '0x4ed4E862860beD51a9570b96d89aF5E1B0Efdefe', 8453, 18)
ON CONFLICT (address) DO NOTHING;

-- 6. Polls / Voting table
CREATE TABLE IF NOT EXISTS public.polls (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  creator_fid BIGINT REFERENCES public.users(fid),
  options JSONB NOT NULL, -- ['Option A', 'Option B', ...]
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read polls"
  ON public.polls FOR SELECT
  USING (TRUE);
CREATE POLICY "Anyone can create polls"
  ON public.polls FOR INSERT
  WITH CHECK (TRUE);

-- 7. Poll votes
CREATE TABLE IF NOT EXISTS public.poll_votes (
  id BIGSERIAL PRIMARY KEY,
  poll_id BIGINT REFERENCES public.polls(id) ON DELETE CASCADE,
  fid BIGINT REFERENCES public.users(fid),
  option_index INT NOT NULL,
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, fid)
);

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read votes"
  ON public.poll_votes FOR SELECT
  USING (TRUE);
CREATE POLICY "Anyone can vote"
  ON public.poll_votes FOR INSERT
  WITH CHECK (TRUE);

-- 8. Swap transactions log
CREATE TABLE IF NOT EXISTS public.swap_logs (
  id BIGSERIAL PRIMARY KEY,
  fid BIGINT REFERENCES public.users(fid),
  from_token TEXT,
  to_token TEXT,
  from_amount TEXT,
  to_amount TEXT,
  tx_hash TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.swap_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own swaps"
  ON public.swap_logs FOR SELECT
  USING (TRUE);
CREATE POLICY "Anyone can insert swap logs"
  ON public.swap_logs FOR INSERT
  WITH CHECK (TRUE);
