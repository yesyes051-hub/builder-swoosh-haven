import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User, UserRole } from "@shared/api";

const JWT_SECRET = process.env.JWT_SECRET || "trackzen-dev-secret-key";

export interface AuthRequest extends Request {
  user?: Omit<User, "password">;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  console.log("🔍 Auth middleware - URL:", req.url);
  console.log("🔍 Auth header:", authHeader);
  console.log("🔍 Extracted token length:", token ? token.length : "N/A");

  if (!token) {
<<<<<<< HEAD
    console.log('❌ No token provided in request');
    return res.status(401).json({ success: false, error: 'Access token required' });
=======
    console.log("❌ No token provided");
    return res
      .status(401)
      .json({ success: false, error: "Access token required" });
>>>>>>> refs/remotes/origin/main
  }

  try {
    console.log("🔍 Verifying token with secret length:", JWT_SECRET.length);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
<<<<<<< HEAD
    console.log('🔍 Token decoded successfully:', decoded);

    // In a real app, you'd fetch the full user from database
=======
    console.log("✅ Token decoded successfully:", {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    // Set minimal user object with the correct ID
>>>>>>> refs/remotes/origin/main
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      firstName: "",
      lastName: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };

<<<<<<< HEAD
    console.log('✅ User set in request:', req.user);
    next();
  } catch (error) {
    console.log('❌ Token verification failed:', error);
    return res.status(403).json({ success: false, error: 'Invalid or expired token' });
=======
    next();
  } catch (error) {
    console.error(
      "❌ Token verification error for URL:",
      req.url,
      "Error:",
      error,
    );
    console.log("🔍 Token that failed:", token?.substring(0, 20) + "...");
    return res
      .status(403)
      .json({ success: false, error: "Invalid or expired token" });
>>>>>>> refs/remotes/origin/main
  }
};

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    console.log(
      `🔐 Role check for ${req.path}: Required roles: [${roles.join(", ")}], User role: ${req.user?.role || "none"}`,
    );

    if (!req.user) {
      console.log("❌ Authentication required - no user in request");
      return res
        .status(401)
        .json({ success: false, error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      console.log(
        `❌ Insufficient permissions - user has '${req.user.role}', needs one of [${roles.join(", ")}]`,
      );
      return res
        .status(403)
        .json({ success: false, error: "Insufficient permissions" });
    }

    console.log("✅ Role check passed");
    next();
  };
};

export const generateToken = (user: Omit<User, "password">): string => {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
};
