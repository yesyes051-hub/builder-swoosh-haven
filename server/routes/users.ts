import { RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import { EmployeeUser } from '../models/employeeManagement';
import { ApiResponse } from '@shared/api';

interface CreateUserRequest {
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female' | 'Other';
  email: string;
  contactNumber?: string;
  jobStatus: 'Intern' | 'Full-Time' | 'On-Job Training' | 'Part-Time';
  role: 'HR' | 'Manager' | 'Employee';
  password: string;
}

export const createUser: RequestHandler = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      gender,
      email,
      contactNumber,
      jobStatus,
      role,
      password
    }: CreateUserRequest = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !role || !password || !gender || !jobStatus) {
      return res.status(400).json({
        success: false,
        error: 'All required fields must be provided'
      } as ApiResponse<never>);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address'
      } as ApiResponse<never>);
    }

    // Validate contact number if provided
    if (contactNumber && !/^\d{10,15}$/.test(contactNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Contact number must be 10-15 digits'
      } as ApiResponse<never>);
    }

    // Validate password strength
    if (password.length < 8 ||
        !/[A-Z]/.test(password) ||
        !/[a-z]/.test(password) ||
        !/\d/.test(password) ||
        !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
      } as ApiResponse<never>);
    }

    // Check if user already exists
    const existingUser = await EmployeeUser.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists with this email address'
      } as ApiResponse<never>);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = new EmployeeUser({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender,
      email: email.toLowerCase(),
      contactNumber: contactNumber?.trim(),
      jobStatus,
      role,
      password: hashedPassword,
    });

    await newUser.save();

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser.toObject();

    res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        message: 'User created successfully'
      }
    } as ApiResponse<{
      user: typeof userWithoutPassword;
      message: string;
    }>);

  } catch (error) {
    console.error('Create user error:', error);
    
    // Handle MongoDB duplicate key error
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'User already exists with this email address'
      } as ApiResponse<never>);
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const getAllUsers: RequestHandler = async (req, res) => {
  try {
    const users = await EmployeeUser.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users
    } as ApiResponse<typeof users>);

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};
