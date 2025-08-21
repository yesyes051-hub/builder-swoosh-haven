import { RequestHandler } from 'express';
import { db } from '../db/memory';
import { AuthRequest } from '../middleware/auth';
import { EmployeeUser } from '../models/employeeManagement';
import {
  ScheduleInterviewRequest,
  SubmitFeedbackRequest,
  MockInterview,
  InterviewFeedback,
  ApiResponse
} from '@shared/api';

export const scheduleInterview: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;
    const interviewData: ScheduleInterviewRequest = req.body;

    // Only HR and Admin can schedule interviews
    if (user.role !== 'hr' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only HR personnel can schedule interviews'
      } as ApiResponse<never>);
    }

    if (!interviewData.candidateId || !interviewData.interviewerId || !interviewData.scheduledAt || !interviewData.duration || !interviewData.type) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      } as ApiResponse<never>);
    }

    // Validate that candidate and interviewer exist and are employees
    const candidate = await EmployeeUser.findById(interviewData.candidateId).select('-password');
    const interviewer = await EmployeeUser.findById(interviewData.interviewerId).select('-password');

    if (!candidate || !interviewer) {
      return res.status(404).json({
        success: false,
        error: 'Candidate or interviewer not found'
      } as ApiResponse<never>);
    }

    if (candidate.role.toLowerCase() !== 'employee' ||
        (interviewer.role.toLowerCase() !== 'employee' && interviewer.role.toLowerCase() !== 'manager')) {
      return res.status(400).json({
        success: false,
        error: 'Candidates must be employees and interviewers must be employees or managers'
      } as ApiResponse<never>);
    }

    // Check if the interviewer is available at the scheduled time
    const interviewerInterviews = await db.getInterviewsByUser(interviewData.interviewerId);
    const scheduledTime = new Date(interviewData.scheduledAt);
    const endTime = new Date(scheduledTime.getTime() + interviewData.duration * 60000);

    const conflictingInterview = interviewerInterviews.find(interview => {
      if (interview.status === 'cancelled') return false;
      
      const existingStart = new Date(interview.scheduledAt);
      const existingEnd = new Date(existingStart.getTime() + interview.duration * 60000);
      
      return (scheduledTime < existingEnd && endTime > existingStart);
    });

    if (conflictingInterview) {
      return res.status(409).json({
        success: false,
        error: 'Interviewer is not available at the scheduled time'
      } as ApiResponse<never>);
    }

    const interview = await db.createInterview({
      candidateId: interviewData.candidateId,
      interviewerId: interviewData.interviewerId,
      scheduledBy: user.id,
      scheduledAt: new Date(interviewData.scheduledAt),
      duration: interviewData.duration,
      type: interviewData.type,
      status: 'scheduled'
    });

    res.status(201).json({
      success: true,
      data: interview
    } as ApiResponse<MockInterview>);
  } catch (error) {
    console.error('Schedule interview error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const getInterviews: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    let interviews: MockInterview[] = [];

    if (user.role === 'hr' || user.role === 'admin') {
      // HR and Admin can see all interviews
      const allUsers = await db.getAllUsers();
      const allInterviews = await Promise.all(
        allUsers.map(u => db.getInterviewsByUser(u.id))
      );
      interviews = allInterviews.flat();
    } else {
      // Employees and managers see only their interviews
      interviews = await db.getInterviewsByUser(user.id);
    }

    // Add user details to interviews
    const interviewsWithDetails = await Promise.all(
      interviews.map(async (interview) => {
        const candidate = await db.getUserById(interview.candidateId);
        const interviewer = await db.getUserById(interview.interviewerId);
        const scheduledBy = await db.getUserById(interview.scheduledBy);

        return {
          ...interview,
          candidate: candidate ? {
            id: candidate.id,
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            email: candidate.email,
            department: candidate.department
          } : null,
          interviewer: interviewer ? {
            id: interviewer.id,
            firstName: interviewer.firstName,
            lastName: interviewer.lastName,
            email: interviewer.email,
            department: interviewer.department
          } : null,
          scheduledByUser: scheduledBy ? {
            id: scheduledBy.id,
            firstName: scheduledBy.firstName,
            lastName: scheduledBy.lastName,
            email: scheduledBy.email
          } : null
        };
      })
    );

    res.json({
      success: true,
      data: interviewsWithDetails
    } as ApiResponse<typeof interviewsWithDetails>);
  } catch (error) {
    console.error('Get interviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const updateInterviewStatus: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;
    const { id } = req.params;
    const { status } = req.body;

    const interview = await db.getInterviewById(id);
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      } as ApiResponse<never>);
    }

    // Check permissions - only HR, admin, or the interviewer can update status
    if (user.role !== 'hr' && user.role !== 'admin' && user.id !== interview.interviewerId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse<never>);
    }

    // Update the interview status in memory (in a real app, this would update the database)
    const updatedInterview = { ...interview, status, updatedAt: new Date() };
    
    res.json({
      success: true,
      data: updatedInterview
    } as ApiResponse<MockInterview>);
  } catch (error) {
    console.error('Update interview status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const submitFeedback: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;
    const feedbackData: SubmitFeedbackRequest = req.body;

    const interview = await db.getInterviewById(feedbackData.interviewId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      } as ApiResponse<never>);
    }

    // Only the interviewer can submit feedback
    if (user.id !== interview.interviewerId) {
      return res.status(403).json({
        success: false,
        error: 'Only the interviewer can submit feedback'
      } as ApiResponse<never>);
    }

    // Check if interview is completed
    if (interview.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Can only submit feedback for completed interviews'
      } as ApiResponse<never>);
    }

    // Check if feedback already exists
    const existingFeedback = await db.getFeedbackByInterview(feedbackData.interviewId);
    if (existingFeedback) {
      return res.status(409).json({
        success: false,
        error: 'Feedback already submitted for this interview'
      } as ApiResponse<never>);
    }

    const feedback = await db.createFeedback(feedbackData);

    res.status(201).json({
      success: true,
      data: feedback
    } as ApiResponse<InterviewFeedback>);
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const getInterviewFeedback: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;
    const { id } = req.params;

    const interview = await db.getInterviewById(id);
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      } as ApiResponse<never>);
    }

    // Check permissions
    if (user.role !== 'hr' && user.role !== 'admin' && 
        user.id !== interview.candidateId && user.id !== interview.interviewerId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse<never>);
    }

    const feedback = await db.getFeedbackByInterview(id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      } as ApiResponse<never>);
    }

    res.json({
      success: true,
      data: feedback
    } as ApiResponse<InterviewFeedback>);
  } catch (error) {
    console.error('Get interview feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const getAvailableInterviewers: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    // Only HR and Admin can get this list
    if (user.role !== 'hr' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse<never>);
    }

    const allUsers = await db.getAllUsers();
    const interviewers = allUsers.filter(u => 
      u.isActive && (u.role === 'employee' || u.role === 'manager')
    ).map(u => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      department: u.department,
      role: u.role
    }));

    res.json({
      success: true,
      data: interviewers
    } as ApiResponse<typeof interviewers>);
  } catch (error) {
    console.error('Get available interviewers error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};
