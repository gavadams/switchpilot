-- Remove the previous direct_debits table to implement new schema
-- Execute this SQL in Supabase SQL Editor FIRST

DROP TABLE IF EXISTS public.direct_debits CASCADE;
