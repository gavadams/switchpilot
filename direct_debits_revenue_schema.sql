-- Direct Debits Revenue Schema for SwitchPilot
-- Execute this SQL in Supabase SQL Editor AFTER removing old table

CREATE TABLE public.direct_debits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  switch_id UUID REFERENCES public.user_switches(id) ON DELETE CASCADE, -- Link to specific switch
  provider VARCHAR NOT NULL, -- 'switchpilot', 'charity_unicef', 'charity_alzheimers', etc.
  charity_name VARCHAR, -- Only for charity DDs
  amount DECIMAL(10,2) NOT NULL,
  frequency VARCHAR DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'one-time')),
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'completed')),
  setup_date DATE DEFAULT CURRENT_DATE,
  next_collection_date DATE,
  last_collection_date DATE,
  auto_cancel_after_switch BOOLEAN DEFAULT true, -- Cancel DD after switch completes
  total_collected DECIMAL(10,2) DEFAULT 0,
  stripe_payment_method_id VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.direct_debits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own direct debits"
  ON public.direct_debits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own direct debits"
  ON public.direct_debits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own direct debits"
  ON public.direct_debits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own direct debits"
  ON public.direct_debits FOR DELETE
  USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_direct_debits_user_id ON public.direct_debits(user_id);
CREATE INDEX idx_direct_debits_switch_id ON public.direct_debits(switch_id);
CREATE INDEX idx_direct_debits_status ON public.direct_debits(status);
CREATE INDEX idx_direct_debits_provider ON public.direct_debits(provider);
