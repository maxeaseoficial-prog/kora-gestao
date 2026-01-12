-- Add currency column to services table
ALTER TABLE public.services 
ADD COLUMN currency text NOT NULL DEFAULT 'BRL' CHECK (currency IN ('BRL', 'USD', 'EUR'));