-- ========================================
-- LandConnect — Database Schema
-- Run this in Supabase SQL Editor
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =====================
-- ENUM Types
-- =====================
CREATE TYPE user_role AS ENUM ('landowner', 'investor', 'admin');
CREATE TYPE kyc_status AS ENUM ('not_submitted', 'pending', 'approved', 'rejected');
CREATE TYPE project_type AS ENUM ('turf', 'office', 'warehouse', 'ev_station', 'solar', 'parking', 'marriage_hall', 'coworking', 'other');
CREATE TYPE listing_status AS ENUM ('draft', 'active', 'funded', 'completed');
CREATE TYPE media_type AS ENUM ('image', 'video', 'document');
CREATE TYPE proposal_status AS ENUM ('pending', 'negotiating', 'accepted', 'rejected');
CREATE TYPE transaction_status AS ENUM ('pending', 'confirmed', 'failed');
CREATE TYPE payout_status AS ENUM ('pending', 'paid');
CREATE TYPE secondary_listing_status AS ENUM ('open', 'sold', 'cancelled');
CREATE TYPE notification_type AS ENUM (
  'proposal_received', 'proposal_accepted', 'proposal_rejected',
  'funds_confirmed', 'token_transferred', 'new_message',
  'revenue_distribution', 'secondary_sold', 'kyc_approved', 'kyc_rejected', 'system'
);

-- =====================
-- Users & Profiles
-- =====================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'investor',
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  kyc_status kyc_status NOT NULL DEFAULT 'not_submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  location VARCHAR(255),
  profile_image_url TEXT,
  total_investments INTEGER NOT NULL DEFAULT 0,
  total_listings INTEGER NOT NULL DEFAULT 0
);

-- =====================
-- Listings
-- =====================
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(500) NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  plot_size_sqft NUMERIC(12, 2) NOT NULL,
  market_value NUMERIC(15, 2) NOT NULL,
  investment_required NUMERIC(15, 2) NOT NULL,
  expected_returns NUMERIC(8, 2) NOT NULL DEFAULT 0,
  timeline_months INTEGER NOT NULL,
  project_type project_type NOT NULL DEFAULT 'other',
  status listing_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE listing_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type media_type NOT NULL,
  label VARCHAR(255)
);

CREATE TABLE listing_amenities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  amenity_name VARCHAR(255) NOT NULL
);

-- =====================
-- Tokens & Holdings
-- =====================
CREATE TABLE tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID UNIQUE NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  total_supply INTEGER NOT NULL,
  token_value NUMERIC(15, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE token_holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  holder_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- Investment Proposals & Transactions
-- =====================
CREATE TABLE investment_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  proposed_amount NUMERIC(15, 2) NOT NULL,
  proposed_tokens INTEGER NOT NULL,
  proposed_ownership_pct NUMERIC(6, 2) NOT NULL,
  status proposal_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES investment_proposals(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL,
  tokens_transferred INTEGER NOT NULL,
  status transaction_status NOT NULL DEFAULT 'pending',
  confirmed_at TIMESTAMPTZ
);

-- =====================
-- Cap Table
-- =====================
CREATE TABLE cap_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  stakeholder_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tokens_held INTEGER NOT NULL DEFAULT 0,
  ownership_pct NUMERIC(6, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(listing_id, stakeholder_id)
);

-- =====================
-- Revenue Distribution
-- =====================
CREATE TABLE revenue_distributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  total_revenue NUMERIC(15, 2) NOT NULL,
  distribution_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  per_token_amount NUMERIC(15, 4) NOT NULL
);

CREATE TABLE revenue_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  distribution_id UUID NOT NULL REFERENCES revenue_distributions(id) ON DELETE CASCADE,
  stakeholder_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL,
  status payout_status NOT NULL DEFAULT 'pending'
);

-- =====================
-- Secondary Market
-- =====================
CREATE TABLE secondary_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_holding_id UUID NOT NULL REFERENCES token_holdings(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ask_price_per_token NUMERIC(15, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  status secondary_listing_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE secondary_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  secondary_listing_id UUID NOT NULL REFERENCES secondary_listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  total_price NUMERIC(15, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- Chat
-- =====================
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  landowner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(listing_id, landowner_id, investor_id)
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- Notifications
-- =====================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- Indexes
-- =====================
CREATE INDEX idx_listings_owner ON listings(owner_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_project_type ON listings(project_type);
CREATE INDEX idx_listing_media_listing ON listing_media(listing_id);
CREATE INDEX idx_token_holdings_holder ON token_holdings(holder_id);
CREATE INDEX idx_token_holdings_token ON token_holdings(token_id);
CREATE INDEX idx_proposals_listing ON investment_proposals(listing_id);
CREATE INDEX idx_proposals_investor ON investment_proposals(investor_id);
CREATE INDEX idx_transactions_listing ON transactions(listing_id);
CREATE INDEX idx_cap_table_listing ON cap_table(listing_id);
CREATE INDEX idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX idx_chat_rooms_landowner ON chat_rooms(landowner_id);
CREATE INDEX idx_chat_rooms_investor ON chat_rooms(investor_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX idx_secondary_listings_status ON secondary_listings(status);

-- =====================
-- Enable Realtime for tables
-- =====================
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE listings;
ALTER PUBLICATION supabase_realtime ADD TABLE investment_proposals;
