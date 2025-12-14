-- Migration: add `series` column to cash_sessions to distinguish sessions by POS series

ALTER TABLE IF EXISTS cash_sessions
  ADD COLUMN IF NOT EXISTS series TEXT;

-- Optional index for quick filtering by series
-- CREATE INDEX IF NOT EXISTS idx_cash_sessions_series ON cash_sessions (series);
