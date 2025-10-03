import { connectToDatabase } from '../db/mongodb';
import {
  ProjectDetail,
  Ticket,
  StandupCall,
  Timesheet,
  Accessory,
  Birthday,
  InterviewFeedbackEnhanced,
  PMSUser,
} from '../models/pms';
import { EmployeeUser } from '../models/employeeManagement';
import bcrypt from 'bcryptjs';
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
  if (diff < 0) diff += 24 * 60; // handle overnight
  const hours = diff / 60;
  return Math.max(0, Math.min(24, hours));
}

// ========== Enhanced Timesheets ==========
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
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' } as ApiResponse<never>);

    const hoursWorked = computeHours(startTime, endTime);

    const entry = await Timesheet.create({
      userId: user.id,
      userName: (user as any).firstName ? `${(user as any).firstName} ${(user as any).lastName ?? ''}`.trim() : (user as any).name,
      userEmail: (user as any).email,
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

export const getTimesheetEntries: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    const query: any = {};
    if (user.role === 'employee') query.userId = user.id;

    const items = await Timesheet.find(query).sort({ date: -1, createdAt: -1 }).lean();
    res.json({ success: true, data: items } as ApiResponse<any[]>);
  } catch (error) {
    console.error('getTimesheetEntries error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse<never>);
  }
};

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

// ========== Project Details ==========
export const getProjectDetails: RequestHandler = async (_req, res) => {
  try {
    await connectToDatabase();
    const items = await ProjectDetail.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: items } as ApiResponse<any[]>);
  } catch (error) {
    console.error('getProjectDetails error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse<never>);
  }
};

export const createProjectDetail: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const body = req.body as Partial<any>;
    if (!body.projectName || !body.projectManager || !body.description) {
      return res.status(400).json({ success: false, error: 'Missing required fields' } as ApiResponse<never>);
    }
    const created = await ProjectDetail.create(body);
    res.json({ success: true, data: created } as ApiResponse<any>);
  } catch (error) {
    console.error('createProjectDetail error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse<never>);
  }
};

export const updateProjectDetail: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const { id } = req.params as any;
    const updated = await ProjectDetail.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, error: 'Not found' } as ApiResponse<never>);
    res.json({ success: true, data: updated } as ApiResponse<any>);
  } catch (error) {
    console.error('updateProjectDetail error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse<never>);
  }
};

// ========== Tickets ==========
export const getTickets: RequestHandler = async (_req, res) => {
  try {
    await connectToDatabase();
    const items = await Ticket.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: items } as ApiResponse<any[]>);
  } catch (error) {
    console.error('getTickets error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse<never>);
  }
};

