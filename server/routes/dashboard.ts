import { RequestHandler } from "express";
import { db } from "../db/memory";
import { EmployeeUser } from "../models/employeeManagement";
import { Interview } from "../models/interview";
import { AuthRequest } from "../middleware/auth";
import {
  EmployeeDashboard,
  ManagerDashboard,
  HRDashboard,
  AdminDashboard,
  ApiResponse,
} from "@shared/api";

export const getEmployeeDashboard: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    // Try to get user from new Employee Management system first
    let fullUser;
    try {
      const employeeUser = await EmployeeUser.findById(user.id).select(
        "-password",
      );
      if (employeeUser) {
        fullUser = {
          id: employeeUser._id.toString(),
          email: employeeUser.email,
          firstName: employeeUser.firstName,
          lastName: employeeUser.lastName,
          role: employeeUser.role.toLowerCase(),
          department: "General", // Default department
          isActive: true,
          createdAt: employeeUser.createdAt,
          updatedAt: employeeUser.createdAt,
        };
      }
    } catch (error) {
      console.log(
        "User not found in Employee Management system, trying memory database",
      );
    }

    // Fallback to memory database for existing users
    if (!fullUser) {
      // Try by email first since ID formats might be different
      fullUser = await db.getUserByEmail(user.email);
      if (!fullUser) {
        // As last resort, try by ID
        fullUser = await db.getUserById(user.id);
        if (!fullUser) {
          return res.status(404).json({
            success: false,
            error: "User not found",
          } as ApiResponse<never>);
        }
      }
    }

    // Safely get data from memory database, providing defaults for new users
    let recentUpdates, upcomingInterviews, currentProjects;
    try {
      recentUpdates = await db.getDailyUpdatesByUser(user.id, 5);
      upcomingInterviews = await db.getInterviewsByUser(user.id);
      currentProjects = await db.getProjectsByUser(user.id);
    } catch (error) {
      // For new users from Employee Management system, provide empty arrays
      recentUpdates = [];
      upcomingInterviews = [];
      currentProjects = [];
    }

    // Calculate performance stats
    const avgProgressScore =
      recentUpdates.length > 0
        ? recentUpdates.reduce((sum, update) => sum + update.progressScore, 0) /
          recentUpdates.length
        : 0;

    const dashboardData: EmployeeDashboard = {
      user: fullUser,
      recentUpdates,
      upcomingInterviews: upcomingInterviews.filter(
        (i) => i.status === "scheduled",
      ),
      currentProjects: currentProjects.filter((p) => p.status === "active"),
      leaderboardPosition: 1, // TODO: Calculate actual position
      performanceStats: {
        avgProgressScore: Math.round(avgProgressScore * 10) / 10,
        updateStreak: 0, // TODO: Calculate streak
        totalUpdates: recentUpdates.length,
      },
    };

    res.json({
      success: true,
      data: dashboardData,
    } as ApiResponse<EmployeeDashboard>);
  } catch (error) {
    console.error("Employee dashboard error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse<never>);
  }
};

