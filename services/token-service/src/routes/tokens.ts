import { Router, Request, Response } from 'express';
import { createTokenSchema } from '@landconnect/shared';
import { createClient } from '@supabase/supabase-js';
import { verifyJWT, requireRole } from '../middleware/auth';

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
const router = Router();

// POST /listings/:id/tokens — create tokens for a listing
router.post('/listings/:id/tokens', verifyJWT, requireRole('landowner'), async (req: Request, res: Response): Promise<void> => {
  try {
    const listingId = req.params.id;
    const parsed = createTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    // Verify listing ownership
    const { data: listing } = await supabase
      .from('listings')
      .select('owner_id')
      .eq('id', listingId)
      .single();

    if (!listing || listing.owner_id !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    // Check if tokens already exist
    const { data: existingToken } = await supabase
      .from('tokens')
      .select('id')
      .eq('listing_id', listingId)
      .single();

    if (existingToken) {
      res.status(409).json({ success: false, error: 'Tokens already created for this listing' });
      return;
    }

    // Check KYC
    const { data: user } = await supabase
      .from('users')
      .select('kyc_status')
      .eq('id', req.user!.userId)
      .single();

    if (user?.kyc_status !== 'approved') {
      res.status(403).json({ success: false, error: 'KYC approval required' });
      return;
    }

    const { total_supply, token_value } = parsed.data;

    // Create token
    const { data: token, error } = await supabase
      .from('tokens')
      .insert({ listing_id: listingId, total_supply, token_value })
      .select()
      .single();

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to create tokens' });
      return;
    }

    // Assign all tokens to landowner initially
    await supabase.from('token_holdings').insert({
      token_id: token.id,
      holder_id: req.user!.userId,
      quantity: total_supply,
    });

    // Create cap table entry
    await supabase.from('cap_table').insert({
      listing_id: listingId,
      stakeholder_id: req.user!.userId,
      tokens_held: total_supply,
      ownership_pct: 100,
    });

    res.status(201).json({ success: true, data: token });
  } catch (error) {
    console.error('Create tokens error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /listings/:id/captable — full cap table
router.get('/listings/:id/captable', async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('cap_table')
      .select('*, users!stakeholder_id(full_name, email)')
      .eq('listing_id', req.params.id)
      .order('ownership_pct', { ascending: false });

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch cap table' });
      return;
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /users/:id/holdings — all holdings for a user
router.get('/users/:id/holdings', verifyJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;

    // Users can only see their own holdings unless admin
    if (req.user!.userId !== userId && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    const { data, error } = await supabase
      .from('token_holdings')
      .select(`
        *,
        tokens(*, listings(id, title, location, project_type, status, market_value, investment_required))
      `)
      .eq('holder_id', userId)
      .gt('quantity', 0);

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch holdings' });
      return;
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Internal: Transfer tokens (called by investment-service)
router.post('/transfer', verifyJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const { from_user_id, to_user_id, listing_id, quantity } = req.body;

    // Get token for listing
    const { data: token } = await supabase
      .from('tokens')
      .select('id, total_supply')
      .eq('listing_id', listing_id)
      .single();

    if (!token) {
      res.status(404).json({ success: false, error: 'Token not found' });
      return;
    }

    // Get sender's holding
    const { data: senderHolding } = await supabase
      .from('token_holdings')
      .select('*')
      .eq('token_id', token.id)
      .eq('holder_id', from_user_id)
      .single();

    if (!senderHolding || senderHolding.quantity < quantity) {
      res.status(400).json({ success: false, error: 'Insufficient tokens' });
      return;
    }

    // Deduct from sender
    await supabase
      .from('token_holdings')
      .update({ quantity: senderHolding.quantity - quantity })
      .eq('id', senderHolding.id);

    // Add to receiver (create or update)
    const { data: receiverHolding } = await supabase
      .from('token_holdings')
      .select('*')
      .eq('token_id', token.id)
      .eq('holder_id', to_user_id)
      .single();

    if (receiverHolding) {
      await supabase
        .from('token_holdings')
        .update({ quantity: receiverHolding.quantity + quantity })
        .eq('id', receiverHolding.id);
    } else {
      await supabase
        .from('token_holdings')
        .insert({ token_id: token.id, holder_id: to_user_id, quantity });
    }

    // Update cap table
    const ownershipPct = (quantity / token.total_supply) * 100;

    // Update sender cap table
    const senderNewQty = senderHolding.quantity - quantity;
    const senderPct = (senderNewQty / token.total_supply) * 100;
    await supabase
      .from('cap_table')
      .upsert({
        listing_id,
        stakeholder_id: from_user_id,
        tokens_held: senderNewQty,
        ownership_pct: senderPct,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'listing_id,stakeholder_id' });

    // Update receiver cap table
    const receiverNewQty = (receiverHolding?.quantity || 0) + quantity;
    const receiverPct = (receiverNewQty / token.total_supply) * 100;
    await supabase
      .from('cap_table')
      .upsert({
        listing_id,
        stakeholder_id: to_user_id,
        tokens_held: receiverNewQty,
        ownership_pct: receiverPct,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'listing_id,stakeholder_id' });

    res.json({ success: true, message: 'Tokens transferred successfully' });
  } catch (error) {
    console.error('Token transfer error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
