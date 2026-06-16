// ========================================
// LandConnect — Shared Type Definitions
// ========================================

// === Enums ===
export type UserRole = 'landowner' | 'investor' | 'admin';
export type KycStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';
export type ProjectType = 'turf' | 'office' | 'warehouse' | 'ev_station' | 'solar' | 'parking' | 'marriage_hall' | 'coworking' | 'other';
export type ListingStatus = 'draft' | 'active' | 'funded' | 'completed';
export type MediaType = 'image' | 'video' | 'document';
export type ProposalStatus = 'pending' | 'negotiating' | 'accepted' | 'rejected';
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';
export type PayoutStatus = 'pending' | 'paid';
export type SecondaryListingStatus = 'open' | 'sold' | 'cancelled';

// === User ===
export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  kyc_status: KycStatus;
  created_at: string;
}

export interface Profile {
  user_id: string;
  bio: string | null;
  location: string | null;
  profile_image_url: string | null;
  total_investments: number;
  total_listings: number;
}

// === Listing ===
export interface Listing {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  plot_size_sqft: number;
  market_value: number;
  investment_required: number;
  expected_returns: number;
  timeline_months: number;
  project_type: ProjectType;
  status: ListingStatus;
  created_at: string;
}

export interface ListingMedia {
  id: string;
  listing_id: string;
  url: string;
  type: MediaType;
  label: string | null;
}

export interface ListingAmenity {
  id: string;
  listing_id: string;
  amenity_name: string;
}

// === Token ===
export interface Token {
  id: string;
  listing_id: string;
  total_supply: number;
  token_value: number;
  created_at: string;
}

export interface TokenHolding {
  id: string;
  token_id: string;
  holder_id: string;
  quantity: number;
  acquired_at: string;
}

// === Investment ===
export interface InvestmentProposal {
  id: string;
  listing_id: string;
  investor_id: string;
  proposed_amount: number;
  proposed_tokens: number;
  proposed_ownership_pct: number;
  status: ProposalStatus;
  created_at: string;
}

export interface Transaction {
  id: string;
  proposal_id: string;
  investor_id: string;
  listing_id: string;
  amount: number;
  tokens_transferred: number;
  status: TransactionStatus;
  confirmed_at: string | null;
}

// === Cap Table ===
export interface CapTableEntry {
  id: string;
  listing_id: string;
  stakeholder_id: string;
  tokens_held: number;
  ownership_pct: number;
  updated_at: string;
}

// === Revenue ===
export interface RevenueDistribution {
  id: string;
  listing_id: string;
  total_revenue: number;
  distribution_date: string;
  per_token_amount: number;
}

export interface RevenuePayout {
  id: string;
  distribution_id: string;
  stakeholder_id: string;
  amount: number;
  status: PayoutStatus;
}

// === Secondary Market ===
export interface SecondaryListing {
  id: string;
  token_holding_id: string;
  seller_id: string;
  ask_price_per_token: number;
  quantity: number;
  status: SecondaryListingStatus;
  created_at: string;
}

export interface SecondaryTransaction {
  id: string;
  secondary_listing_id: string;
  buyer_id: string;
  quantity: number;
  total_price: number;
  created_at: string;
}

// === Chat ===
export interface ChatRoom {
  id: string;
  listing_id: string;
  landowner_id: string;
  investor_id: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

// === Notification ===
export type NotificationType =
  | 'proposal_received'
  | 'proposal_accepted'
  | 'proposal_rejected'
  | 'funds_confirmed'
  | 'token_transferred'
  | 'new_message'
  | 'revenue_distribution'
  | 'secondary_sold'
  | 'kyc_approved'
  | 'kyc_rejected'
  | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

// === API Response ===
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// === JWT Payload ===
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// === Auth DTOs ===
export interface RegisterDto {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  phone?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
