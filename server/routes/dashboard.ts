import { RequestHandler } from 'express';
import { db } from '../db/memory';
import { EmployeeUser } from '../models/employeeManagement';
import { AuthRequest } from '../middleware/auth';
import {
  EmployeeDashboard,
  ManagerDashboard,
  HRDashboard,
  AdminDashboard,
  ApiResponse
} from '@shared/api';

export const getEmployeeDashboard: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    const fullUser = await db.getUserById(user.id);
    if (!fullUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse<never>);
    }

    const recentUpdates = await db.getDailyUpdatesByUser(user.id, 5);
    const upcomingInterviews = await db.getInterviewsByUser(user.id);
    const currentProjects = await db.getProjectsByUser(user.id);

    // Calculate performance stats
    const avgProgressScore = recentUpdates.length > 0 
      ? recentUpdates.reduce((sum, update) => sum + update.progressScore, 0) / recentUpdates.length 
      : 0;

    const dashboardData: EmployeeDashboard = {
      user: fullUser,
      recentUpdates,
      upcomingInterviews: upcomingInterviews.filter(i => i.status === 'scheduled'),
      currentProjects: currentProjects.filter(p => p.status === 'active'),
      leaderboardPosition: 1, // TODO: Calculate actual position
      performanceStats: {
        avgProgressScore: Math.round(avgProgressScore * 10) / 10,
        updateStreak: 0, // TODO: Calculate streak
        totalUpdates: recentUpdates.length
      }
    };

    res.json({
      success: true,
      data: dashboardData
    } as ApiResponse<EmployeeDashboard>);
  } catch (error) {
    console.error('Employee dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const getManagerDashboard: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    const fullUser = await db.getUserById(user.id);
    if (!fullUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse<never>);
    }

    // Get team members
    const allUsers = await db.getAllUsers();
    const teamMembers = allUsers.filter(u => u.managerId === user.id);
    const teamMemberIds = teamMembers.map(m => m.id);

    const recentTeamUpdates = await db.getDailyUpdatesByTeam(teamMemberIds, 10);
    const teamProjects = await db.getProjectsByUser(user.id);

    // Add user info to updates
    const updatesWithUser = recentTeamUpdates.map(update => {
      const updateUser = teamMembers.find(u => u.id === update.userId);
      return {
        ...update,
        user: {
          firstName: updateUser?.firstName || '',
          lastName: updateUser?.lastName || ''
        }
      };
    });

    const dashboardData: ManagerDashboard = {
      user: fullUser,
      teamMembers,
      recentTeamUpdates: updatesWithUser,
      teamProjects,
      teamPerformanceStats: {
        teamSize: teamMembers.length,
        avgTeamScore: 8.5, // TODO: Calculate from actual data
        activeProjects: teamProjects.filter(p => p.status === 'active').length
      }
    };

    res.json({
      success: true,
      data: dashboardData
    } as ApiResponse<ManagerDashboard>);
  } catch (error) {
    console.error('Manager dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const getHRDashboard: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    const fullUser = await db.getUserById(user.id);
    if (!fullUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse<never>);
    }

    const scheduledInterviews = await db.getInterviewsByUser(user.id);
    const allUsers = await db.getAllUsers();

    const dashboardData: HRDashboard = {
      user: fullUser,
      scheduledInterviews: scheduledInterviews.filter(i => i.status === 'scheduled'),
      recentFeedback: [], // TODO: Get recent feedback
      departmentStats: {
        totalEmployees: allUsers.filter(u => u.role === 'employee').length,
        pendingInterviews: scheduledInterviews.filter(i => i.status === 'scheduled').length,
        completedInterviews: scheduledInterviews.filter(i => i.status === 'completed').length
      }
    };

    res.json({
      success: true,
      data: dashboardData
    } as ApiResponse<HRDashboard>);
  } catch (error) {
    console.error('HR dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const getAdminDashboard: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    const fullUser = await db.getUserById(user.id);
    if (!fullUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse<never>);
    }

    const allUsers = await db.getAllUsers();

    const dashboardData: AdminDashboard = {
      user: fullUser,
      systemStats: {
        totalUsers: allUsers.length,
        activeUsers: allUsers.filter(u => u.isActive).length,
        totalProjects: 0, // TODO: Get from projects
        pendingInterviews: 0 // TODO: Get from interviews
      },
      recentActivity: {
        newUsers: 0, // TODO: Calculate from recent signups
        newUpdates: 0, // TODO: Calculate from recent updates
        completedInterviews: 0 // TODO: Calculate from recent interviews
      }
    };

    res.json({
      success: true,
      data: dashboardData
    } as ApiResponse<AdminDashboard>);
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};