export const getManagerDashboard: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    // Try to get user from new Employee Management system first
    let fullUser;
    try {
      const employeeUser = await EmployeeUser.findById(user.id).select(
        "-password",
      );
      if (employeeUser) {
        fullUser = {
          id: employeeUser._id.toString(),
          email: employeeUser.email,
          firstName: employeeUser.firstName,
          lastName: employeeUser.lastName,
          role: employeeUser.role.toLowerCase(),
          department: "General",
          isActive: true,
          createdAt: employeeUser.createdAt,
          updatedAt: employeeUser.createdAt,
        };
      }
    } catch (error) {
      console.log(
        "User not found in Employee Management system, trying memory database",
      );
    }

    // Fallback to memory database
    if (!fullUser) {
      // Try by email first since ID formats might be different
      fullUser = await db.getUserByEmail(user.email);
      if (!fullUser) {
        // As last resort, try by ID
        fullUser = await db.getUserById(user.id);
        if (!fullUser) {
          return res.status(404).json({
            success: false,
            error: "User not found",
          } as ApiResponse<never>);
        }
      }
    }

    // Safely get team data from memory database, providing defaults for new users
    let teamMembers = [];
    let recentTeamUpdates = [];
    let teamProjects = [];

    try {
      const allUsers = await db.getAllUsers();
      teamMembers = allUsers.filter((u) => u.managerId === user.id);
      const teamMemberIds = teamMembers.map((m) => m.id);
      recentTeamUpdates = await db.getDailyUpdatesByTeam(teamMemberIds, 10);
      teamProjects = await db.getProjectsByUser(user.id);
    } catch (error) {
      // For new users from Employee Management system, use empty arrays
      console.log("Manager dashboard: Using empty data for new user");
    }

    // Add user info to updates
    const updatesWithUser = recentTeamUpdates.map((update) => {
      const updateUser = teamMembers.find((u) => u.id === update.userId);
      return {
        ...update,
        user: {
          firstName: updateUser?.firstName || "",
          lastName: updateUser?.lastName || "",
        },
      };
    });

    const dashboardData: ManagerDashboard = {
      user: fullUser,
      teamMembers,
      recentTeamUpdates: updatesWithUser,
      teamProjects,
      teamPerformanceStats: {
        teamSize: teamMembers.length,
        avgTeamScore: 8.5, // TODO: Calculate from actual data
        activeProjects: teamProjects.filter((p) => p.status === "active")
          .length,
      },
    };

    res.json({
      success: true,
      data: dashboardData,
    } as ApiResponse<ManagerDashboard>);
  } catch (error) {
    console.error("Manager dashboard error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse<never>);
  }
};

export const getHRDashboard: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    // Try to get user from new Employee Management system first
    let fullUser;
    try {
      const employeeUser = await EmployeeUser.findById(user.id).select(
        "-password",
      );
      if (employeeUser) {
        fullUser = {
          id: employeeUser._id.toString(),
          email: employeeUser.email,
          firstName: employeeUser.firstName,
          lastName: employeeUser.lastName,
          role: employeeUser.role.toLowerCase(),
          department: "General",
          isActive: true,
          createdAt: employeeUser.createdAt,
          updatedAt: employeeUser.createdAt,
        };
      }
    } catch (error) {
      console.log(
        "User not found in Employee Management system, trying memory database",
      );
    }

    // Fallback to memory database
    if (!fullUser) {
      console.log(`🔍 HR Dashboard - Looking for user by ID: ${user.id}`);
      // Try by email first since ID formats might be different
      fullUser = await db.getUserByEmail(user.email);
      if (!fullUser) {
        // As last resort, try by ID
        fullUser = await db.getUserById(user.id);
        if (!fullUser) {
          console.log("❌ HR Dashboard - User not found in memory database");
          return res.status(404).json({
            success: false,
            error: "User not found",
          } as ApiResponse<never>);
        }
      } else {
        console.log(
          "✅ HR Dashboard - Found user in memory database:",
          fullUser.email,
        );
      }
    }

    // Safely get data from memory database, providing defaults for new users
    let scheduledInterviews = [];
    let allUsers = [];

    try {
      scheduledInterviews = await db.getInterviewsByUser(user.id);
      allUsers = await db.getAllUsers();
    } catch (error) {
      // For new users from Employee Management system, use empty arrays
      console.log("HR dashboard: Using empty data for new user");
    }

    const dashboardData: HRDashboard = {
      user: fullUser,
      scheduledInterviews: scheduledInterviews.filter(
        (i) => i.status === "scheduled",
      ),
      recentFeedback: [], // TODO: Get recent feedback
      departmentStats: {
        totalEmployees: allUsers.filter((u) => u.role === "employee").length,
        pendingInterviews: scheduledInterviews.filter(
          (i) => i.status === "scheduled",
        ).length,
        completedInterviews: scheduledInterviews.filter(
          (i) => i.status === "completed",
        ).length,
      },
    };

    res.json({
      success: true,
      data: dashboardData,
    } as ApiResponse<HRDashboard>);
  } catch (error) {
    console.error("HR dashboard error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse<never>);
  }
};

