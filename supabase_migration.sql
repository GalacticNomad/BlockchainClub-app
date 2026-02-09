-- ============================================
-- Blockchain Club - Supabase Database Schema
-- Run this SQL in the Supabase SQL Editor
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. Moderators table - whitelisted wallets
-- ==========================================
CREATE TABLE moderators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL DEFAULT 'Moderator',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast wallet lookups
CREATE INDEX idx_moderators_wallet ON moderators(wallet_address);

-- ==========================================
-- 2. Activities table - club tasks/activities
-- ==========================================
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    token_reward INTEGER NOT NULL DEFAULT 0,
    category TEXT NOT NULL DEFAULT 'general',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by TEXT NOT NULL REFERENCES moderators(wallet_address),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activities_active ON activities(is_active);
CREATE INDEX idx_activities_category ON activities(category);

-- ==========================================
-- 3. Submissions table - member task submissions
-- ==========================================
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    proof_text TEXT NOT NULL DEFAULT '',
    proof_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewer_wallet TEXT,
    review_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_wallet ON submissions(wallet_address);
CREATE INDEX idx_submissions_activity ON submissions(activity_id);

-- ==========================================
-- 4. Token distributions - on-chain transfer log
-- ==========================================
CREATE TABLE token_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    from_wallet TEXT NOT NULL,
    to_wallet TEXT NOT NULL,
    amount INTEGER NOT NULL,
    tx_signature TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_distributions_submission ON token_distributions(submission_id);
CREATE INDEX idx_distributions_to ON token_distributions(to_wallet);

-- ==========================================
-- Insert your wallet as the first moderator
-- Replace with your actual Solana wallet address!
-- ==========================================
-- INSERT INTO moderators (wallet_address, name) VALUES ('YOUR_WALLET_ADDRESS_HERE', 'Admin');

-- ==========================================
-- (Optional) Seed some sample activities
-- ==========================================
-- INSERT INTO activities (title, description, token_reward, category, created_by) VALUES
--   ('Social Media Post', 'Share about Blockchain Club on Twitter/X with #BlockchainClub', 10, 'social', 'YOUR_WALLET_ADDRESS_HERE'),
--   ('Organize an Event', 'Plan and host a club event or workshop', 50, 'event', 'YOUR_WALLET_ADDRESS_HERE'),
--   ('Contribute to a Project', 'Make a meaningful contribution to a club project', 30, 'contribution', 'YOUR_WALLET_ADDRESS_HERE'),
--   ('Attend a Meeting', 'Attend a weekly Blockchain Club meeting', 5, 'attendance', 'YOUR_WALLET_ADDRESS_HERE');
