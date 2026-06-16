import { z } from 'zod';

// === Auth Schemas ===
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['landowner', 'investor']),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// === Listing Schemas ===
export const createListingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  location: z.string().min(3, 'Location is required'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  plot_size_sqft: z.number().positive('Plot size must be positive'),
  market_value: z.number().positive('Market value must be positive'),
  investment_required: z.number().positive('Investment required must be positive'),
  expected_returns: z.number().min(0, 'Expected returns cannot be negative'),
  timeline_months: z.number().int().positive('Timeline must be positive'),
  project_type: z.enum(['turf', 'office', 'warehouse', 'ev_station', 'solar', 'parking', 'marriage_hall', 'coworking', 'other']),
  amenities: z.array(z.string()).optional(),
});

export const updateListingSchema = createListingSchema.partial();

export const listingFilterSchema = z.object({
  project_type: z.enum(['turf', 'office', 'warehouse', 'ev_station', 'solar', 'parking', 'marriage_hall', 'coworking', 'other']).optional(),
  status: z.enum(['draft', 'active', 'funded', 'completed']).optional(),
  min_investment: z.coerce.number().optional(),
  max_investment: z.coerce.number().optional(),
  location: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
  search: z.string().optional(),
});

// === Token Schemas ===
export const createTokenSchema = z.object({
  total_supply: z.number().int().positive('Total supply must be positive'),
  token_value: z.number().positive('Token value must be positive'),
});

// === Investment Schemas ===
export const createProposalSchema = z.object({
  listing_id: z.string().uuid('Invalid listing ID'),
  proposed_amount: z.number().positive('Amount must be positive'),
  proposed_tokens: z.number().int().positive('Token count must be positive'),
  proposed_ownership_pct: z.number().min(0.01).max(100, 'Ownership percentage must be between 0.01 and 100'),
});

export const counterProposalSchema = z.object({
  proposed_amount: z.number().positive('Amount must be positive').optional(),
  proposed_tokens: z.number().int().positive('Token count must be positive').optional(),
  proposed_ownership_pct: z.number().min(0.01).max(100).optional(),
});

// === Chat Schemas ===
export const createRoomSchema = z.object({
  listing_id: z.string().uuid('Invalid listing ID'),
  other_user_id: z.string().uuid('Invalid user ID'),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
});

// === Marketplace Schemas ===
export const createSecondaryListingSchema = z.object({
  token_holding_id: z.string().uuid('Invalid token holding ID'),
  ask_price_per_token: z.number().positive('Price must be positive'),
  quantity: z.number().int().positive('Quantity must be positive'),
});

export const buySecondarySchema = z.object({
  quantity: z.number().int().positive('Quantity must be positive'),
});

// === Revenue Schemas ===
export const createDistributionSchema = z.object({
  listing_id: z.string().uuid('Invalid listing ID'),
  total_revenue: z.number().positive('Revenue must be positive'),
});

// === Profile Schemas ===
export const updateProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  location: z.string().max(200).optional(),
  phone: z.string().optional(),
});
