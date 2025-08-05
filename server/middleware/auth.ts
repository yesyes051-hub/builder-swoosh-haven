import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '@shared/api';

const JWT_SECRET = process.env.JWT_SECRET || 'trackzen-dev-secret-key';

export interface AuthRequest extends Request {
  user?: Omit<User, 'password'>;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    // In a real app, you'd fetch the full user from database
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      firstName: '',
      lastName: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };
    next();
  } catch (error) {
    return res.status(403).json({ success: false, error: 'Invalid or expired token' });
  }
};

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }

    next();
  };
};

export const generateToken = (user: Omit<User, 'password'>): string => {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};
