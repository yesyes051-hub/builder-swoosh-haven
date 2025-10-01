import { connectToDatabase } from '../db/mongodb';
import {
  Timesheet,
  ProjectDetail,
} from '../models/pms';
import { AuthRequest } from '../middleware/auth';
import { ApiResponse } from '@shared/api';
import type { RequestHandler } from 'express';

// Helper to compute hours between HH:mm strings
function computeHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map((n) => parseInt(n, 10));
  const [eh, em] = end.split(':').map((n) => parseInt(n, 10));
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  let diff = endMins - startMins;
  if (diff < 0) diff += 24 * 60; // handle overnight just in case
  const hours = diff / 60;
  return Math.max(0, Math.min(24, hours));
}

// Create a single timesheet entry
export const createTimesheetEntry: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    const { projectId, date, startTime, endTime, taskDescription, category, billable } = req.body as any;

    if (!projectId || !date || !startTime || !endTime || !taskDescription) {
      return res.status(400).json({ success: false, error: 'Missing required fields' } as ApiResponse<never>);
    }

    const project = await ProjectDetail.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' } as ApiResponse<never>);
    }

    const hoursWorked = computeHours(startTime, endTime);

    const entry = await Timesheet.create({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      projectId,
      projectName: project.projectName,
      date: new Date(date),
      startTime,
      endTime,
      hoursWorked,
      taskDescription,
      category: category || 'Development',
      status: 'Draft',
      billable: typeof billable === 'boolean' ? billable : true,
      overtime: hoursWorked > 8,
    });

    res.json({ success: true, data: entry } as ApiResponse<any>);
  } catch (error) {
    console.error('createTimesheetEntry error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse<never>);
  }
};

// List timesheet entries (employees see their own, managers/admin see all)
export const getTimesheetEntries: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    const query: any = {};
    if (user.role === 'employee') {
      query.userId = user.id;
    }

    const items = await Timesheet.find(query).sort({ date: -1, createdAt: -1 }).lean();
    res.json({ success: true, data: items } as ApiResponse<any[]>);
  } catch (error) {
    console.error('getTimesheetEntries error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse<never>);
  }
};

// Update a timesheet entry (only owner when Draft, or admin/manager)
export const updateTimesheetEntry: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;
    const { id } = req.params as any;

    const entry = await Timesheet.findById(id);
    if (!entry) return res.status(404).json({ success: false, error: 'Not found' } as ApiResponse<never>);

    const canEdit = user.role !== 'employee' || (entry.userId === user.id && entry.status === 'Draft');
    if (!canEdit) return res.status(403).json({ success: false, error: 'Forbidden' } as ApiResponse<never>);

    const { startTime, endTime, taskDescription, category, billable, date, projectId } = req.body as any;

    if (typeof startTime === 'string') entry.startTime = startTime;
    if (typeof endTime === 'string') entry.endTime = endTime;
    if (typeof taskDescription === 'string') entry.taskDescription = taskDescription;
    if (typeof category === 'string') entry.category = category;
    if (typeof billable === 'boolean') entry.billable = billable;
    if (typeof date === 'string') entry.date = new Date(date);

    if (typeof projectId === 'string') {
      const project = await ProjectDetail.findById(projectId);
      if (!project) return res.status(404).json({ success: false, error: 'Project not found' } as ApiResponse<never>);
      entry.projectId = projectId;
      entry.projectName = project.projectName;
    }

    entry.hoursWorked = computeHours(entry.startTime, entry.endTime);
    entry.overtime = entry.hoursWorked > 8;

    await entry.save();
    res.json({ success: true, data: entry } as ApiResponse<any>);
  } catch (error) {
    console.error('updateTimesheetEntry error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse<never>);
  }
};

// Submit a single timesheet entry for approval (owner only)
export const submitTimesheet: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;
    const { id } = req.params as any;

    const entry = await Timesheet.findById(id);
    if (!entry) return res.status(404).json({ success: false, error: 'Not found' } as ApiResponse<never>);
    if (entry.userId !== user.id) return res.status(403).json({ success: false, error: 'Forbidden' } as ApiResponse<never>);
    if (entry.status !== 'Draft') return res.status(400).json({ success: false, error: 'Only Draft entries can be submitted' } as ApiResponse<never>);

    entry.status = 'Submitted';
    await entry.save();
    res.json({ success: true, data: entry } as ApiResponse<any>);
  } catch (error) {
    console.error('submitTimesheet error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse<never>);
  }
};

// Approve a timesheet entry (manager/admin only)
export const approveTimesheet: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;
    const { id } = req.params as any;

    const entry = await Timesheet.findById(id);
    if (!entry) return res.status(404).json({ success: false, error: 'Not found' } as ApiResponse<never>);

    entry.status = 'Approved';
    entry.approvedBy = user.id;
    entry.approvedAt = new Date();

    await entry.save();
    res.json({ success: true, data: entry } as ApiResponse<any>);
  } catch (error) {
    console.error('approveTimesheet error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse<never>);
  }
};

// Delete a timesheet entry (owner when Draft; admin/manager any)
export const deleteTimesheetEntry: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;
    const { id } = req.params as any;

    const entry = await Timesheet.findById(id);
    if (!entry) return res.status(404).json({ success: false, error: 'Not found' } as ApiResponse<never>);

    const canDelete = user.role !== 'employee' || (entry.userId === user.id && entry.status === 'Draft');
    if (!canDelete) return res.status(403).json({ success: false, error: 'Forbidden' } as ApiResponse<never>);

    await Timesheet.deleteOne({ _id: id });
    res.json({ success: true, data: null } as ApiResponse<null>);
  } catch (error) {
    console.error('deleteTimesheetEntry error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse<never>);
  }
};

// Submit all Draft entries for the selected week for approval (owner)
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
