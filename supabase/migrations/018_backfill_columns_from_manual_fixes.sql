-- ============================================
-- Casa Lis POS - Backfill Columns From Manual Fixes
-- These columns were applied manually to production and
-- verified present on 2026-11-10. This migration backfills
-- the ledger so `db push` records reality. All statements
-- are idempotent by design (IF NOT EXISTS).
-- ============================================

ALTER TABLE employees ADD COLUMN IF NOT EXISTS terminal_id TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS size_group_id TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(10,2) NOT NULL DEFAULT 0;
