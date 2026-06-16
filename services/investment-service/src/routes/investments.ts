import { Router, Request, Response } from 'express';
import { createProposalSchema, counterProposalSchema } from '@landconnect/shared';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { verifyJWT, requireRole } from '../middleware/auth';

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
const TOKEN_SERVICE_URL = process.env.TOKEN_SERVICE_URL || 'http://localhost:3003';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007';
const router = Router();

// Helper: notify
async function notify(userId: string, type: string, title: string, body: string, token?: string) {
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/notifications`, {
      user_id: userId, type, title, body,
    }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  } catch (err) {
    console.error('Notification failed:', err);
  }
}

// POST /proposals — investor submits a proposal
router.post('/proposals', verifyJWT, requireRole('investor'), async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createProposalSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    // Check KYC
    const { data: user } = await supabase
      .from('users')
      .select('kyc_status')
      .eq('id', req.user!.userId)
      .single();

    if (user?.kyc_status !== 'approved') {
      res.status(403).json({ success: false, error: 'KYC approval required to invest' });
      return;
    }

    const { listing_id, proposed_amount, proposed_tokens, proposed_ownership_pct } = parsed.data;

    // Check listing exists and is active
    const { data: listing } = await supabase
      .from('listings')
      .select('id, owner_id, status, title')
      .eq('id', listing_id)
      .single();

    if (!listing || listing.status !== 'active') {
      res.status(400).json({ success: false, error: 'Listing not available' });
      return;
    }

    const { data: proposal, error } = await supabase
      .from('investment_proposals')
      .insert({
        listing_id,
        investor_id: req.user!.userId,
        proposed_amount,
        proposed_tokens,
        proposed_ownership_pct,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to create proposal' });
      return;
    }

    // Notify landowner
    const authHeader = req.headers.authorization || '';
    await notify(listing.owner_id, 'proposal_received', 'New Investment Proposal',
      `You received a new proposal of ₹${proposed_amount.toLocaleString()} for "${listing.title}"`,
      authHeader.replace('Bearer ', ''));

    res.status(201).json({ success: true, data: proposal });
  } catch (error) {
    console.error('Create proposal error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /proposals/:id — counter-offer
router.patch('/proposals/:id', verifyJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: proposal } = await supabase
      .from('investment_proposals')
      .select('*, listings!listing_id(owner_id)')
      .eq('id', req.params.id)
      .single();

    if (!proposal) {
      res.status(404).json({ success: false, error: 'Proposal not found' });
      return;
    }

    // Both investor and landowner can counter-offer
    const isInvestor = proposal.investor_id === req.user!.userId;
    const isLandowner = (proposal as any).listings?.owner_id === req.user!.userId;

    if (!isInvestor && !isLandowner) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    const parsed = counterProposalSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const updateData: Record<string, unknown> = { ...parsed.data, status: 'negotiating' };

    const { data: updated, error } = await supabase
      .from('investment_proposals')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to update proposal' });
      return;
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /proposals/:id/accept — landowner accepts
router.patch('/proposals/:id/accept', verifyJWT, requireRole('landowner'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: proposal } = await supabase
      .from('investment_proposals')
      .select('*, listings!listing_id(owner_id, title)')
      .eq('id', req.params.id)
      .single();

    if (!proposal) {
      res.status(404).json({ success: false, error: 'Proposal not found' });
      return;
    }

    if ((proposal as any).listings?.owner_id !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    // Accept proposal
    await supabase
      .from('investment_proposals')
      .update({ status: 'accepted' })
      .eq('id', req.params.id);

    // Create pending transaction
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        proposal_id: req.params.id,
        investor_id: proposal.investor_id,
        listing_id: proposal.listing_id,
        amount: proposal.proposed_amount,
        tokens_transferred: proposal.proposed_tokens,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to create transaction' });
      return;
    }

    // Notify investor
    await notify(proposal.investor_id, 'proposal_accepted', 'Proposal Accepted!',
      `Your proposal for "${(proposal as any).listings?.title}" has been accepted. Please transfer funds.`);

    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /proposals/:id/reject — landowner rejects
router.patch('/proposals/:id/reject', verifyJWT, requireRole('landowner'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: proposal } = await supabase
      .from('investment_proposals')
      .select('*, listings!listing_id(owner_id)')
      .eq('id', req.params.id)
      .single();

    if (!proposal || (proposal as any).listings?.owner_id !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    await supabase
      .from('investment_proposals')
      .update({ status: 'rejected' })
      .eq('id', req.params.id);

    await notify(proposal.investor_id, 'proposal_rejected', 'Proposal Rejected',
      'Your investment proposal has been rejected.');

    res.json({ success: true, message: 'Proposal rejected' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /transactions/:id/confirm — confirm fund receipt + trigger token transfer
router.post('/transactions/:id/confirm', verifyJWT, requireRole('landowner'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*, listings!listing_id(owner_id)')
      .eq('id', req.params.id)
      .single();

    if (!transaction || (transaction as any).listings?.owner_id !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    if (transaction.status !== 'pending') {
      res.status(400).json({ success: false, error: 'Transaction not pending' });
      return;
    }

    // Trigger token transfer via token-service
    try {
      const authHeader = req.headers.authorization || '';
      await axios.post(`${TOKEN_SERVICE_URL}/transfer`, {
        from_user_id: req.user!.userId,
        to_user_id: transaction.investor_id,
        listing_id: transaction.listing_id,
        quantity: transaction.tokens_transferred,
      }, { headers: { Authorization: authHeader } });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Token transfer failed' });
      return;
    }

    // Update transaction status
    await supabase
      .from('transactions')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', req.params.id);

    // Notify investor
    await notify(transaction.investor_id, 'token_transferred', 'Tokens Received!',
      `${transaction.tokens_transferred} tokens have been transferred to your account.`);

    res.json({ success: true, message: 'Transaction confirmed and tokens transferred' });
  } catch (error) {
    console.error('Confirm transaction error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /listings/:id/proposals — landowner sees proposals for their listing
router.get('/listings/:id/proposals', verifyJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: listing } = await supabase
      .from('listings')
      .select('owner_id')
      .eq('id', req.params.id)
      .single();

    if (!listing || listing.owner_id !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    const { data, error } = await supabase
      .from('investment_proposals')
      .select('*, users!investor_id(full_name, email)')
      .eq('listing_id', req.params.id)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch proposals' });
      return;
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /proposals/my — investor's proposals
router.get('/proposals/my', verifyJWT, requireRole('investor'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('investment_proposals')
      .select('*, listings!listing_id(title, location, project_type, status)')
      .eq('investor_id', req.user!.userId)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch proposals' });
      return;
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /transactions/my — user's transactions
router.get('/transactions/my', verifyJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, listings!listing_id(title)')
      .eq('investor_id', req.user!.userId)
      .order('confirmed_at', { ascending: false });

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
      return;
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
