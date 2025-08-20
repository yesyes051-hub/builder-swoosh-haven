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
    console.log('❌ No token provided in request');
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    console.log('🔍 Token decoded successfully:', decoded);

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

    console.log('✅ User set in request:', req.user);
    next();
  } catch (error) {
    console.log('❌ Token verification failed:', error);
    return res.status(403).json({ success: false, error: 'Invalid or expired token' });
  }
};

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    console.log(`🔐 Role check for ${req.path}: Required roles: [${roles.join(', ')}], User role: ${req.user?.role || 'none'}`);

    if (!req.user) {
      console.log('❌ Authentication required - no user in request');
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      console.log(`❌ Insufficient permissions - user has '${req.user.role}', needs one of [${roles.join(', ')}]`);
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }

    console.log('✅ Role check passed');
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
