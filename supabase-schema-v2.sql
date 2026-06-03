-- FrameOS Schema v2 — Solana + Options Vault
-- Run this in Supabase SQL Editor after supabase-schema.sql

-- ============================
-- 1. Extend swap_logs for Solana
-- ============================
ALTER TABLE public.swap_logs ADD COLUMN IF NOT EXISTS chain_id BIGINT DEFAULT 8453;
ALTER TABLE public.swap_logs ADD COLUMN IF NOT EXISTS wallet_type TEXT DEFAULT 'evm'; -- 'evm' | 'solana'
ALTER TABLE public.swap_logs ADD COLUMN IF NOT EXISTS explorer_url TEXT;

-- ============================
-- 2. Options Vaults
-- ============================
CREATE TABLE IF NOT EXISTS public.options_vaults (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  strike_price TEXT NOT NULL,
  maturity BIGINT NOT NULL,
  chain_id BIGINT DEFAULT 8453,
  oracle_address TEXT,
  p_token_address TEXT,
  n_token_address TEXT,
  vault_address TEXT NOT NULL UNIQUE,
  total_deposits TEXT DEFAULT '0',
  settled BOOLEAN DEFAULT FALSE,
  settlement_price TEXT,
  creator_fid BIGINT REFERENCES public.users(fid),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

ALTER TABLE public.options_vaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read vaults"
  ON public.options_vaults FOR SELECT
  USING (TRUE);

CREATE POLICY "Anyone can insert vaults"
  ON public.options_vaults FOR INSERT
  WITH CHECK (TRUE);

-- ============================
-- 3. Options Vault Deposits
-- ============================
CREATE TABLE IF NOT EXISTS public.options_deposits (
  id BIGSERIAL PRIMARY KEY,
  vault_id BIGINT REFERENCES public.options_vaults(id) ON DELETE CASCADE,
  fid BIGINT REFERENCES public.users(fid),
  address TEXT NOT NULL,
  amount TEXT NOT NULL,
  p_minted TEXT,
  n_minted TEXT,
  redeemed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.options_deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read deposits"
  ON public.options_deposits FOR SELECT
  USING (TRUE);

CREATE POLICY "Anyone can insert deposits"
  ON public.options_deposits FOR INSERT
  WITH CHECK (TRUE);

-- ============================
-- 4. Token Launches (on-chain tracking)
-- ============================
CREATE TABLE IF NOT EXISTS public.token_launches (
  id BIGSERIAL PRIMARY KEY,
  fid BIGINT REFERENCES public.users(fid),
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  token_address TEXT,
  chain_id BIGINT DEFAULT 8453,
  launch_type TEXT DEFAULT 'standard', -- 'standard' | 'clanker' | 'spl'
  tx_hash TEXT,
  explorer_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.token_launches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read token launches"
  ON public.token_launches FOR SELECT
  USING (TRUE);

CREATE POLICY "Anyone can insert token launches"
  ON public.token_launches FOR INSERT
  WITH CHECK (TRUE);
