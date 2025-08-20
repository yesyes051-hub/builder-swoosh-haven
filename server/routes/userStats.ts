import { RequestHandler } from 'express';
import { EmployeeUser } from '../models/employeeManagement';
import { ApiResponse } from '@shared/api';

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersLast30Days: number;
  roleBreakdown: {
    hr: number;
    manager: number;
    employee: number;
  };
}

export const getUserStats: RequestHandler = async (req, res) => {
  console.log('📊 GET /api/user-stats - Request received');
  try {
    // Get total users count
    console.log('🔍 Counting total users...');
    const totalUsers = await EmployeeUser.countDocuments();
    console.log('👥 Total users found:', totalUsers);

    // For now, consider all users as active (since we don't have an isActive field in new schema)
    const activeUsers = totalUsers;

    // Get users created in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsersLast30Days = await EmployeeUser.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get role breakdown
    const hrUsers = await EmployeeUser.countDocuments({ role: 'HR' });
    const managerUsers = await EmployeeUser.countDocuments({ role: 'Manager' });
    const employeeUsers = await EmployeeUser.countDocuments({ role: 'Employee' });

    const stats: UserStats = {
      totalUsers,
      activeUsers,
      newUsersLast30Days,
      roleBreakdown: {
        hr: hrUsers,
        manager: managerUsers,
        employee: employeeUsers
      }
    };

    res.json({
      success: true,
      data: stats
    } as ApiResponse<UserStats>);

  } catch (error) {
    console.error('Get user stats error:', error);

    // Provide more specific error information
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      if (error.message.includes('connection')) {
        errorMessage = 'Database connection error';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Database query timeout';
      } else {
        errorMessage = `Database error: ${error.message}`;
      }
    }

    res.status(500).json({
      success: false,
      error: errorMessage
    } as ApiResponse<never>);
  }
};

export const getAllUsersForManagement: RequestHandler = async (req, res) => {
  try {
    const users = await EmployeeUser.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      gender: user.gender,
      contactNumber: user.contactNumber,
      jobStatus: user.jobStatus,
      createdAt: user.createdAt
    }));

    res.json({
      success: true,
      data: formattedUsers
    } as ApiResponse<typeof formattedUsers>);

  } catch (error) {
    console.error('Get all users for management error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};
