import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { db } from '../firestore';

export interface AdminRequest extends Request {
  adminUser?: { uid: string; email?: string; role: string };
}

export async function requireAdmin(
  req: AdminRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decoded = await getAuth().verifyIdToken(idToken);

    const userDoc = await db().collection('users').doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    req.adminUser = { uid: decoded.uid, email: decoded.email, role: 'admin' };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
