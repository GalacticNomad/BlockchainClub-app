-- ============================================
-- Blockchain Club - Row Level Security (RLS) Policies
-- Run this AFTER running supabase_migration.sql
-- ============================================

-- Enable RLS on all tables
ALTER TABLE moderators ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_distributions ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Read Policies (Public Data)
-- ==========================================

-- Anyone can read moderators (needed to check if wallet is a mod)
CREATE POLICY "Anyone can read moderators"
  ON moderators FOR SELECT
  USING (true);

-- Anyone can read active activities
CREATE POLICY "Anyone can read activities"
  ON activities FOR SELECT
  USING (true);

-- Users can read their own submissions
CREATE POLICY "Users can read own submissions"
  ON submissions FOR SELECT
  USING (true);

-- Anyone can read distributions (public record)
CREATE POLICY "Anyone can read distributions"
  ON token_distributions FOR SELECT
  USING (true);

-- ==========================================
-- Write Policies (Allow inserts via backend)
-- ==========================================

CREATE POLICY "Allow inserts via backend"
  ON activities FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow inserts via backend"
  ON submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow inserts via backend"
  ON token_distributions FOR INSERT
  WITH CHECK (true);