import { RequestHandler } from 'express';
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

// Project Details Routes
export const getProjectDetails: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    let projects;
    if (user.role === 'admin') {
      projects = await ProjectDetail.find().sort({ createdAt: -1 });
    } else if (user.role === 'manager') {
      // Project managers see their assigned projects
      projects = await ProjectDetail.find({ 
        $or: [
          { projectManager: user.id },
          { teamMembers: user.id }
        ]
      }).sort({ createdAt: -1 });
    } else {
      // Other roles see projects they're part of
      projects = await ProjectDetail.find({ 
        teamMembers: user.id 
      }).sort({ createdAt: -1 });
    }

    res.json({
      success: true,
      data: projects
    } as ApiResponse<typeof projects>);
  } catch (error) {
    console.error('Get project details error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const createProjectDetail: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    // Only admin and managers can create projects
    if (user.role !== 'admin' && user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse<never>);
    }

    const project = new ProjectDetail(req.body);
    await project.save();

    res.status(201).json({
      success: true,
      data: project
    } as ApiResponse<typeof project>);
  } catch (error) {
    console.error('Create project detail error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

// Ticket Tracking Routes
export const getTickets: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    let tickets;
    if (user.role === 'admin') {
      tickets = await Ticket.find().sort({ createdAt: -1 });
    } else if (user.role === 'manager') {
      // Get projects managed by this user
      const managedProjects = await ProjectDetail.find({ projectManager: user.id });
      const projectIds = managedProjects.map(p => p._id.toString());
      
      tickets = await Ticket.find({ 
        $or: [
          { projectId: { $in: projectIds } },
          { assignedTo: user.id }
        ]
      }).sort({ createdAt: -1 });
    } else {
      // Other roles see tickets assigned to them
      tickets = await Ticket.find({ assignedTo: user.id }).sort({ createdAt: -1 });
    }

    res.json({
      success: true,
      data: tickets
    } as ApiResponse<typeof tickets>);
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const createTicket: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    // Generate unique ticket ID
    const ticketCount = await Ticket.countDocuments();
    const ticketId = `TKT-${(ticketCount + 1).toString().padStart(4, '0')}`;

    const ticket = new Ticket({
      ...req.body,
      ticketId,
      reportedBy: user.id
    });
    await ticket.save();

    res.status(201).json({
      success: true,
      data: ticket
    } as ApiResponse<typeof ticket>);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

// Standup Call Tracking Routes
export const getStandupCalls: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    let standups;
    if (user.role === 'admin') {
      standups = await StandupCall.find().sort({ date: -1 });
    } else if (user.role === 'manager') {
      const managedProjects = await ProjectDetail.find({ projectManager: user.id });
      const projectIds = managedProjects.map(p => p._id.toString());
      standups = await StandupCall.find({ projectId: { $in: projectIds } }).sort({ date: -1 });
    } else {
      // Find standups where user is an attendee
      standups = await StandupCall.find({ attendees: user.id }).sort({ date: -1 });
    }

    res.json({
      success: true,
      data: standups
    } as ApiResponse<typeof standups>);
  } catch (error) {
    console.error('Get standup calls error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const createStandupCall: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const standup = new StandupCall(req.body);
    await standup.save();

    res.status(201).json({
      success: true,
      data: standup
    } as ApiResponse<typeof standup>);
  } catch (error) {
    console.error('Create standup call error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

// Timesheet Routes
export const getTimesheets: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    let timesheets;
    if (user.role === 'admin') {
      timesheets = await Timesheet.find().sort({ date: -1 });
    } else if (user.role === 'manager') {
      // Get timesheets for projects they manage
      const managedProjects = await ProjectDetail.find({ projectManager: user.id });
      const projectIds = managedProjects.map(p => p._id.toString());
      timesheets = await Timesheet.find({ projectId: { $in: projectIds } }).sort({ date: -1 });
    } else {
      timesheets = await Timesheet.find({ userId: user.id }).sort({ date: -1 });
    }

    res.json({
      success: true,
      data: timesheets
    } as ApiResponse<typeof timesheets>);
  } catch (error) {
    console.error('Get timesheets error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const createTimesheet: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    const timesheet = new Timesheet({
      ...req.body,
      userId: user.id
    });
    await timesheet.save();

    res.status(201).json({
      success: true,
      data: timesheet
    } as ApiResponse<typeof timesheet>);
  } catch (error) {
    console.error('Create timesheet error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

// Accessories Routes
export const getAccessories: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    let accessories;
    if (user.role === 'admin' || user.role === 'hr') {
      accessories = await Accessory.find().sort({ assignedDate: -1 });
    } else {
      accessories = await Accessory.find({ userId: user.id }).sort({ assignedDate: -1 });
    }

    res.json({
      success: true,
      data: accessories
    } as ApiResponse<typeof accessories>);
  } catch (error) {
    console.error('Get accessories error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const createAccessory: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const accessory = new Accessory(req.body);
    await accessory.save();

    res.status(201).json({
      success: true,
      data: accessory
    } as ApiResponse<typeof accessory>);
  } catch (error) {
    console.error('Create accessory error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

// Birthday Routes
export const getBirthdays: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    
    // Get all birthdays
    const birthdays = await Birthday.find().sort({ birthday: 1 });
    
    // Filter for upcoming birthdays (next 30 days)
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);
    
    const upcomingBirthdays = birthdays.filter(birthday => {
      const birthdayThisYear = new Date(today.getFullYear(), birthday.birthday.getMonth(), birthday.birthday.getDate());
      const birthdayNextYear = new Date(today.getFullYear() + 1, birthday.birthday.getMonth(), birthday.birthday.getDate());
      
      return (birthdayThisYear >= today && birthdayThisYear <= nextMonth) ||
             (birthdayNextYear >= today && birthdayNextYear <= nextMonth);
    });

    res.json({
      success: true,
      data: {
        all: birthdays,
        upcoming: upcomingBirthdays
      }
    } as ApiResponse<{ all: typeof birthdays; upcoming: typeof upcomingBirthdays }>);
  } catch (error) {
    console.error('Get birthdays error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const createBirthday: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const birthday = new Birthday(req.body);
    await birthday.save();

    res.status(201).json({
      success: true,
      data: birthday
    } as ApiResponse<typeof birthday>);
  } catch (error) {
    console.error('Create birthday error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

// Enhanced Interview Feedback Routes
export const getInterviewFeedback: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    let feedback;
    if (user.role === 'admin') {
      feedback = await InterviewFeedbackEnhanced.find().sort({ createdAt: -1 });
    } else if (user.role === 'hr') {
      feedback = await InterviewFeedbackEnhanced.find().sort({ createdAt: -1 });
    } else {
      // Employees can only see their own feedback
      feedback = await InterviewFeedbackEnhanced.find({ 
        $or: [
          { intervieweeId: user.id },
          { interviewerId: user.id }
        ]
      }).sort({ createdAt: -1 });
    }

    res.json({
      success: true,
      data: feedback
    } as ApiResponse<typeof feedback>);
  } catch (error) {
    console.error('Get interview feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const createInterviewFeedback: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const feedback = new InterviewFeedbackEnhanced(req.body);
    await feedback.save();

    res.status(201).json({
      success: true,
      data: feedback
    } as ApiResponse<typeof feedback>);
  } catch (error) {
    console.error('Create interview feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const addAdminComments: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    // Only admin can add comments
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse<never>);
    }

    const { feedbackId, adminComments } = req.body;
    
    const feedback = await InterviewFeedbackEnhanced.findByIdAndUpdate(
      feedbackId,
      { adminComments },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      } as ApiResponse<never>);
    }

    res.json({
      success: true,
      data: feedback
    } as ApiResponse<typeof feedback>);
  } catch (error) {
    console.error('Add admin comments error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

// Utility Routes
export const getTimesheetReminders: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    // Check if user has submitted timesheet for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTimesheet = await Timesheet.findOne({
      userId: user.id,
      date: today,
      status: { $in: ['Submitted', 'Approved'] }
    });

    const needsReminder = !todayTimesheet;

    res.json({
      success: true,
      data: {
        needsReminder,
        message: needsReminder ? 'Please submit your timesheet for today' : 'Timesheet submitted'
      }
    } as ApiResponse<{ needsReminder: boolean; message: string }>);
  } catch (error) {
    console.error('Get timesheet reminders error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

// User Management Routes (Admin Only)
export const createEmployee: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    // Only admin can create employees
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.'
      } as ApiResponse<never>);
    }

    const { email, firstName, lastName, role, department, managerId } = req.body;

    // Check if user already exists
    const existingUser = await PMSUser.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      } as ApiResponse<never>);
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newEmployee = new PMSUser({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      department,
      managerId,
      isActive: true,
      requiresPasswordReset: true,
      isTemporaryPassword: true
    });

    await newEmployee.save();

    // Return user data without password but include temporary password for admin
    const responseData = {
      ...newEmployee.toObject(),
      temporaryPassword: tempPassword
    };
    delete responseData.password;

    res.status(201).json({
      success: true,
      data: responseData,
      message: `Employee created successfully. Temporary password: ${tempPassword}`
    } as ApiResponse<typeof responseData>);
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const getEmployees: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    // Only admin and HR can view all employees
    if (user.role !== 'admin' && user.role !== 'hr') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse<never>);
    }

    const employees = await PMSUser.find({}, { password: 0 }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: employees
    } as ApiResponse<typeof employees>);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const resetEmployeePassword: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;
    const { employeeId } = req.params;

    // Only admin can reset passwords
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.'
      } as ApiResponse<never>);
    }

    const employee = await PMSUser.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      } as ApiResponse<never>);
    }

    // Generate new temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    employee.password = hashedPassword;
    employee.requiresPasswordReset = true;
    employee.isTemporaryPassword = true;
    await employee.save();

    res.json({
      success: true,
      data: { temporaryPassword: tempPassword },
      message: `Password reset successfully. New temporary password: ${tempPassword}`
    } as ApiResponse<{ temporaryPassword: string }>);
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

