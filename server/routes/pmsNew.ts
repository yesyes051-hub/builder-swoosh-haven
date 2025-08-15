import { RequestHandler } from 'express';
import { connectToDatabase } from '../db/mongodb';
import { 
  ProjectDetail, 
  Ticket, 
  StandupCall, 
  Timesheet, 
  Accessory, 
  Birthday,
  InterviewFeedbackEnhanced 
} from '../models/pms';
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
