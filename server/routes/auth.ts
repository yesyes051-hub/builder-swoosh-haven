import { RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/memory';
import { generateToken } from '../middleware/auth';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  ApiResponse 
} from '@shared/api';

export const login: RequestHandler = async (req, res) => {
  try {
    const { email, password }: LoginRequest = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      } as ApiResponse<never>);
    }

    const user = await db.getUserByEmail(email);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      } as ApiResponse<never>);
    }

    const isValidPassword = await bcrypt.compare(password, user.password!);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      } as ApiResponse<never>);
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        token,
        user: userWithoutPassword
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

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      } as ApiResponse<never>);
    }

    // Get full user details from database
    const fullUser = await db.getUserById(user.id);
    if (!fullUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse<never>);
    }

    const { password: _, ...userWithoutPassword } = fullUser;

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
