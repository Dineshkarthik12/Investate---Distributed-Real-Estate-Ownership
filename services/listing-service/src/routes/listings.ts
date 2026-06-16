import { Router, Request, Response } from 'express';
import { createListingSchema, updateListingSchema, listingFilterSchema } from '@landconnect/shared';
import supabase from '../config/supabase';
import redis from '../config/redis';
import { verifyJWT, requireRole } from '../middleware/auth';

const router = Router();
const CACHE_TTL = 300; // 5 minutes

// Helper: invalidate listing cache
async function invalidateListingCache(listingId?: string) {
  try {
    // Clear paginated list caches
    const keys = await redis.keys('listings:*');
    if (keys.length > 0) {
      await Promise.all(keys.map(key => redis.del(key)));
    }
    if (listingId) {
      await redis.del(`listing:${listingId}`);
    }
  } catch (err) {
    console.error('Cache invalidation error:', err);
  }
}

// POST /listings — landowner creates a listing
router.post('/', verifyJWT, requireRole('landowner'), async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createListingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const { amenities, ...listingData } = parsed.data;

    const { data: listing, error } = await supabase
      .from('listings')
      .insert({ ...listingData, owner_id: req.user!.userId, status: 'draft' })
      .select()
      .single();

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to create listing' });
      return;
    }

    // Insert amenities if provided
    if (amenities && amenities.length > 0) {
      await supabase.from('listing_amenities').insert(
        amenities.map(name => ({ listing_id: listing.id, amenity_name: name }))
      );
    }

    // Update profile listing count
    await supabase.rpc('increment_field', {
      table_name: 'profiles',
      field_name: 'total_listings',
      row_id: req.user!.userId,
      id_field: 'user_id',
    }).catch(() => {
      // RPC might not exist yet, update manually
      supabase.from('profiles')
        .select('total_listings')
        .eq('user_id', req.user!.userId)
        .single()
        .then(({ data }) => {
          if (data) {
            supabase.from('profiles')
              .update({ total_listings: (data.total_listings || 0) + 1 })
              .eq('user_id', req.user!.userId);
          }
        });
    });

    await invalidateListingCache();
    res.status(201).json({ success: true, data: listing });
  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /listings/:id — update listing
router.patch('/:id', verifyJWT, requireRole('landowner'), async (req: Request, res: Response): Promise<void> => {
  try {
    // Verify ownership
    const { data: existing } = await supabase
      .from('listings')
      .select('owner_id')
      .eq('id', req.params.id)
      .single();

    if (!existing || existing.owner_id !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Not authorized to edit this listing' });
      return;
    }

    const parsed = updateListingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const { amenities, ...updateData } = parsed.data;

    const { data: listing, error } = await supabase
      .from('listings')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to update listing' });
      return;
    }

    // Update amenities if provided
    if (amenities) {
      await supabase.from('listing_amenities').delete().eq('listing_id', req.params.id);
      if (amenities.length > 0) {
        await supabase.from('listing_amenities').insert(
          amenities.map(name => ({ listing_id: req.params.id, amenity_name: name }))
        );
      }
    }

    await invalidateListingCache(req.params.id);
    res.json({ success: true, data: listing });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /listings/:id/publish — set status to active
router.post('/:id/publish', verifyJWT, requireRole('landowner'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: existing } = await supabase
      .from('listings')
      .select('owner_id, status')
      .eq('id', req.params.id)
      .single();

    if (!existing || existing.owner_id !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    if (existing.status !== 'draft') {
      res.status(400).json({ success: false, error: 'Only draft listings can be published' });
      return;
    }

    // Check KYC
    const { data: user } = await supabase
      .from('users')
      .select('kyc_status')
      .eq('id', req.user!.userId)
      .single();

    if (user?.kyc_status !== 'approved') {
      res.status(403).json({ success: false, error: 'KYC must be approved before publishing' });
      return;
    }

    const { data: listing, error } = await supabase
      .from('listings')
      .update({ status: 'active' })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to publish listing' });
      return;
    }

    await invalidateListingCache(req.params.id);
    res.json({ success: true, data: listing });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /listings — paginated, filterable
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = listingFilterSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const { page, limit, project_type, status, min_investment, max_investment, location, search } = parsed.data;
    const cacheKey = `listings:${JSON.stringify(parsed.data)}`;

    // Try cache
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.json(cached);
        return;
      }
    } catch {}

    let query = supabase
      .from('listings')
      .select('*, listing_media(*), listing_amenities(*), users!owner_id(full_name, email)', { count: 'exact' });

    // Default to active listings for public browsing
    if (status) {
      query = query.eq('status', status);
    } else {
      query = query.eq('status', 'active');
    }

    if (project_type) query = query.eq('project_type', project_type);
    if (min_investment) query = query.gte('investment_required', min_investment);
    if (max_investment) query = query.lte('investment_required', max_investment);
    if (location) query = query.ilike('location', `%${location}%`);
    if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch listings' });
      return;
    }

    const response = {
      success: true,
      data,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };

    // Cache the result
    try {
      await redis.set(cacheKey, JSON.stringify(response), { ex: CACHE_TTL });
    } catch {}

    res.json(response);
  } catch (error) {
    console.error('Fetch listings error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /listings/:id — full detail
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const cacheKey = `listing:${req.params.id}`;

    // Try cache
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.json(cached);
        return;
      }
    } catch {}

    const { data: listing, error } = await supabase
      .from('listings')
      .select(`
        *,
        listing_media(*),
        listing_amenities(*),
        users!owner_id(id, full_name, email, phone),
        tokens(*),
        cap_table(*, users!stakeholder_id(full_name))
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !listing) {
      res.status(404).json({ success: false, error: 'Listing not found' });
      return;
    }

    const response = { success: true, data: listing };

    // Cache
    try {
      await redis.set(cacheKey, JSON.stringify(response), { ex: CACHE_TTL });
    } catch {}

    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /listings/:id — delete listing (draft only)
router.delete('/:id', verifyJWT, requireRole('landowner'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: existing } = await supabase
      .from('listings')
      .select('owner_id, status')
      .eq('id', req.params.id)
      .single();

    if (!existing || existing.owner_id !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    if (existing.status !== 'draft') {
      res.status(400).json({ success: false, error: 'Only draft listings can be deleted' });
      return;
    }

    await supabase.from('listings').delete().eq('id', req.params.id);
    await invalidateListingCache(req.params.id);

    res.json({ success: true, message: 'Listing deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /listings/my/all — get all listings for current landowner
router.get('/my/all', verifyJWT, requireRole('landowner'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*, listing_media(*), tokens(*)')
      .eq('owner_id', req.user!.userId)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch listings' });
      return;
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