export const createTicket: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as any;
    const user = authReq.user || {};
    const body = req.body as Partial<any>;

    // Validate core required fields
    if (!body.projectId || !body.title || !body.description || !body.type) {
      return res.status(400).json({ success: false, error: 'Missing required fields: projectId, title, description, type' } as ApiResponse<never>);
    }

    // Build safe payload with defaults
    const ticketId = body.ticketId || `TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
    const reportedBy = body.reportedBy || user.id || user.userId || 'system';
    const assignedTo = body.assignedTo || reportedBy; // default to reporter if unassigned
    const status = body.status || 'Pending';
    const priority = body.priority || 'Medium';

    const payload = {
      ticketId,
      projectId: body.projectId,
      title: body.title,
      description: body.description,
      assignedTo,
      reportedBy,
      status,
      priority,
      type: body.type,
      estimatedHours: body.estimatedHours,
      actualHours: body.actualHours,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    };

    const created = await Ticket.create(payload);
    res.json({ success: true, data: created } as ApiResponse<any>);
  } catch (error) {
    console.error('createTicket error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse<never>);
  }
};

// ========== Standup Calls ==========
export const getStandupCalls: RequestHandler = async (_req, res) => {
  try {
    await connectToDatabase();
    const items = await StandupCall.find().sort({ date: -1 }).lean();
    res.json({ success: true, data: items } as ApiResponse<any[]>);
  } catch (error) {
    console.error('getStandupCalls error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse<never>);
  }
};

export const createStandupCall: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const body = req.body as Partial<any>;
    if (!body.projectId || !body.date || !body.facilitator) {
      return res.status(400).json({ success: false, error: 'Missing required fields' } as ApiResponse<never>);
    }
    const created = await StandupCall.create(body);
    res.json({ success: true, data: created } as ApiResponse<any>);
  } catch (error) {
    console.error('createStandupCall error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse<never>);
  }
};

// ========== Accessories ==========
export const getAccessories: RequestHandler = async (_req, res) => {
  try {
    await connectToDatabase();
    const items = await Accessory.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: items } as ApiResponse<any[]>);
  } catch (error) {
    console.error('getAccessories error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse<never>);
  }
};

export const createAccessory: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const body = req.body as Partial<any>;
    if (!body.userId || !body.itemName || !body.itemType || !body.assignedDate) {
      return res.status(400).json({ success: false, error: 'Missing required fields' } as ApiResponse<never>);
    }
    const created = await Accessory.create(body);
    res.json({ success: true, data: created } as ApiResponse<any>);
  } catch (error) {
    console.error('createAccessory error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse<never>);
  }
};

// ========== Birthdays ==========
export const getBirthdays: RequestHandler = async (_req, res) => {
  try {
    await connectToDatabase();
    const items = await Birthday.find().sort({ birthday: 1 }).lean();
    res.json({ success: true, data: items } as ApiResponse<any[]>);
  } catch (error) {
    console.error('getBirthdays error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse<never>);
  }
};

export const createBirthday: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const body = req.body as Partial<any>;
    if (!body.userId || !body.name || !body.birthday || !body.email) {
      return res.status(400).json({ success: false, error: 'Missing required fields' } as ApiResponse<never>);
    }
    const created = await Birthday.create(body);
    res.json({ success: true, data: created } as ApiResponse<any>);
  } catch (error) {
    console.error('createBirthday error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse<never>);
  }
};

// ========== Interview Feedback ==========
export const createInterviewFeedback: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const body = req.body as Partial<any>;
    if (!body.interviewId || !body.intervieweeId || !body.interviewerId || !body.technicalSkills || !body.communication || !body.problemSolving || !body.overallRating || !body.detailedFeedback) {
      return res.status(400).json({ success: false, error: 'Missing required fields' } as ApiResponse<never>);
    }
    const created = await InterviewFeedbackEnhanced.create(body);
    res.json({ success: true, data: created } as ApiResponse<any>);
  } catch (error) {
    console.error('createInterviewFeedback error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse<never>);
  }
};

export const addAdminComments: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const { id } = req.params as any;
    const { adminComments } = req.body as any;
    const updated = await InterviewFeedbackEnhanced.findByIdAndUpdate(id, { adminComments }, { new: true });
    if (!updated) return res.status(404).json({ success: false, error: 'Not found' } as ApiResponse<never>);
    res.json({ success: true, data: updated } as ApiResponse<any>);
  } catch (error) {
    console.error('addAdminComments error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse<never>);
  }
};

// ========== Timesheet Reminders ==========
export const getTimesheetReminders: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

    const draftsToday = await Timesheet.countDocuments({ userId: user.id, status: 'Draft', date: { $gte: today, $lt: tomorrow } });

    res.json({ success: true, data: { draftsToday } } as ApiResponse<{ draftsToday: number }>);
  } catch (error) {
    console.error('getTimesheetReminders error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse<never>);
  }
};

// ========== Legacy Timesheet Status (compat) ==========
export const getTimesheets: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;
    const query: any = {};
    if (user.role === 'employee') query.userId = user.id;
    const items = await Timesheet.find(query).sort({ date: -1, createdAt: -1 }).lean();
    const mapped = items.map((t: any) => ({
      _id: t._id.toString(),
      userId: t.userId,
      projectId: t.projectId,
      date: t.date,
      hoursWorked: t.hoursWorked,
      taskDescription: t.taskDescription,
      status: t.status,
      billable: t.billable,
    }));
    res.json({ success: true, data: mapped } as ApiResponse<any[]>);
  } catch (error) {
    console.error('getTimesheets error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse<never>);
  }
};

export const createTimesheet: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;
    const { projectId, date, hoursWorked, taskDescription, billable } = req.body as any;
    if (!projectId || !date || typeof hoursWorked !== 'number' || !taskDescription) {
      return res.status(400).json({ success: false, error: 'Missing required fields' } as ApiResponse<never>);
    }
    const project = await ProjectDetail.findById(projectId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' } as ApiResponse<never>);
    const entry = await Timesheet.create({
      userId: user.id,
      userName: (user as any).firstName ? `${(user as any).firstName} ${(user as any).lastName ?? ''}`.trim() : (user as any).name,
      userEmail: (user as any).email,
      projectId,
      projectName: project.projectName,
      date: new Date(date),
      startTime: '09:00',
      endTime: '17:00',
      hoursWorked,
      taskDescription,
      category: 'Development',
      status: 'Draft',
      billable: typeof billable === 'boolean' ? billable : true,
      overtime: hoursWorked > 8,
    });
    res.status(201).json({ success: true, data: entry } as ApiResponse<any>);
  } catch (error) {
    console.error('createTimesheet error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse<never>);
  }
};

// ========== Employee Management (basic) ==========
export const createEmployee: RequestHandler = async (req, res) => {
  try {
    const body = req.body as any;
    if (!body.email || !body.password || !body.firstName || !body.lastName || !body.role || !body.jobStatus) {
      return res.status(400).json({ success: false, error: 'Missing required fields' } as ApiResponse<never>);
    }
    const hashed = await bcrypt.hash(body.password, 10);
    const created = await EmployeeUser.create({
      firstName: body.firstName,
      lastName: body.lastName,
      gender: body.gender || 'Other',
      email: body.email.toLowerCase(),
      contactNumber: body.contactNumber,
      jobStatus: body.jobStatus,
      role: body.role === 'admin' ? 'HR' : (body.role.charAt(0).toUpperCase() + body.role.slice(1)) as any,
      password: hashed,
    });
    res.json({ success: true, data: { id: created._id.toString() } } as ApiResponse<any>);
  } catch (error) {
    console.error('createEmployee error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse<never>);
  }
};

export const getEmployees: RequestHandler = async (_req, res) => {
  try {
    const employees = await EmployeeUser.find().select('-password').sort({ firstName: 1, lastName: 1 }).lean();
    res.json({ success: true, data: employees } as ApiResponse<any[]>);
  } catch (error) {
    console.error('getEmployees error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse<never>);
  }
};

export const resetEmployeePassword: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params as any;
    const { newPassword } = req.body as any;
    if (!newPassword) return res.status(400).json({ success: false, error: 'New password required' } as ApiResponse<never>);
    const hashed = await bcrypt.hash(newPassword, 10);
    const updated = await EmployeeUser.findByIdAndUpdate(id, { password: hashed }, { new: true });
    if (!updated) return res.status(404).json({ success: false, error: 'Not found' } as ApiResponse<never>);
    res.json({ success: true, data: { id: updated._id.toString() } } as ApiResponse<any>);
  } catch (error) {
    console.error('resetEmployeePassword error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse<never>);
  }
};
