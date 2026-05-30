// Common types for the app

export type Announcement = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  is_active: boolean;
};

export type Token = {
  id: number;
  name: string;
  symbol: string;
  address: string;
  chain_id: number;
  decimals: number;
  logo_url: string | null;
  is_active: boolean;
};

export type Poll = {
  id: number;
  title: string;
  description: string | null;
  creator_fid: number;
  options: string[];
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
};

export type PollVote = {
  id: number;
  poll_id: number;
  fid: number;
  option_index: number;
  voted_at: string;
};

export type Notification = {
  id: number;
  fid: number;
  type: string;
  title: string | null;
  message: string | null;
  read: boolean;
  created_at: string;
};

export type SwapLog = {
  id: number;
  fid: number | null;
  from_token: string;
  to_token: string;
  from_amount: string;
  to_amount: string;
  tx_hash: string | null;
  status: string;
  created_at: string;
};

export type ActionCard = {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  href?: string;
  onClick?: () => void;
};
