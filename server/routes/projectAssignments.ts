import { RequestHandler } from "express";
import { ProjectAssignment } from "../models/projectAssignment";
import { PMSUser } from "../models/pms";
import { connectToDatabase } from "../db/mongodb";
import { z } from "zod";

// Validation schemas
const createAssignmentSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  projectName: z.string().min(1, "Project name is required"),
  onBoarding: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), "Invalid onBoarding date format"),
  notes: z.string().optional(),
});

// Create new project assignment
export const createProjectAssignment: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const validatedData = createAssignmentSchema.parse(req.body);
    const managerId = req.user?.id;

    if (!managerId) {
      return res.status(401).json({
        success: false,
        error: "Manager authentication required",
      });
    }

    // Get employee details
    const employee = await PMSUser.findById(validatedData.employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found",
      });
    }

    // Create assignment
    const assignment = new ProjectAssignment({
      employeeId: validatedData.employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      projectName: validatedData.projectName,
      onBoarding: new Date(validatedData.onBoarding),
      notes: validatedData.notes,
      assignedBy: managerId,
    });

    await assignment.save();

    res.status(201).json({
      success: true,
      data: assignment,
      message: "Project assignment created successfully",
    });
  } catch (error) {
    console.error("Error creating project assignment:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to create project assignment",
    });
  }
};

// Get recent project assignments for a manager
export const getRecentAssignments: RequestHandler = async (req, res) => {
  console.log("🔍 getRecentAssignments called, managerId:", req.user?.id);

  try {
    await connectToDatabase();
    const managerId = req.user?.id;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!managerId) {
      console.log("❌ No manager ID found for assignments");
      return res.status(401).json({
        success: false,
        error: "Manager authentication required",
      });
    }

    console.log(
      "🔍 Searching for assignments with managerId:",
      managerId,
      "limit:",
      limit,
    );

    const assignments = await ProjectAssignment.find({ assignedBy: managerId })
      .sort({ assignedAt: -1 })
      .limit(limit);

    console.log("✅ Found assignments:", assignments.length);

    // Return empty array if no assignments found (this is normal for new managers)
    return res.json({
      success: true,
      data: assignments || [],
    });
  } catch (error) {
    console.error("❌ Error fetching recent assignments:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch recent assignments",
    });
  }
};

// Get team members for a manager
export const getTeamMembers: RequestHandler = async (req, res) => {
  console.log("🔍 getTeamMembers called, managerId:", req.user?.id);

  try {
    await connectToDatabase();
    const managerId = req.user?.id;

    if (!managerId) {
      console.log("❌ No manager ID found");
      return res.status(401).json({
        success: false,
        error: "Manager authentication required",
      });
    }

    console.log("🔍 Searching for team members with managerId:", managerId);

    // First, try PMSUser (which has managerId field)
    let teamMembers = await PMSUser.find({
      managerId: managerId,
      isActive: true,
      role: { $in: ["employee", "interviewer"] },
    }).select("-password");

    console.log("✅ Found PMSUser team members:", teamMembers.length);

    // If no PMSUser records found, return mock data for development
    if (teamMembers.length === 0) {
      console.log(
        "🔍 No PMSUser team members found, returning mock data for development",
      );

      // Return some mock employees for development/testing
      teamMembers = [
        {
          _id: "mock-emp-1",
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@company.com",
          department: "Engineering",
          role: "employee",
          isActive: true,
          managerId: managerId,
        },
        {
          _id: "mock-emp-2",
          firstName: "Jane",
          lastName: "Smith",
          email: "jane.smith@company.com",
          department: "Engineering",
          role: "employee",
          isActive: true,
          managerId: managerId,
        },
      ];
    }

    return res.json({
      success: true,
      data: teamMembers,
    });
  } catch (error) {
    console.error("❌ Error fetching team members:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch team members",
    });
  }
};

// Get assignments for a specific employee
export const getEmployeeAssignments: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const { employeeId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const assignments = await ProjectAssignment.find({ employeeId })
      .sort({ assignedAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    console.error("Error fetching employee assignments:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch employee assignments",
    });
  }
};

// Update assignment status
export const updateAssignmentStatus: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const { assignmentId } = req.params;
    const { status } = req.body;

    if (
      !["Assigned", "In Progress", "Completed", "Cancelled"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid status",
      });
    }

    const assignment = await ProjectAssignment.findByIdAndUpdate(
      assignmentId,
      { status },
      { new: true },
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: "Assignment not found",
      });
    }

    res.json({
      success: true,
      data: assignment,
      message: "Assignment status updated successfully",
    });
  } catch (error) {
    console.error("Error updating assignment status:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update assignment status",
    });
  }
};
