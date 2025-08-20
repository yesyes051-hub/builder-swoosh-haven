import { RequestHandler } from 'express';
import { EmployeeUser } from '../models/employeeManagement';
import { ApiResponse } from '@shared/api';

interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female' | 'Other';
  email: string;
  contactNumber?: string;
  jobStatus: 'Intern' | 'Full-Time' | 'On-Job Training' | 'Part-Time';
  role: 'HR' | 'Manager' | 'Employee';
}

export const updateUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      gender,
      email,
      contactNumber,
      jobStatus,
      role
    }: UpdateUserRequest = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !role || !gender || !jobStatus) {
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

    // Check if user exists
    const existingUser = await EmployeeUser.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse<never>);
    }

    // Check if email is already taken by another user
    const emailConflict = await EmployeeUser.findOne({ 
      email: email.toLowerCase(), 
      _id: { $ne: id } 
    });
    if (emailConflict) {
      return res.status(409).json({
        success: false,
        error: 'Email address is already in use by another user'
      } as ApiResponse<never>);
    }

    // Update user
    const updatedUser = await EmployeeUser.findByIdAndUpdate(
      id,
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        email: email.toLowerCase(),
        contactNumber: contactNumber?.trim(),
        jobStatus,
        role,
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse<never>);
    }

    res.json({
      success: true,
      data: {
        user: updatedUser,
        message: 'User updated successfully'
      }
    } as ApiResponse<{
      user: typeof updatedUser;
      message: string;
    }>);

  } catch (error) {
    console.error('Update user error:', error);
    
    // Handle MongoDB validation errors
    if (error instanceof Error && 'name' in error && error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid data provided'
      } as ApiResponse<never>);
    }

    // Handle MongoDB duplicate key error
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Email address is already in use'
      } as ApiResponse<never>);
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};
