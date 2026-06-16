import { Router, Request, Response } from 'express';
import { createSecondaryListingSchema, buySecondarySchema } from '@landconnect/shared';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { verifyJWT, requireRole } from '../middleware/auth';

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
const TOKEN_SERVICE_URL = process.env.TOKEN_SERVICE_URL || 'http://localhost:3003';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007';
const router = Router();

// POST /secondary — list tokens for sale
router.post('/secondary', verifyJWT, requireRole('investor'), async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createSecondaryListingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const { token_holding_id, ask_price_per_token, quantity } = parsed.data;

    // Verify holding ownership and quantity
    const { data: holding } = await supabase
      .from('token_holdings')
      .select('*')
      .eq('id', token_holding_id)
      .eq('holder_id', req.user!.userId)
      .single();

    if (!holding || holding.quantity < quantity) {
      res.status(400).json({ success: false, error: 'Insufficient tokens or not your holding' });
      return;
    }

    const { data: listing, error } = await supabase
      .from('secondary_listings')
      .insert({
        token_holding_id,
        seller_id: req.user!.userId,
        ask_price_per_token,
        quantity,
        status: 'open',
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to create secondary listing' });
      return;
    }

    res.status(201).json({ success: true, data: listing });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /secondary — browse open secondary listings
router.get('/secondary', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const from = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('secondary_listings')
      .select(`
        *,
        users!seller_id(full_name),
        token_holdings!token_holding_id(
          tokens(*, listings(title, location, project_type))
        )
      `, { count: 'exact' })
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch secondary listings' });
      return;
    }

    res.json({ success: true, data, total: count, page, limit });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /secondary/:id/buy — buy from secondary market
router.post('/secondary/:id/buy', verifyJWT, requireRole('investor'), async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = buySecondarySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const { quantity } = parsed.data;

    const { data: secondaryListing } = await supabase
      .from('secondary_listings')
      .select('*, token_holdings!token_holding_id(token_id, tokens(listing_id))')
      .eq('id', req.params.id)
      .eq('status', 'open')
      .single();

    if (!secondaryListing) {
      res.status(404).json({ success: false, error: 'Listing not found or not open' });
      return;
    }

    if (secondaryListing.seller_id === req.user!.userId) {
      res.status(400).json({ success: false, error: 'Cannot buy your own listing' });
      return;
    }

    if (quantity > secondaryListing.quantity) {
      res.status(400).json({ success: false, error: 'Insufficient quantity available' });
      return;
    }

    const totalPrice = quantity * secondaryListing.ask_price_per_token;
    const listingId = (secondaryListing as any).token_holdings?.tokens?.listing_id;

    // Transfer tokens via token-service
    try {
      const authHeader = req.headers.authorization || '';
      await axios.post(`${TOKEN_SERVICE_URL}/transfer`, {
        from_user_id: secondaryListing.seller_id,
        to_user_id: req.user!.userId,
        listing_id: listingId,
        quantity,
      }, { headers: { Authorization: authHeader } });
    } catch {
      res.status(500).json({ success: false, error: 'Token transfer failed' });
      return;
    }

    // Record secondary transaction
    await supabase.from('secondary_transactions').insert({
      secondary_listing_id: req.params.id,
      buyer_id: req.user!.userId,
      quantity,
      total_price: totalPrice,
    });

    // Update secondary listing status
    const remainingQty = secondaryListing.quantity - quantity;
    if (remainingQty === 0) {
      await supabase.from('secondary_listings').update({ status: 'sold' }).eq('id', req.params.id);
    } else {
      await supabase.from('secondary_listings').update({ quantity: remainingQty }).eq('id', req.params.id);
    }

    // Notify seller
    try {
      await axios.post(`${NOTIFICATION_SERVICE_URL}/notifications`, {
        user_id: secondaryListing.seller_id,
        type: 'secondary_sold',
        title: 'Tokens Sold!',
        body: `${quantity} tokens sold for ₹${totalPrice.toLocaleString()}`,
      });
    } catch {}

    res.json({ success: true, message: 'Purchase successful', data: { quantity, totalPrice } });
  } catch (error) {
    console.error('Buy secondary error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /secondary/:id — cancel listing
router.delete('/secondary/:id', verifyJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: listing } = await supabase
      .from('secondary_listings')
      .select('seller_id, status')
      .eq('id', req.params.id)
      .single();

    if (!listing || listing.seller_id !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    if (listing.status !== 'open') {
      res.status(400).json({ success: false, error: 'Can only cancel open listings' });
      return;
    }

    await supabase.from('secondary_listings').update({ status: 'cancelled' }).eq('id', req.params.id);
    res.json({ success: true, message: 'Listing cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
