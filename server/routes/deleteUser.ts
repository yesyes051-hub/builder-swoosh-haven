import { RequestHandler } from 'express';
import { EmployeeUser } from '../models/employeeManagement';
import { ApiResponse } from '@shared/api';

export const deleteUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
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

    // Delete the user
    await EmployeeUser.findByIdAndDelete(id);

    res.json({
      success: true,
      data: {
        message: 'User deleted successfully'
      }
    } as ApiResponse<{
      message: string;
    }>);

  } catch (error) {
    console.error('Delete user error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};
