import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { isValidObjectId } from 'mongoose';
import {
  SafeUser,
  serializeUser,
  UserModel,
} from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';

const jwtSecret = process.env.JWT_SECRET || 'campusrent-local-development-secret';

export type AuthUser = SafeUser;

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: Pick<SafeUser, 'id' | 'email' | 'role'>): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    jwtSecret,
    { expiresIn: '7d' },
  );
}

export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(header.slice(7), jwtSecret) as { id?: string };
    if (!payload.id || !isValidObjectId(payload.id)) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const user = await UserModel.findById(payload.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account suspended' });
    }

    req.user = serializeUser(user);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

export function requireVerifiedStudent(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (req.user.role === 'admin') return next();
  if (req.user.verification_status !== 'verified') {
    return res.status(403).json({
      error: 'Account verification required',
      verification_status: req.user.verification_status,
    });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
