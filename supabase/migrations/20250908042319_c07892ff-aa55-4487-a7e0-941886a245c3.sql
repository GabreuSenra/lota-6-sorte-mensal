-- Create administrators table and update bet processing
BEGIN;

-- 1) Create administrators table (read-only)
CREATE TABLE public.administrators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on administrators table
ALTER TABLE public.administrators ENABLE ROW LEVEL SECURITY;

-- Only admins can view administrators table
CREATE POLICY "Only admins can view administrators" 
ON public.administrators 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.administrators a 
      WHERE a.user_id = auth.uid()
    )
  )
);

-- 2) Update bets chosen_numbers constraint to 6 numbers
ALTER TABLE public.bets DROP CONSTRAINT IF EXISTS bets_chosen_numbers_check;
ALTER TABLE public.bets ADD CONSTRAINT bets_chosen_numbers_check CHECK (array_length(chosen_numbers, 1) = 6);

-- 3) Add payment_id to transactions if not exists
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS payment_id TEXT;

-- Ensure payment_id is unique when present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'transactions_payment_id_key'
  ) THEN
    ALTER TABLE public.transactions
    ADD CONSTRAINT transactions_payment_id_key UNIQUE (payment_id);
  END IF;
END $$;

-- 4) Add winning_numbers to contests for storing results
ALTER TABLE public.contests ADD COLUMN IF NOT EXISTS winning_numbers INTEGER[];

-- 5) Create security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles p
    JOIN public.administrators a ON p.user_id = a.user_id
    WHERE p.user_id = user_uuid 
    AND p.role = 'admin'
  );
$$;

-- 6) Create RLS policies for admin operations on contests
CREATE POLICY "Admins can update contests" 
ON public.contests 
FOR UPDATE 
USING (public.is_admin());

-- 7) Update transaction policies for admin access
CREATE POLICY "Admins can view all pending withdrawals" 
ON public.transactions 
FOR SELECT 
USING (
  public.is_admin() 
  AND type = 'withdrawal' 
  AND status = 'pending'
);

CREATE POLICY "Admins can update withdrawal status" 
ON public.transactions 
FOR UPDATE 
USING (
  public.is_admin() 
  AND type = 'withdrawal'
);

COMMIT;