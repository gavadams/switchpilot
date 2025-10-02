-- Add Stripe customer ID to profiles table
ALTER TABLE public.profiles 
ADD COLUMN stripe_customer_id VARCHAR;

-- Add Stripe fields to direct_debits table
ALTER TABLE public.direct_debits
ADD COLUMN stripe_subscription_id VARCHAR,
ADD COLUMN stripe_customer_id VARCHAR;

-- Create payment history tracking table
CREATE TABLE public.dd_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  direct_debit_id UUID REFERENCES public.direct_debits(id) ON DELETE CASCADE,
  stripe_invoice_id VARCHAR,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for payment history
ALTER TABLE public.dd_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment history"
  ON public.dd_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.direct_debits 
      WHERE direct_debits.id = dd_payments.direct_debit_id 
      AND direct_debits.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert payment history"
  ON public.dd_payments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update payment history"
  ON public.dd_payments FOR UPDATE
  WITH CHECK (true);
