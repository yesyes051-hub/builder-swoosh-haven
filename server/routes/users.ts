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
    await connectToDatabase();
    
    const {
      firstName,
      lastName,
      gender,
      email,
      contactNumber,
      jobStatus,
      role
    }: CreateUserRequest = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !role) {
      return res.status(400).json({
        success: false,
        error: 'First name, last name, email, and role are required'
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

    // Check if user already exists
    const existingUser = await PMSUser.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists with this email address'
      } as ApiResponse<never>);
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create new user
    const newUser = new PMSUser({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender,
      contactNumber: contactNumber?.trim(),
      jobStatus,
      role: role.toLowerCase() as 'hr' | 'manager' | 'employee',
      department: 'General', // Default department, can be updated later
      isActive: true,
      requiresPasswordReset: true,
      isTemporaryPassword: true,
    });

    await newUser.save();

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser.toObject();

    res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        tempPassword, // In a real app, this would be sent via email
        message: 'User created successfully. Temporary password provided.'
      }
    } as ApiResponse<{
      user: typeof userWithoutPassword;
      tempPassword: string;
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
    await connectToDatabase();

    const users = await PMSUser.find({ isActive: true })
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
