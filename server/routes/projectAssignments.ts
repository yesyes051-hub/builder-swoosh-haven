import { RequestHandler } from "express";
import { ProjectAssignment } from "../models/projectAssignment";
import { PMSUser } from "../models/pms";
import { connectToDatabase } from "../db/mongodb";
import { z } from "zod";

// Validation schemas
const createAssignmentSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  projectName: z.string().min(1, "Project name is required"),
  deadline: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid deadline format"),
  priority: z.enum(['High', 'Medium', 'Low']).default('Medium'),
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
        error: "Manager authentication required"
      });
    }

    // Get employee details
    const employee = await PMSUser.findById(validatedData.employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found"
      });
    }

    // Create assignment
    const assignment = new ProjectAssignment({
      employeeId: validatedData.employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      projectName: validatedData.projectName,
      deadline: new Date(validatedData.deadline),
      priority: validatedData.priority,
      notes: validatedData.notes,
      assignedBy: managerId,
    });

    await assignment.save();

    res.status(201).json({
      success: true,
      data: assignment,
      message: "Project assignment created successfully"
    });
  } catch (error) {
    console.error('Error creating project assignment:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create project assignment"
    });
  }
};

// Get recent project assignments for a manager
export const getRecentAssignments: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const managerId = req.user?.id;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!managerId) {
      return res.status(401).json({
        success: false,
        error: "Manager authentication required"
      });
    }

    const assignments = await ProjectAssignment.find({ assignedBy: managerId })
      .sort({ assignedAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching recent assignments:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch recent assignments"
    });
  }
};

// Get team members for a manager
export const getTeamMembers: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const managerId = req.user?.id;

    if (!managerId) {
      return res.status(401).json({
        success: false,
        error: "Manager authentication required"
      });
    }

    // Find all employees reporting to this manager
    const teamMembers = await PMSUser.find({ 
      managerId: managerId,
      isActive: true,
      role: { $in: ['employee', 'interviewer'] } // Exclude other managers/admins
    }).select('-password');

    res.json({
      success: true,
      data: teamMembers
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch team members"
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
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching employee assignments:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch employee assignments"
    });
  }
};

// Update assignment status
export const updateAssignmentStatus: RequestHandler = async (req, res) => {
  try {
    await connectToDatabase();
    const { assignmentId } = req.params;
    const { status } = req.body;

    if (!['Assigned', 'In Progress', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status"
      });
    }

    const assignment = await ProjectAssignment.findByIdAndUpdate(
      assignmentId,
      { status },
      { new: true }
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: "Assignment not found"
      });
    }

    res.json({
      success: true,
      data: assignment,
      message: "Assignment status updated successfully"
    });
  } catch (error) {
    console.error('Error updating assignment status:', error);
    res.status(500).json({
      success: false,
      error: "Failed to update assignment status"
    });
  }
};
