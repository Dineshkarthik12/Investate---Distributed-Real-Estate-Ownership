import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { registerSchema, loginSchema } from '@landconnect/shared';
import { supabase } from '../config/supabase';
import { verifyJWT } from '../middleware/auth';
import type { JwtPayload, TokenPair } from '@landconnect/shared';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';

function generateTokens(payload: Omit<JwtPayload, 'iat' | 'exp'>): TokenPair {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

// POST /register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const { email, password, full_name, role, phone } = parsed.data;

    // Check if email exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      res.status(409).json({ success: false, error: 'Email already registered' });
      return;
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({ email, password_hash, full_name, role, phone: phone || null })
      .select('id, email, role, full_name, kyc_status, created_at')
      .single();

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to create user' });
      return;
    }

    // Create profile
    await supabase.from('profiles').insert({
      user_id: user.id,
      total_investments: 0,
      total_listings: 0,
    });

    // Generate tokens
    const tokens = generateTokens({ userId: user.id, email: user.email, role: user.role });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      data: { user, accessToken: tokens.accessToken },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const { email, password } = parsed.data;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user || error) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const tokens = generateTokens({ userId: user.id, email: user.email, role: user.role });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password_hash, ...safeUser } = user;

    res.json({
      success: true,
      data: { user: safeUser, accessToken: tokens.accessToken },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /refresh
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ success: false, error: 'No refresh token' });
      return;
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as JwtPayload;
    const tokens = generateTokens({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, data: { accessToken: tokens.accessToken } });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid refresh token' });
  }
});

// POST /logout
router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /me — get current user profile
router.get('/me', verifyJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, full_name, phone, kyc_status, created_at')
      .eq('id', req.user!.userId)
      .single();

    if (!user || error) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', req.user!.userId)
      .single();

    res.json({ success: true, data: { ...user, profile } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /kyc — submit KYC document
router.post('/kyc', verifyJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const { document_url } = req.body;
    if (!document_url) {
      res.status(400).json({ success: false, error: 'Document URL is required' });
      return;
    }

    const { error } = await supabase
      .from('users')
      .update({ kyc_status: 'pending' })
      .eq('id', req.user!.userId);

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to submit KYC' });
      return;
    }

    res.json({ success: true, message: 'KYC submitted for review' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /kyc/:userId/approve — admin approves KYC
router.patch('/kyc/:userId/approve', verifyJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Admin access required' });
      return;
    }

    const { error } = await supabase
      .from('users')
      .update({ kyc_status: 'approved' })
      .eq('id', req.params.userId);

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to approve KYC' });
      return;
    }

    res.json({ success: true, message: 'KYC approved' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /profile — update profile
router.patch('/profile', verifyJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const { bio, location, phone } = req.body;
    
    const updateData: Record<string, unknown> = {};
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;

    if (Object.keys(updateData).length > 0) {
      await supabase.from('profiles').update(updateData).eq('user_id', req.user!.userId);
    }

    if (phone !== undefined) {
      await supabase.from('users').update({ phone }).eq('id', req.user!.userId);
    }

    res.json({ success: true, message: 'Profile updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