export const getAdminDashboard: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;
    console.log("🔍 Admin dashboard request - User from token:", user);

    // Try to get user from new Employee Management system first
    let fullUser;
    try {
      console.log(
        "🔍 Admin dashboard - Looking for user by MongoDB ID:",
        user.id,
      );
      const employeeUser = await EmployeeUser.findById(user.id).select(
        "-password",
      );
      if (employeeUser) {
        console.log(
          "✅ Admin dashboard - Found user in Employee Management system:",
          employeeUser.email,
        );
        fullUser = {
          id: employeeUser._id.toString(),
          email: employeeUser.email,
          firstName: employeeUser.firstName,
          lastName: employeeUser.lastName,
          role: employeeUser.role.toLowerCase(),
          department: "General",
          isActive: true,
          createdAt: employeeUser.createdAt,
          updatedAt: employeeUser.createdAt,
        };
      } else {
        console.log(
          "❌ Admin dashboard - User not found in Employee Management system by ID",
        );
      }
    } catch (error) {
      console.log(
        "❌ Admin dashboard - Error finding user in Employee Management system:",
        error,
      );
    }

    // Fallback to memory database
    if (!fullUser) {
      // Try by email first since ID formats might be different
      fullUser = await db.getUserByEmail(user.email);
      if (!fullUser) {
        // As last resort, try by ID
        fullUser = await db.getUserById(user.id);
        if (!fullUser) {
          return res.status(404).json({
            success: false,
            error: "User not found",
          } as ApiResponse<never>);
        }
      }
    }

    // Get data from both memory database and MongoDB
    let allUsers = [];
    let pendingInterviewsCount = 0;
    let totalEmployees = 0;
    let recentNewUsers = 0;
    let completedInterviews = 0;

    try {
      // Get all users from Employee Management MongoDB
      const allEmployeeUsers = await EmployeeUser.find({}).select("-password");
      totalEmployees = allEmployeeUsers.length;

      // Calculate new users in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      recentNewUsers = allEmployeeUsers.filter(user =>
        user.createdAt >= thirtyDaysAgo
      ).length;

      // Fallback to memory database for legacy data
      try {
        allUsers = await db.getAllUsers();
      } catch (error) {
        console.log("Admin dashboard: Memory database not available");
      }

      // Combine counts (avoid double counting)
      const totalUsers = Math.max(totalEmployees, allUsers.length);
      const activeUsers = totalEmployees; // All Employee Management users are considered active

      // Get pending interviews (scheduled status)
      pendingInterviewsCount = await Interview.countDocuments({
        status: "scheduled"
      });

      // Get completed interviews in last 30 days
      completedInterviews = await Interview.countDocuments({
        status: "completed",
        updatedAt: { $gte: thirtyDaysAgo }
      });

      const dashboardData: AdminDashboard = {
        user: fullUser,
        systemStats: {
          totalUsers,
          activeUsers,
          totalProjects: 0, // TODO: Get from projects when available
          pendingInterviews: pendingInterviewsCount,
        },
        recentActivity: {
          newUsers: recentNewUsers,
          newUpdates: 0, // TODO: Calculate from daily updates when available
          completedInterviews,
        },
      };

      console.log("✅ Admin dashboard - Real data fetched:", {
        totalUsers,
        activeUsers,
        pendingInterviews: pendingInterviewsCount,
        recentNewUsers,
        completedInterviews
      });

      res.json({
        success: true,
        data: dashboardData,
      } as ApiResponse<AdminDashboard>);
    } catch (error) {
      console.error("Error fetching admin dashboard data:", error);

      // Fallback to memory database data
      try {
        allUsers = await db.getAllUsers();
      } catch (dbError) {
        console.log("Admin dashboard: Using empty data for new user");
      }

      const dashboardData: AdminDashboard = {
        user: fullUser,
        systemStats: {
          totalUsers: allUsers.length,
          activeUsers: allUsers.filter((u) => u.isActive).length,
          totalProjects: 0,
          pendingInterviews: 0,
        },
        recentActivity: {
          newUsers: 0,
          newUpdates: 0,
          completedInterviews: 0,
        },
      };

      res.json({
        success: true,
        data: dashboardData,
      } as ApiResponse<AdminDashboard>);
    }

    console.log(
      "✅ Admin dashboard - Sending successful response with data for user:",
      fullUser.email,
    );
    res.json({
      success: true,
      data: dashboardData,
    } as ApiResponse<AdminDashboard>);
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse<never>);
  }
};
