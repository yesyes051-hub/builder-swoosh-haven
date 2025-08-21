import { RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/memory';
import { generateToken, AuthRequest } from '../middleware/auth';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ApiResponse
} from '@shared/api';
import { EmployeeUser } from '../models/employeeManagement';
import { connectToDatabase } from '../db/mongodb';
import { PMSUser } from '../models/pms';

export const login: RequestHandler = async (req, res) => {
  try {
    const { email, password }: LoginRequest = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      } as ApiResponse<never>);
    }

    // Find user in ROLES collection
    const user = await EmployeeUser.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      } as ApiResponse<never>);
    }

    // Compare password with hashed password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      } as ApiResponse<never>);
    }

    // Create user object for token (converting role to lowercase for consistency)
    const userForToken = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.toLowerCase(),
      isActive: true
    };

    console.log('🔍 Login - User object for token:', userForToken);

    const token = generateToken(userForToken);
    const { password: _, ...userWithoutPassword } = user.toObject();

    console.log('✅ Login successful for user:', user.email, 'ID:', user._id.toString());

    res.json({
      success: true,
      data: {
        token,
        user: {
          ...userWithoutPassword,
          id: userWithoutPassword._id,
          role: userWithoutPassword.role.toLowerCase() // Convert to lowercase for frontend compatibility
        }
      }
    } as ApiResponse<AuthResponse>);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const register: RequestHandler = async (req, res) => {
  try {
    const userData: RegisterRequest = req.body;

    if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
      return res.status(400).json({
        success: false,
        error: 'All required fields must be provided'
      } as ApiResponse<never>);
    }

    // Check if user already exists
    const existingUser = await db.getUserByEmail(userData.email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists with this email'
      } as ApiResponse<never>);
    }

    const user = await db.createUser(userData);
    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      data: {
        token,
        user: userWithoutPassword
      }
    } as ApiResponse<AuthResponse>);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const getProfile: RequestHandler = async (req, res) => {
  try {
    const authReq = req as any;
    const user = authReq.user;

    console.log('🔍 Profile request - User from token:', user);

    if (!user) {
      console.log('❌ No user in request (auth middleware failed)');
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      } as ApiResponse<never>);
    }

    console.log(`🔍 Looking for user with ID: ${user.id}`);

    // Get full user details from ROLES collection
    const fullUser = await EmployeeUser.findById(user.id).select('-password');
    console.log('🔍 Database lookup result:', fullUser ? 'User found' : 'User not found');

    if (!fullUser) {
      console.log(`❌ User with ID ${user.id} not found in database`);

      // Try to find by email as fallback
      console.log(`🔍 Trying to find user by email: ${user.email}`);
      const userByEmail = await EmployeeUser.findOne({ email: user.email }).select('-password');

      if (userByEmail) {
        console.log('✅ Found user by email, using this instead');
        const userWithoutPassword = {
          ...userByEmail.toObject(),
          id: userByEmail._id,
          role: userByEmail.role.toLowerCase()
        };

        return res.json({
          success: true,
          data: userWithoutPassword
        } as ApiResponse<typeof userWithoutPassword>);
      } else {
        console.log('❌ User not found by email either');
      }

      return res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse<never>);
    }

    console.log('✅ User found successfully');
    const userWithoutPassword = {
      ...fullUser.toObject(),
      id: fullUser._id,
      role: fullUser.role.toLowerCase() // Convert to lowercase for frontend compatibility
    };

    res.json({
      success: true,
      data: userWithoutPassword
    } as ApiResponse<typeof userWithoutPassword>);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const resetPassword: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      } as ApiResponse<never>);
    }

    // Find user in PMS database
    const pmsUser = await PMSUser.findOne({ email: user.email });
    if (!pmsUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse<never>);
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, pmsUser.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      } as ApiResponse<never>);
    }

    // Validate new password strength
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (newPassword.length < minLength || !hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'
      } as ApiResponse<never>);
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and reset flags
    pmsUser.password = hashedNewPassword;
    pmsUser.requiresPasswordReset = false;
    pmsUser.isTemporaryPassword = false;
    pmsUser.lastPasswordChange = new Date();

    await pmsUser.save();

    // Also update in memory database if exists
    const memoryUser = await db.getUserByEmail(user.email);
    if (memoryUser) {
      await db.updateUser(memoryUser.id, {
        password: hashedNewPassword
      });
    }

    res.json({
      success: true,
      message: 'Password updated successfully'
    } as ApiResponse<{ message: string }>);
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};
