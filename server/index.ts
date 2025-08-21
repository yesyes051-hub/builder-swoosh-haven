import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { login, register, getProfile, resetPassword } from "./routes/auth";
import {
  getEmployeeDashboard,
  getManagerDashboard,
  getHRDashboard,
  getAdminDashboard,
} from "./routes/dashboard";
import {
  createDailyUpdate,
  getUserDailyUpdates,
  getTeamDailyUpdates,
  getDailyUpdateById,
} from "./routes/dailyUpdates";
import { getLeaderboard, getUserRank } from "./routes/leaderboard";
import {
  scheduleInterview,
  getInterviews,
  updateInterviewStatus,
  submitFeedback,
  getInterviewFeedback,
  getAvailableInterviewers,
} from "./routes/interviews";
import {
  getUserPerformanceData,
  getTeamPerformanceOverview,
} from "./routes/pms";
import {
  getProjectDetails,
  createProjectDetail,
  getTickets,
  createTicket,
  getStandupCalls,
  createStandupCall,
  getTimesheets,
  createTimesheet,
  getAccessories,
  createAccessory,
  getBirthdays,
  createBirthday,
  getInterviewFeedback,
  createInterviewFeedback,
  addAdminComments,
  getTimesheetReminders,
  createEmployee,
  getEmployees,
  resetEmployeePassword,
  createTimesheetEntry,
  getTimesheetEntries,
  updateTimesheetEntry,
  submitTimesheet,
  approveTimesheet,
} from "./routes/pmsNew";
import { createUser, getAllUsers } from "./routes/users";
import { getUserStats, getAllUsersForManagement } from "./routes/userStats";
import { updateUser } from "./routes/updateUser";
import { deleteUser } from "./routes/deleteUser";
<<<<<<< HEAD
import { getEmployeeCount, getAllEmployees, getEmployeesByRole } from "./routes/employees";
=======
import {
  getEmployeeCount,
  getAllEmployees,
  getEmployeesByRole,
} from "./routes/employees";
>>>>>>> refs/remotes/origin/main
import {
  createProjectAssignment,
  getRecentAssignments,
  getTeamMembers,
  getEmployeeAssignments,
  updateAssignmentStatus,
} from "./routes/projectAssignments";
import { authenticateToken, requireRole } from "./middleware/auth";
import { seedPMSData } from "./db/seedPMS";
import { seedEmployeeManagementData } from "./db/seedEmployeeManagement";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/login", login);
  app.post("/api/auth/register", register);
  app.get("/api/auth/profile", authenticateToken, getProfile);
  app.post("/api/auth/reset-password", authenticateToken, resetPassword);

  // Dashboard routes (protected)
  app.get(
    "/api/dashboard/employee",
    authenticateToken,
    requireRole(["employee"]),
    getEmployeeDashboard,
  );
  app.get(
    "/api/dashboard/manager",
    authenticateToken,
    requireRole(["manager"]),
    getManagerDashboard,
  );
  app.get(
    "/api/dashboard/hr",
    authenticateToken,
    requireRole(["hr"]),
    getHRDashboard,
  );
  app.get(
    "/api/dashboard/admin",
    authenticateToken,
    requireRole(["admin", "hr"]),
    getAdminDashboard,
  );

  // Daily Update routes (protected)
  app.post(
    "/api/daily-updates",
    authenticateToken,
    requireRole(["employee", "manager", "admin"]),
    createDailyUpdate,
  );
  app.get("/api/daily-updates", authenticateToken, getUserDailyUpdates);
  app.get(
    "/api/daily-updates/team",
    authenticateToken,
    requireRole(["manager", "admin"]),
    getTeamDailyUpdates,
  );
  app.get("/api/daily-updates/:id", authenticateToken, getDailyUpdateById);

  // Leaderboard routes (protected)
  app.get("/api/leaderboard", authenticateToken, getLeaderboard);
  app.get("/api/leaderboard/rank", authenticateToken, getUserRank);

  // Interview routes (protected)
  app.post(
    "/api/interviews",
    authenticateToken,
    requireRole(["hr", "admin"]),
    scheduleInterview,
  );
  app.get("/api/interviews", authenticateToken, getInterviews);
  app.put(
    "/api/interviews/:id/status",
    authenticateToken,
    updateInterviewStatus,
  );
  app.post("/api/interviews/feedback", authenticateToken, submitFeedback);
  app.get(
    "/api/interviews/:id/feedback",
    authenticateToken,
    getInterviewFeedback,
  );
  app.get(
    "/api/interviews/interviewers",
    authenticateToken,
    requireRole(["hr", "admin"]),
    getAvailableInterviewers,
  );

  // PMS (Performance Management System) routes (protected)
  app.get(
    "/api/pms/performance",
    authenticateToken,
    requireRole(["employee", "manager", "hr"]),
    getUserPerformanceData,
  );
  app.get(
    "/api/pms/team-overview",
    authenticateToken,
    requireRole(["manager", "hr", "admin"]),
    getTeamPerformanceOverview,
  );

  // New PMS Module Routes (MongoDB-based)
  // Project Details
  app.get("/api/pms/projects", authenticateToken, getProjectDetails);
  app.post(
    "/api/pms/projects",
    authenticateToken,
    requireRole(["admin", "manager"]),
    createProjectDetail,
  );

  // Ticket Tracking
  app.get("/api/pms/tickets", authenticateToken, getTickets);
  app.post("/api/pms/tickets", authenticateToken, createTicket);

  // Standup Call Tracking
  app.get("/api/pms/standups", authenticateToken, getStandupCalls);
  app.post(
    "/api/pms/standups",
    authenticateToken,
    requireRole(["admin", "manager"]),
    createStandupCall,
  );

  // Timesheet Status
  app.get("/api/pms/timesheets", authenticateToken, getTimesheets);
  app.post("/api/pms/timesheets", authenticateToken, createTimesheet);
  app.get(
    "/api/pms/timesheet-reminders",
    authenticateToken,
    getTimesheetReminders,
  );

  // Accessories Status
  app.get("/api/pms/accessories", authenticateToken, getAccessories);
  app.post(
    "/api/pms/accessories",
    authenticateToken,
    requireRole(["admin", "hr"]),
    createAccessory,
  );

  // Birthday Notifications
  app.get("/api/pms/birthdays", authenticateToken, getBirthdays);
  app.post(
    "/api/pms/birthdays",
    authenticateToken,
    requireRole(["admin", "hr"]),
    createBirthday,
  );

  // Enhanced Interview Feedback
  app.get(
    "/api/pms/interview-feedback",
    authenticateToken,
    getInterviewFeedback,
  );
  app.post(
    "/api/pms/interview-feedback",
    authenticateToken,
    createInterviewFeedback,
  );
  app.post(
    "/api/pms/interview-feedback/admin-comments",
    authenticateToken,
    requireRole(["admin"]),
    addAdminComments,
  );

  // User Management (Admin Only)
  app.post(
    "/api/pms/employees",
    authenticateToken,
    requireRole(["admin"]),
    createEmployee,
  );
  app.get(
    "/api/pms/employees",
    authenticateToken,
    requireRole(["admin", "hr"]),
    getEmployees,
  );
  app.post(
    "/api/pms/employees/:employeeId/reset-password",
    authenticateToken,
    requireRole(["admin"]),
    resetEmployeePassword,
  );

  // User Management for Admin Dashboard
  app.post(
    "/api/users",
    authenticateToken,
    requireRole(["admin", "hr"]),
    createUser,
  );
  app.get(
    "/api/users",
    authenticateToken,
    requireRole(["admin", "hr"]),
    getAllUsers,
  );
  app.put(
    "/api/users/:id",
    authenticateToken,
    requireRole(["admin", "hr"]),
    updateUser,
  );
  app.delete(
    "/api/users/:id",
    authenticateToken,
    requireRole(["admin", "hr"]),
    deleteUser,
  );

  // User Statistics and Management
  app.get(
    "/api/user-stats",
    authenticateToken,
    requireRole(["admin", "hr"]),
    getUserStats,
  );
  app.get(
    "/api/users/management",
    authenticateToken,
    requireRole(["admin", "hr"]),
    getAllUsersForManagement,
  );

  // Employee management endpoints
  app.get("/api/employees/count", authenticateToken, getEmployeeCount);
  app.get("/api/employees", authenticateToken, getAllEmployees);
  app.get("/api/employees/role/:role", authenticateToken, getEmployeesByRole);

  // Enhanced Timesheet System
  app.post("/api/pms-new/timesheets", authenticateToken, createTimesheetEntry);
  app.get("/api/pms-new/timesheets", authenticateToken, getTimesheetEntries);
  app.put(
    "/api/pms-new/timesheets/:id",
    authenticateToken,
    updateTimesheetEntry,
  );
  app.post(
    "/api/pms-new/timesheets/:id/submit",
    authenticateToken,
    submitTimesheet,
  );
  app.post(
    "/api/pms-new/timesheets/:id/approve",
    authenticateToken,
    requireRole(["admin", "manager"]),
    approveTimesheet,
  );

  // Project Assignment routes (Manager Only)
  app.post(
    "/api/project-assignments",
    authenticateToken,
    requireRole(["manager"]),
    createProjectAssignment,
  );
  app.get(
    "/api/project-assignments/recent",
    authenticateToken,
    requireRole(["manager"]),
    getRecentAssignments,
  );
  app.get(
    "/api/project-assignments/team-members",
    authenticateToken,
    requireRole(["manager"]),
    getTeamMembers,
  );
  app.get(
    "/api/project-assignments/employee/:employeeId",
    authenticateToken,
    getEmployeeAssignments,
  );
  app.put(
    "/api/project-assignments/:assignmentId/status",
    authenticateToken,
    updateAssignmentStatus,
  );

  // Initialize PMS data
  seedPMSData().catch(console.error);

  // Initialize Employee Management data
  seedEmployeeManagementData().catch(console.error);

  return app;
}
