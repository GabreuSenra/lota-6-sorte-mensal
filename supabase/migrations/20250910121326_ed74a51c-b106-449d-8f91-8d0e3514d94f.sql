-- Add bet_price column to contests table
ALTER TABLE public.contests 
ADD COLUMN bet_price numeric NOT NULL DEFAULT 5.00;

-- Add comment explaining the column
COMMENT ON COLUMN public.contests.bet_price IS 'Price per bet for this contest in reais';