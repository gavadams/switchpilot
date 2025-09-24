-- Sample bank deals data for SwitchPilot
-- Run this in your Supabase SQL editor to populate the bank_deals table

INSERT INTO public.bank_deals (bank_name, reward_amount, requirements, expiry_date, min_pay_in, required_direct_debits, debit_card_transactions, time_to_payout) VALUES
('Lloyds Bank', 200.00, '{"switch_account": true, "maintain_balance": false}', '2025-12-31', 1500.00, 3, 0, '30 days'),
('First Direct', 175.00, '{"switch_account": true, "maintain_balance": true}', '2025-11-30', 1000.00, 5, 0, '60 days'),
('Halifax', 150.00, '{"switch_account": true, "maintain_balance": false}', '2026-01-15', 500.00, 2, 5, '45 days'),
('Nationwide', 125.00, '{"switch_account": true, "maintain_balance": false}', '2025-10-31', 1000.00, 2, 0, '30 days'),
('Santander', 130.00, '{"switch_account": true, "maintain_balance": true}', '2025-12-15', 800.00, 2, 3, '90 days');
