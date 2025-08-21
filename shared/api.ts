/**
 * Shared code between client and server
 * TrackZen - Employee Performance and Visibility Platform
 */

// User Roles
export type UserRole = 'admin' | 'hr' | 'manager' | 'employee' | 'interviewer';

// User Management
export interface User {
  id: string;
  email: string;
  password?: string; // Only on server side
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string;
  managerId?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'password'>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string;
  managerId?: string;
}

// Daily Updates
export interface DailyUpdate {
  id: string;
  userId: string;
  date: Date;
  tasks: string[];
  accomplishments: string[];
  challenges: string[];
  nextDayPlans: string[];
  progressScore: number; // 1-10
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDailyUpdateRequest {
  tasks: string[];
  accomplishments: string[];
  challenges: string[];
  nextDayPlans: string[];
  progressScore: number;
}

// Projects
export interface Project {
  id: string;
  name: string;
  description: string;
  managerId: string;
  teamMembers: string[]; // User IDs
  startDate: Date;
  endDate?: Date;
  status: 'planning' | 'active' | 'completed' | 'on-hold';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

// Mock Interviews
export interface MockInterview {
  id: string;
  candidateId: string; // Employee being interviewed
  interviewerId: string;
  scheduledBy: string; // HR user ID
  scheduledAt: Date;
  duration: number; // minutes
  type: 'technical' | 'behavioral' | 'system-design' | 'general';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface InterviewFeedback {
  id: string;
  interviewId: string;
  candidateId: string;
  submittedBy: string;
  ratings: {
    communication: number; // 1-5
    confidence: number; // 1-5
    presenceOfMind: number; // 1-5
    interpersonalSkills: number; // 1-5
    bodyGesture: number; // 1-5
    technicalQuestionHandling: number; // 1-5
    codingElaboration: number; // 1-5
    energyInInterview: number; // 1-5
    analyticalThinking: number; // 1-5
  };
  writtenFeedback: string;
  createdAt: Date;
  updatedAt: Date;
  // Legacy compatibility
  overallRating?: number; // calculated average
  technicalSkills?: number;
  communication?: number;
  problemSolving?: number;
  strengths?: string[];
  areasForImprovement?: string[];
  detailedFeedback?: string;
  recommendations?: string;
}

export interface ScheduleInterviewRequest {
  candidateId: string;
  interviewerId: string;
  scheduledAt: Date;
  duration: number;
  type: MockInterview['type'];
}

export interface SubmitFeedbackRequest {
  interviewId: string;
  overallRating: number;
  technicalSkills: number;
  communication: number;
  problemSolving: number;
  strengths: string[];
  areasForImprovement: string[];
  detailedFeedback: string;
  recommendations: string;
}

// Leaderboard
export interface LeaderboardEntry {
  userId: string;
  user: Pick<User, 'firstName' | 'lastName' | 'department'>;
  totalScore: number;
  rank: number;
  updateConsistency: number; // percentage of days with updates
  averageProgressScore: number;
  interviewPerformance: number;
  projectContributions: number;
  lastUpdated: Date;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  period: 'weekly' | 'monthly' | 'quarterly';
  generatedAt: Date;
}

// Dashboard Data
export interface EmployeeDashboard {
  user: User;
  recentUpdates: DailyUpdate[];
  upcomingInterviews: MockInterview[];
  currentProjects: Project[];
  leaderboardPosition: number;
  performanceStats: {
    avgProgressScore: number;
    updateStreak: number;
    totalUpdates: number;
  };
}

export interface ManagerDashboard {
  user: User;
  teamMembers: User[];
  recentTeamUpdates: (DailyUpdate & { user: Pick<User, 'firstName' | 'lastName'> })[];
  teamProjects: Project[];
  teamPerformanceStats: {
    teamSize: number;
    avgTeamScore: number;
    activeProjects: number;
  };
}

export interface HRDashboard {
  user: User;
  scheduledInterviews: MockInterview[];
  recentFeedback: InterviewFeedback[];
  departmentStats: {
    totalEmployees: number;
    pendingInterviews: number;
    completedInterviews: number;
  };
}

export interface AdminDashboard {
  user: User;
  systemStats: {
    totalUsers: number;
    activeUsers: number;
    totalProjects: number;
    pendingInterviews: number;
  };
  recentActivity: {
    newUsers: number;
    newUpdates: number;
    completedInterviews: number;
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Common pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
