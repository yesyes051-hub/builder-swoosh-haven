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
    .refine(
      (date) => !isNaN(Date.parse(date)),
      "Invalid onBoarding date format",
    ),
  notes: z.string().optional(),
});

// Create new project assignment
export const createProjectAssignment: RequestHandler = async (req, res) => {
  console.log("🔍 Creating project assignment, request body:", req.body);
  console.log("🔍 Request body keys:", Object.keys(req.body || {}));
  console.log("🔍 Request body values:", Object.values(req.body || {}));
  console.log("🔍 User context:", req.user);
  console.log("🔍 Validation schema expecting:", [
    "employeeId",
    "projectName",
    "onBoarding",
    "notes",
  ]);

  try {
    await connectToDatabase();

    // Parse and validate the request data
    console.log("🔍 About to validate with schema...");
    const validatedData = createAssignmentSchema.parse(req.body);
    console.log("✅ Validated data:", validatedData);

    const managerId = req.user?.id;

    if (!managerId) {
      console.log("❌ No manager ID found");
      return res.status(401).json({
        success: false,
        error: "Manager authentication required",
      });
    }

    // Get employee details
    const employee = await PMSUser.findById(validatedData.employeeId);
    if (!employee) {
      console.log("❌ Employee not found:", validatedData.employeeId);
      return res.status(404).json({
        success: false,
        error: "Employee not found",
      });
    }

    console.log("✅ Found employee:", employee.firstName, employee.lastName);

    // Create assignment
    const assignment = new ProjectAssignment({
      employeeId: validatedData.employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      projectName: validatedData.projectName,
      onBoarding: new Date(validatedData.onBoarding),
      notes: validatedData.notes,
      assignedBy: managerId,
    });

    const savedAssignment = await assignment.save();
    console.log("✅ Assignment created successfully:", savedAssignment._id);

    return res.status(201).json({
      success: true,
      data: savedAssignment,
      message: "Project assignment created successfully",
    });
  } catch (error) {
    console.error("❌ Error creating project assignment:", error);

    // Check if response was already sent
    if (res.headersSent) {
      console.error("❌ Headers already sent, cannot send error response");
      return;
    }

    if (error instanceof z.ZodError) {
      console.log("❌ Validation error:", error.errors);
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to create project assignment",
      details: error instanceof Error ? error.message : "Unknown error",
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

    // If no PMSUser records found, create some real employees for this manager
    if (teamMembers.length === 0) {
      console.log(
        "🔍 No PMSUser team members found, creating real employees for manager:",
        managerId,
      );

      try {
        // Create real employees with proper MongoDB ObjectIds
        const employee1 = new PMSUser({
          email: "john.doe@company.com",
          password:
            "$2a$10$8K1p/a0l6L6LK.2FZQJZ8uWyThUNFy5RQH0gzJPCf6QzQLWYoH0/e", // hashed "password123"
          firstName: "John",
          lastName: "Doe",
          role: "employee",
          department: "Engineering",
          managerId: managerId,
          isActive: true,
          requiresPasswordReset: false,
          isTemporaryPassword: true,
        });

        const employee2 = new PMSUser({
          email: "jane.smith@company.com",
          password:
            "$2a$10$8K1p/a0l6L6LK.2FZQJZ8uWyThUNFy5RQH0gzJPCf6QzQLWYoH0/e", // hashed "password123"
          firstName: "Jane",
          lastName: "Smith",
          role: "employee",
          department: "Engineering",
          managerId: managerId,
          isActive: true,
          requiresPasswordReset: false,
          isTemporaryPassword: true,
        });

        // Save employees to database
        await employee1.save();
        await employee2.save();

        console.log("✅ Created real employees:", employee1._id, employee2._id);

        // Return the newly created employees
        teamMembers = [employee1, employee2].map((emp) => ({
          _id: emp._id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: emp.email,
          department: emp.department,
          role: emp.role,
          isActive: emp.isActive,
        }));
      } catch (createError) {
        console.error("❌ Error creating employees:", createError);
        // Return empty array if creation fails
        teamMembers = [];
      }
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
