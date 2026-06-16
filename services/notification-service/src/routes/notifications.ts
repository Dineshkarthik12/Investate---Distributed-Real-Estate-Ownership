import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { verifyJWT, optionalJWT } from '../middleware/auth';

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
const resend = new Resend(process.env.RESEND_API_KEY || '');
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@landconnect.app';

const router = Router();

// Critical events that should also trigger email
const EMAIL_EVENTS = ['proposal_accepted', 'token_transferred', 'revenue_distribution', 'funds_confirmed'];

// POST /notifications — create notification (called internally by other services)
router.post('/notifications', optionalJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id, type, title, body } = req.body;

    if (!user_id || !type || !title || !body) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    // Save to DB
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({ user_id, type, title, body, read: false })
      .select()
      .single();

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to create notification' });
      return;
    }

    // Send email for critical events
    if (EMAIL_EVENTS.includes(type)) {
      try {
        const { data: user } = await supabase
          .from('users')
          .select('email, full_name')
          .eq('id', user_id)
          .single();

        if (user) {
          await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: title,
            html: `
              <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="background: linear-gradient(135deg, #f8fdf5, #e8f5e1); border-radius: 16px; padding: 32px;">
                  <h1 style="color: #2d5016; margin: 0 0 16px;">${title}</h1>
                  <p style="color: #4a6b3a; font-size: 16px; line-height: 1.6;">Hi ${user.full_name},</p>
                  <p style="color: #4a6b3a; font-size: 16px; line-height: 1.6;">${body}</p>
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" 
                     style="display: inline-block; background: #4a8c2a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
                    View Details
                  </a>
                </div>
                <p style="color: #888; font-size: 12px; text-align: center; margin-top: 24px;">
                  LandConnect — Connecting Land Owners with Investors
                </p>
              </div>
            `,
          });
        }
      } catch (emailErr) {
        console.error('Email send error:', emailErr);
        // Don't fail the notification if email fails
      }
    }

    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /notifications — get user's notifications
router.get('/notifications', verifyJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unread === 'true';
    const from = (page - 1) * limit;

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user!.userId);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
      return;
    }

    res.json({ success: true, data, total: count, page, limit });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /notifications/:id/read — mark notification as read
router.patch('/notifications/:id/read', verifyJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user!.userId);

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /notifications/read-all — mark all as read
router.patch('/notifications/read-all', verifyJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', req.user!.userId)
      .eq('read', false);

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /notifications/unread-count — get unread count
router.get('/notifications/unread-count', verifyJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user!.userId)
      .eq('read', false);

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to get count' });
      return;
    }

    res.json({ success: true, data: { count: count || 0 } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
