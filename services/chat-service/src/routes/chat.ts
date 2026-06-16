import { Router, Request, Response } from 'express';
import { sendMessageSchema } from '@landconnect/shared';
import { createClient } from '@supabase/supabase-js';
import { verifyJWT } from '../middleware/auth';

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
const router = Router();

// POST /rooms — create or return existing chat room
router.post('/rooms', verifyJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const { listing_id, other_user_id } = req.body;

    if (!listing_id || !other_user_id) {
      res.status(400).json({ success: false, error: 'listing_id and other_user_id required' });
      return;
    }

    // Determine who is landowner and who is investor
    const { data: listing } = await supabase
      .from('listings')
      .select('owner_id')
      .eq('id', listing_id)
      .single();

    if (!listing) {
      res.status(404).json({ success: false, error: 'Listing not found' });
      return;
    }

    let landowner_id: string, investor_id: string;
    if (listing.owner_id === req.user!.userId) {
      landowner_id = req.user!.userId;
      investor_id = other_user_id;
    } else {
      landowner_id = listing.owner_id;
      investor_id = req.user!.userId;
    }

    // Check for existing room
    const { data: existingRoom } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('listing_id', listing_id)
      .eq('landowner_id', landowner_id)
      .eq('investor_id', investor_id)
      .single();

    if (existingRoom) {
      res.json({ success: true, data: existingRoom });
      return;
    }

    // Create new room
    const { data: room, error } = await supabase
      .from('chat_rooms')
      .insert({ listing_id, landowner_id, investor_id })
      .select()
      .single();

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to create room' });
      return;
    }

    res.status(201).json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /rooms — list all rooms for current user
router.get('/rooms', verifyJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select(`
        *,
        listings!listing_id(title, project_type),
        landowner:users!landowner_id(full_name, email),
        investor:users!investor_id(full_name, email)
      `)
      .or(`landowner_id.eq.${req.user!.userId},investor_id.eq.${req.user!.userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch rooms' });
      return;
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /rooms/:id/messages — paginated messages
router.get('/rooms/:id/messages', verifyJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const from = (page - 1) * limit;

    // Verify user is in the room
    const { data: room } = await supabase
      .from('chat_rooms')
      .select('landowner_id, investor_id')
      .eq('id', req.params.id)
      .single();

    if (!room || (room.landowner_id !== req.user!.userId && room.investor_id !== req.user!.userId)) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    const { data, error, count } = await supabase
      .from('chat_messages')
      .select('*, users!sender_id(full_name)', { count: 'exact' })
      .eq('room_id', req.params.id)
      .order('created_at', { ascending: true })
      .range(from, from + limit - 1);

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch messages' });
      return;
    }

    res.json({ success: true, data, total: count, page, limit });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /rooms/:id/messages — send a message
router.post('/rooms/:id/messages', verifyJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = sendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    // Verify user is in the room
    const { data: room } = await supabase
      .from('chat_rooms')
      .select('landowner_id, investor_id')
      .eq('id', req.params.id)
      .single();

    if (!room || (room.landowner_id !== req.user!.userId && room.investor_id !== req.user!.userId)) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: req.params.id,
        sender_id: req.user!.userId,
        content: parsed.data.content,
      })
      .select('*, users!sender_id(full_name)')
      .single();

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to send message' });
      return;
    }

    // Supabase Realtime will automatically broadcast insertions to subscribed clients

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /rooms/:id/messages/read — mark messages as read
router.patch('/rooms/:id/messages/read', verifyJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    await supabase
      .from('chat_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('room_id', req.params.id)
      .neq('sender_id', req.user!.userId)
      .is('read_at', null);

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