// Enhanced Timesheet Routes
export const createTimesheetEntry: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    const { projectId, date, startTime, endTime, taskDescription, category, billable } = req.body;

    // Get project details
    const project = await ProjectDetail.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      } as ApiResponse<never>);
    }

    // Calculate hours worked
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    const hoursWorked = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    if (hoursWorked <= 0 || hoursWorked > 24) {
      return res.status(400).json({
        success: false,
        error: 'Invalid time range'
      } as ApiResponse<never>);
    }

    const timesheet = new Timesheet({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      projectId,
      projectName: project.projectName,
      date: new Date(date),
      startTime,
      endTime,
      hoursWorked,
      taskDescription,
      category: category || 'Development',
      billable: billable !== false,
      overtime: hoursWorked > 8,
      status: 'Draft'
    });

    await timesheet.save();

    res.status(201).json({
      success: true,
      data: timesheet
    } as ApiResponse<typeof timesheet>);
  } catch (error) {
    console.error('Create timesheet entry error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const getTimesheetEntries: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    let query: any = {};

    if (user.role === 'admin') {
      // Admin can see all timesheets
    } else if (user.role === 'manager') {
      // Project managers can see timesheets for their projects
      const managedProjects = await ProjectDetail.find({ projectManager: user.id });
      const projectIds = managedProjects.map(p => p._id.toString());

      query = {
        $or: [
          { userId: user.id }, // Their own timesheets
          { projectId: { $in: projectIds } } // Timesheets for projects they manage
        ]
      };
    } else {
      // Employees can only see their own timesheets
      query = { userId: user.id };
    }

    const timesheets = await Timesheet.find(query).sort({ date: -1, createdAt: -1 });

    res.json({
      success: true,
      data: timesheets
    } as ApiResponse<typeof timesheets>);
  } catch (error) {
    console.error('Get timesheet entries error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const updateTimesheetEntry: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;
    const { id } = req.params;

    const timesheet = await Timesheet.findById(id);
    if (!timesheet) {
      return res.status(404).json({
        success: false,
        error: 'Timesheet entry not found'
      } as ApiResponse<never>);
    }

    // Only owner can edit draft timesheets, admins can edit any
    if (timesheet.userId !== user.id && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse<never>);
    }

    // Can't edit approved/submitted timesheets unless admin
    if (timesheet.status !== 'Draft' && user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Cannot edit submitted timesheet'
      } as ApiResponse<never>);
    }

    const updates = req.body;

    // Recalculate hours if time changed
    if (updates.startTime || updates.endTime) {
      const date = updates.date || timesheet.date;
      const startTime = updates.startTime || timesheet.startTime;
      const endTime = updates.endTime || timesheet.endTime;

      const start = new Date(`${date}T${startTime}`);
      const end = new Date(`${date}T${endTime}`);
      const hoursWorked = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      updates.hoursWorked = hoursWorked;
      updates.overtime = hoursWorked > 8;
    }

    Object.assign(timesheet, updates);
    await timesheet.save();

    res.json({
      success: true,
      data: timesheet
    } as ApiResponse<typeof timesheet>);
  } catch (error) {
    console.error('Update timesheet entry error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const submitTimesheet: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;
    const { id } = req.params;

    const timesheet = await Timesheet.findById(id);
    if (!timesheet) {
      return res.status(404).json({
        success: false,
        error: 'Timesheet entry not found'
      } as ApiResponse<never>);
    }

    if (timesheet.userId !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse<never>);
    }

    if (timesheet.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        error: 'Timesheet already submitted'
      } as ApiResponse<never>);
    }

    timesheet.status = 'Submitted';
    await timesheet.save();

    res.json({
      success: true,
      data: timesheet,
      message: 'Timesheet submitted successfully'
    } as ApiResponse<typeof timesheet>);
  } catch (error) {
    console.error('Submit timesheet error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const approveTimesheet: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const authReq = req as AuthRequest;
    const user = authReq.user!;
    const { id } = req.params;

    // Only admins and managers can approve timesheets
    if (user.role !== 'admin' && user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse<never>);
    }

    const timesheet = await Timesheet.findById(id);
    if (!timesheet) {
      return res.status(404).json({
        success: false,
        error: 'Timesheet entry not found'
      } as ApiResponse<never>);
    }

    // Managers can only approve timesheets for their projects
    if (user.role === 'manager') {
      const project = await ProjectDetail.findById(timesheet.projectId);
      if (!project || project.projectManager !== user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only approve timesheets for your projects.'
        } as ApiResponse<never>);
      }
    }

    timesheet.status = 'Approved';
    timesheet.approvedBy = user.id;
    timesheet.approvedAt = new Date();
    await timesheet.save();

    res.json({
      success: true,
      data: timesheet,
      message: 'Timesheet approved successfully'
    } as ApiResponse<typeof timesheet>);
  } catch (error) {
    console.error('Approve timesheet error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};
