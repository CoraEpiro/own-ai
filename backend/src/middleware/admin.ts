import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { isUserAdmin } from '../services/databaseService';

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const admin = await isUserAdmin(userId);
    if (!admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to verify admin access' });
  }
};

