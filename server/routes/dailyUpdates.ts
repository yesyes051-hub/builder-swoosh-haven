import { RequestHandler } from 'express';
import { db } from '../db/memory';
import { AuthRequest } from '../middleware/auth';
import { 
  CreateDailyUpdateRequest,
  DailyUpdate,
  ApiResponse 
} from '@shared/api';

export const createDailyUpdate: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;
    const updateData: CreateDailyUpdateRequest = req.body;

    if (!updateData.tasks || !updateData.accomplishments || !updateData.challenges || !updateData.nextDayPlans || updateData.progressScore === undefined) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      } as ApiResponse<never>);
    }

    if (updateData.progressScore < 1 || updateData.progressScore > 10) {
      return res.status(400).json({
        success: false,
        error: 'Progress score must be between 1 and 10'
      } as ApiResponse<never>);
    }

    // Check if user already has an update for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingUpdates = await db.getDailyUpdatesByUser(user.id, 1);
    const todayUpdate = existingUpdates.find(update => {
      const updateDate = new Date(update.date);
      updateDate.setHours(0, 0, 0, 0);
      return updateDate.getTime() === today.getTime();
    });

    if (todayUpdate) {
      return res.status(409).json({
        success: false,
        error: 'You have already submitted an update for today'
      } as ApiResponse<never>);
    }

    const dailyUpdate = await db.createDailyUpdate({
      userId: user.id,
      date: new Date(),
      ...updateData
    });

    res.status(201).json({
      success: true,
      data: dailyUpdate
    } as ApiResponse<DailyUpdate>);
  } catch (error) {
    console.error('Create daily update error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const getUserDailyUpdates: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;
    const limit = parseInt(req.query.limit as string) || 10;

    const updates = await db.getDailyUpdatesByUser(user.id, limit);

    res.json({
      success: true,
      data: updates
    } as ApiResponse<DailyUpdate[]>);
  } catch (error) {
    console.error('Get daily updates error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const getTeamDailyUpdates: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    if (user.role !== 'manager' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only managers and admins can view team updates'
      } as ApiResponse<never>);
    }

    const limit = parseInt(req.query.limit as string) || 20;

    // Get team members if user is a manager
    let teamMemberIds: string[] = [];
    if (user.role === 'manager') {
      const allUsers = await db.getAllUsers();
      const teamMembers = allUsers.filter(u => u.managerId === user.id);
      teamMemberIds = teamMembers.map(m => m.id);
    } else {
      // Admin can see all updates
      const allUsers = await db.getAllUsers();
      teamMemberIds = allUsers.map(u => u.id);
    }

    const updates = await db.getDailyUpdatesByTeam(teamMemberIds, limit);

    // Add user info to updates
    const allUsers = await db.getAllUsers();
    const updatesWithUser = updates.map(update => {
      const updateUser = allUsers.find(u => u.id === update.userId);
      return {
        ...update,
        user: {
          firstName: updateUser?.firstName || '',
          lastName: updateUser?.lastName || '',
          email: updateUser?.email || ''
        }
      };
    });

    res.json({
      success: true,
      data: updatesWithUser
    } as ApiResponse<typeof updatesWithUser>);
  } catch (error) {
    console.error('Get team daily updates error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const getDailyUpdateById: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;
    const { id } = req.params;

    const updates = await db.getDailyUpdatesByUser(user.id);
    const update = updates.find(u => u.id === id);

    if (!update) {
      return res.status(404).json({
        success: false,
        error: 'Daily update not found'
      } as ApiResponse<never>);
    }

    // Check if user owns this update or is a manager/admin
    if (update.userId !== user.id && user.role !== 'manager' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse<never>);
    }

    res.json({
      success: true,
      data: update
    } as ApiResponse<DailyUpdate>);
  } catch (error) {
    console.error('Get daily update by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};
