import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import { EmployeeUser } from '../models/employeeManagement';
import { DailyUpdateModel } from '../models/dailyUpdate';
import {
  CreateDailyUpdateRequest,
  DailyUpdate,
  ApiResponse
} from '@shared/api';

export const createDailyUpdate: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;
    const updateData: CreateDailyUpdateRequest & { date?: string | Date; targetUserId?: string } = req.body;

    if (!updateData.tasks || !updateData.accomplishments || !updateData.challenges || !updateData.nextDayPlans || updateData.progressScore === undefined) {
      return res.status(400).json({ success: false, error: 'All fields are required' } as ApiResponse<never>);
    }

    if (updateData.progressScore < 1 || updateData.progressScore > 10) {
      return res.status(400).json({ success: false, error: 'Progress score must be between 1 and 10' } as ApiResponse<never>);
    }

    // Determine target user (Admin can upsert for others; others can only upsert their own)
    let targetUserId = user.id;
    if (updateData.targetUserId) {
      if (user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Only admins can submit updates for other users' } as ApiResponse<never>);
      }
      // Optional: verify target user exists in Mongo; if not found, still allow storing the provided ID
      const targetUser = await EmployeeUser.findById(updateData.targetUserId).select('_id');
      targetUserId = targetUser ? targetUser._id.toString() : updateData.targetUserId;
    }

    // Parse and validate date (allowed: today and previous 3 days, not future)
    const now = new Date();
    const today = new Date(now);
    today.setHours(0,0,0,0);
    const earliest = new Date(today);
    earliest.setDate(earliest.getDate() - 3);

    const selected = updateData.date ? new Date(updateData.date) : new Date(now);
    selected.setHours(0,0,0,0);

    if (selected.getTime() < earliest.getTime() || selected.getTime() > today.getTime()) {
      return res.status(400).json({ success: false, error: 'Date must be within the last 3 days (including today)' } as ApiResponse<never>);
    }

    // Upsert by date for target user using Mongo (unique index enforces single entry per day)
    const existing = await DailyUpdateModel.findOne({ userId: targetUserId, date: selected });
    if (existing) {
      existing.tasks = updateData.tasks;
      existing.accomplishments = updateData.accomplishments;
      existing.challenges = updateData.challenges;
      existing.nextDayPlans = updateData.nextDayPlans;
      existing.progressScore = updateData.progressScore;
      existing.date = selected;
      await existing.save();
      const updatedDto: DailyUpdate = {
        id: existing._id.toString(),
        userId: existing.userId,
        date: existing.date,
        tasks: existing.tasks,
        accomplishments: existing.accomplishments,
        challenges: existing.challenges,
        nextDayPlans: existing.nextDayPlans,
        progressScore: existing.progressScore,
        createdAt: existing.createdAt!,
        updatedAt: existing.updatedAt!,
      };
      return res.status(200).json({ success: true, data: updatedDto } as ApiResponse<DailyUpdate>);
    }

    const createdDoc = await DailyUpdateModel.create({
      userId: targetUserId,
      date: selected,
      tasks: updateData.tasks,
      accomplishments: updateData.accomplishments,
      challenges: updateData.challenges,
      nextDayPlans: updateData.nextDayPlans,
      progressScore: updateData.progressScore,
    });

    const createdDto: DailyUpdate = {
      id: createdDoc._id.toString(),
      userId: createdDoc.userId,
      date: createdDoc.date,
      tasks: createdDoc.tasks,
      accomplishments: createdDoc.accomplishments,
      challenges: createdDoc.challenges,
      nextDayPlans: createdDoc.nextDayPlans,
      progressScore: createdDoc.progressScore,
      createdAt: createdDoc.createdAt!,
      updatedAt: createdDoc.updatedAt!,
    };

    return res.status(201).json({ success: true, data: createdDto } as ApiResponse<DailyUpdate>);
  } catch (error) {
    console.error('Create daily update error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse<never>);
  }
};

export const getUserDailyUpdates: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;
    const limit = parseInt(req.query.limit as string) || 10;

    const docs = await DailyUpdateModel.find({ userId: user.id })
      .sort({ date: -1 })
      .limit(limit);

    const updates: DailyUpdate[] = docs.map((d) => ({
      id: d._id.toString(),
      userId: d.userId,
      date: d.date,
      tasks: d.tasks,
      accomplishments: d.accomplishments,
      challenges: d.challenges,
      nextDayPlans: d.nextDayPlans,
      progressScore: d.progressScore,
      createdAt: d.createdAt!,
      updatedAt: d.updatedAt!,
    }));

    res.json({ success: true, data: updates } as ApiResponse<DailyUpdate[]>);
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
        error: 'Only managers and admins can view organization-wide updates'
      } as ApiResponse<never>);
    }

    const limit = parseInt(req.query.limit as string) || 1000; // allow large page for org-wide view

    // Updated: Managers now have organization-wide visibility (per requirements)
    // Build the list of all user IDs for both admin and manager
    const mongoUsers = await EmployeeUser.find({}).select('firstName lastName email');
    const teamMemberIds: string[] = mongoUsers.map(u => u._id.toString());

    const docs = await DailyUpdateModel.find({ userId: { $in: teamMemberIds } })
      .sort({ date: -1 })
      .limit(limit);

    const updates = docs.map((d) => ({
      id: d._id.toString(),
      userId: d.userId,
      date: d.date,
      tasks: d.tasks,
      accomplishments: d.accomplishments,
      challenges: d.challenges,
      nextDayPlans: d.nextDayPlans,
      progressScore: d.progressScore,
      createdAt: d.createdAt!,
      updatedAt: d.updatedAt!,
      user: (() => {
        const u = mongoUsers.find(mu => mu._id.toString() === d.userId);
        return u ? { firstName: u.firstName, lastName: u.lastName, email: u.email } : { firstName: '', lastName: '', email: '' };
      })(),
    }));

    res.json({ success: true, data: updates } as ApiResponse<typeof updates>);
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

    // Fetch from Mongo by ID
    const doc = await DailyUpdateModel.findById(id);
    if (!doc) {
      return res.status(404).json({
        success: false,
        error: 'Daily update not found'
      } as ApiResponse<never>);
    }

    // Enforce ownership for HR/Employee; Admin/Manager already allowed
    if ((user.role === 'hr' || user.role === 'employee') && doc.userId !== user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' } as ApiResponse<never>);
    }

    const dto: DailyUpdate = {
      id: doc._id.toString(),
      userId: doc.userId,
      date: doc.date,
      tasks: doc.tasks,
      accomplishments: doc.accomplishments,
      challenges: doc.challenges,
      nextDayPlans: doc.nextDayPlans,
      progressScore: doc.progressScore,
      createdAt: doc.createdAt!,
      updatedAt: doc.updatedAt!,
    };

    res.json({ success: true, data: dto } as ApiResponse<DailyUpdate>);
  } catch (error) {
    console.error('Get daily update by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};
