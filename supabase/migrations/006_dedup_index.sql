-- ============================================================================
-- Deduplication — prevent duplicate transaction imports
-- ============================================================================

-- Unique constraint on (user_id, date, amount, description) to enable
-- INSERT ... ON CONFLICT DO NOTHING for deduplication during CSV upload.
-- This allows re-uploading the same file without creating duplicates.
-- Uses coalesce because NULL != NULL in unique indexes.

create unique index idx_transactions_dedup
  on transactions(user_id, date, amount, coalesce(description, ''));
