import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload, UserRole } from '@landconnect/shared';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
declare global { namespace Express { interface Request { user?: JwtPayload; } } }
export const verifyJWT = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) { res.status(401).json({ success: false, error: 'No token provided' }); return; }
    req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as JwtPayload;
    next();
  } catch { res.status(401).json({ success: false, error: 'Invalid or expired token' }); }
};
export const requireRole = (...roles: UserRole[]) => (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Auth required' }); return; }
  if (!roles.includes(req.user.role)) { res.status(403).json({ success: false, error: 'Forbidden' }); return; }
  next();
};
