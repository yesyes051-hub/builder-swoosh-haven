import { connectToDatabase } from '../db/mongodb';
import {
  ProjectDetail,
  Ticket,
  StandupCall,
  Timesheet,
  Accessory,
  Birthday,
  InterviewFeedbackEnhanced,
  PMSUser
} from '../models/pms';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth';
import { ApiResponse } from '@shared/api';
import type { RequestHandler } from 'express';

// ... existing route handlers ...

export const submitWeeklyTimesheets: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;
    const { weekStart } = (req.body || {}) as { weekStart?: string };

    const base = weekStart ? new Date(weekStart) : new Date();
    const day = base.getDay(); // 0=Sun..6=Sat
    const diffToMonday = (day + 6) % 7; // days since Monday
    const mondayStart = new Date(base);
    mondayStart.setDate(base.getDate() - diffToMonday);
    mondayStart.setHours(0, 0, 0, 0);
    const nextMonday = new Date(mondayStart);
    nextMonday.setDate(mondayStart.getDate() + 7);

    const result: any = await Timesheet.updateMany(
      { userId: user.id, status: 'Draft', date: { $gte: mondayStart, $lt: nextMonday } },
      { $set: { status: 'Submitted' } }
    );

    res.json({ success: true, data: { modified: result.modifiedCount || 0 } } as ApiResponse<{ modified: number }>);
  } catch (error) {
    console.error('Submit weekly timesheets error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse<never>);
  }
};
