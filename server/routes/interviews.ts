import { RequestHandler } from "express";
import { AuthRequest } from "../middleware/auth";
import { EmployeeUser } from "../models/employeeManagement";
import { Interview, InterviewFeedback } from "../models/interview";
import {
  ScheduleInterviewRequest,
  SubmitFeedbackRequest,
  MockInterview,
  InterviewFeedback as IInterviewFeedback,
  ApiResponse,
} from "@shared/api";

export const scheduleInterview: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;
    const interviewData: ScheduleInterviewRequest = req.body;

    console.log("📅 Scheduling interview - Raw request:", req.body);
    console.log("📅 Scheduling interview - Parsed data:", interviewData);

    // Only HR and Admin can schedule interviews
    if (user.role !== "hr" && user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Only HR personnel can schedule interviews",
      } as ApiResponse<never>);
    }

    // Detailed validation with logging
    const missingFields = [];
    if (!interviewData.candidateId) missingFields.push("candidateId");
    if (!interviewData.interviewerId) missingFields.push("interviewerId");
    if (!interviewData.date) missingFields.push("date");
    if (!interviewData.time) missingFields.push("time");
    if (!interviewData.duration) missingFields.push("duration");
    if (!interviewData.type) missingFields.push("type");

    if (missingFields.length > 0) {
      console.log("❌ Missing required fields:", missingFields);
      console.log("📋 Received fields:", Object.keys(interviewData));
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(", ")}`,
      } as ApiResponse<never>);
    }

    // Validate that candidate and interviewer exist and are employees
    const candidate = await EmployeeUser.findById(
      interviewData.candidateId,
    ).select("-password");
    const interviewer = await EmployeeUser.findById(
      interviewData.interviewerId,
    ).select("-password");

    if (!candidate || !interviewer) {
      return res.status(404).json({
        success: false,
        error: "Candidate or interviewer not found",
      } as ApiResponse<never>);
    }

    if (
      candidate.role !== "Employee" ||
      (interviewer.role !== "Employee" && interviewer.role !== "Manager")
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Candidates must be employees and interviewers must be employees or managers",
      } as ApiResponse<never>);
    }

    // Check if the interviewer is available at the scheduled time
    const scheduledDate = new Date(interviewData.date);
    const [hours, minutes] = interviewData.time.split(":");
    scheduledDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const endTime = new Date(
      scheduledDate.getTime() + interviewData.duration * 60000,
    );

    const conflictingInterview = await Interview.findOne({
      interviewerId: interviewData.interviewerId,
      date: {
        $gte: new Date(
          scheduledDate.getTime() - interviewData.duration * 60000,
        ),
        $lte: endTime,
      },
      status: { $ne: "cancelled" },
    });

    if (conflictingInterview) {
      return res.status(409).json({
        success: false,
        error: "Interviewer is not available at the scheduled time",
      } as ApiResponse<never>);
    }

    // Create the interview
    const interview = new Interview({
      candidateId: candidate._id.toString(),
      interviewerId: interviewer._id.toString(),
      scheduledBy: user.id,
      date: scheduledDate,
      time: interviewData.time,
      duration: interviewData.duration,
      type: interviewData.type,
      status: "scheduled",
    });

    await interview.save();

    console.log("✅ Interview created:", interview._id);

    // Convert to the expected format
    const responseInterview: MockInterview = {
      id: interview._id.toString(),
      candidateId: interview.candidateId,
      interviewerId: interview.interviewerId,
      scheduledBy: interview.scheduledBy,
      scheduledAt: interview.date,
      duration: interview.duration,
      type: interview.type,
      status: interview.status,
      createdAt: interview.createdAt!,
      updatedAt: interview.updatedAt!,
    };

    res.status(201).json({
      success: true,
      data: responseInterview,
    } as ApiResponse<MockInterview>);
  } catch (error) {
    console.error("Schedule interview error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse<never>);
  }
};

export const getInterviews: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    console.log(
      "📋 Fetching interviews for user:",
      user.id,
      "role:",
      user.role,
    );

    let interviewQuery: any = {};

    if (user.role === "hr" || user.role === "admin") {
      // HR and Admin can see all interviews
      interviewQuery = {};
    } else {
      // Employees and managers see only their interviews
      interviewQuery = {
        $or: [
          { candidateId: user.id },
          { interviewerId: user.id },
          { scheduledBy: user.id },
        ],
      };
    }

    const interviews = await Interview.find(interviewQuery)
      .sort({ date: -1 })
      .limit(50);

    console.log("📋 Found interviews:", interviews.length);

    // Add user details to interviews
    const interviewsWithDetails = await Promise.all(
      interviews.map(async (interview) => {
        try {
          const candidate = await EmployeeUser.findById(
            interview.candidateId,
          ).select("-password");
          const interviewer = await EmployeeUser.findById(
            interview.interviewerId,
          ).select("-password");
          const scheduledBy = await EmployeeUser.findById(
            interview.scheduledBy,
          ).select("-password");

          return {
            id: interview._id.toString(),
            candidateId: interview.candidateId,
            interviewerId: interview.interviewerId,
            scheduledBy: interview.scheduledBy,
            scheduledAt: interview.date,
            duration: interview.duration,
            type: interview.type,
            status: interview.status,
            createdAt: interview.createdAt!,
            updatedAt: interview.updatedAt!,
            candidate: candidate
              ? {
                  id: candidate._id.toString(),
                  firstName: candidate.firstName,
                  lastName: candidate.lastName,
                  email: candidate.email,
                  department: candidate.department || "General",
                }
              : null,
            interviewer: interviewer
              ? {
                  id: interviewer._id.toString(),
                  firstName: interviewer.firstName,
                  lastName: interviewer.lastName,
                  email: interviewer.email,
                  department: interviewer.department || "General",
                }
              : null,
            scheduledByUser: scheduledBy
              ? {
                  id: scheduledBy._id.toString(),
                  firstName: scheduledBy.firstName,
                  lastName: scheduledBy.lastName,
                  email: scheduledBy.email,
                }
              : null,
          };
        } catch (err) {
          console.error("Error processing interview:", interview._id, err);
          return null;
        }
      }),
    );

    // Filter out any null results
    const validInterviews = interviewsWithDetails.filter(
      (interview) => interview !== null,
    );

    res.json({
      success: true,
      data: validInterviews,
    } as ApiResponse<typeof validInterviews>);
  } catch (error) {
    console.error("Get interviews error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse<never>);
  }
};

export const updateInterviewStatus: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;
    const { id } = req.params;
    const { status } = req.body;

    console.log("🔄 Updating interview status:", id, "to:", status);

    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: "Interview not found",
      } as ApiResponse<never>);
    }

    // Check permissions - only HR, admin, or the interviewer can update status
    if (
      user.role !== "hr" &&
      user.role !== "admin" &&
      user.id !== interview.interviewerId
    ) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      } as ApiResponse<never>);
    }

    // Update the interview status
    interview.status = status;
    await interview.save();

    const responseInterview: MockInterview = {
      id: interview._id.toString(),
      candidateId: interview.candidateId,
      interviewerId: interview.interviewerId,
      scheduledBy: interview.scheduledBy,
      scheduledAt: interview.date,
      duration: interview.duration,
      type: interview.type,
      status: interview.status,
      createdAt: interview.createdAt!,
      updatedAt: interview.updatedAt!,
    };

    res.json({
      success: true,
      data: responseInterview,
    } as ApiResponse<MockInterview>);
  } catch (error) {
    console.error("Update interview status error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse<never>);
  }
};

export const submitFeedback: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;
    const feedbackData: SubmitFeedbackRequest = req.body;

    console.log(
      "💬 Submitting feedback for interview:",
      feedbackData.interviewId,
    );

    const interview = await Interview.findById(feedbackData.interviewId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: "Interview not found",
      } as ApiResponse<never>);
    }

    // Anyone who has access to the interview can submit feedback
    if (
      user.role !== "hr" &&
      user.role !== "admin" &&
      user.id !== interview.interviewerId &&
      user.id !== interview.candidateId
    ) {
      return res.status(403).json({
        success: false,
        error:
          "Only interviewers, candidates, HR, or admin can submit feedback",
      } as ApiResponse<never>);
    }

    // Check if feedback already exists for this user and interview
    const existingFeedback = await InterviewFeedback.findOne({
      interviewId: feedbackData.interviewId,
      submittedBy: user.id,
    });

    if (existingFeedback) {
      return res.status(409).json({
        success: false,
        error: "Feedback already submitted for this interview",
      } as ApiResponse<never>);
    }

    // Create the feedback
    const feedback = new InterviewFeedback({
      interviewId: feedbackData.interviewId,
      candidateId: feedbackData.candidateId,
      submittedBy: user.id,
      ratings: feedbackData.ratings,
      writtenFeedback: feedbackData.writtenFeedback,
    });

    await feedback.save();

    console.log("✅ Feedback created:", feedback._id);

    // Convert to response format
    const responseFeedback: IInterviewFeedback = {
      id: feedback._id.toString(),
      interviewId: feedback.interviewId.toString(),
      candidateId: feedback.candidateId,
      submittedBy: feedback.submittedBy,
      ratings: feedback.ratings,
      writtenFeedback: feedback.writtenFeedback,
      createdAt: feedback.createdAt!,
      updatedAt: feedback.updatedAt!,
    };

    res.status(201).json({
      success: true,
      data: responseFeedback,
    } as ApiResponse<IInterviewFeedback>);
  } catch (error) {
    console.error("Submit feedback error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse<never>);
  }
};

export const getInterviewFeedback: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;
    const { id } = req.params;

    console.log("📝 Getting feedback for interview:", id);

    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: "Interview not found",
      } as ApiResponse<never>);
    }

    // Check permissions
    if (
      user.role !== "hr" &&
      user.role !== "admin" &&
      user.id !== interview.candidateId &&
      user.id !== interview.interviewerId
    ) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      } as ApiResponse<never>);
    }

    const feedbacks = await InterviewFeedback.find({
      interviewId: id,
    }).sort({ createdAt: -1 });

    if (feedbacks.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No feedback found for this interview",
      } as ApiResponse<never>);
    }

    // Convert to response format
    const responseFeedbacks = feedbacks.map((feedback) => ({
      id: feedback._id.toString(),
      interviewId: feedback.interviewId.toString(),
      candidateId: feedback.candidateId,
      submittedBy: feedback.submittedBy,
      ratings: feedback.ratings,
      writtenFeedback: feedback.writtenFeedback,
      createdAt: feedback.createdAt!,
      updatedAt: feedback.updatedAt!,
    }));

    res.json({
      success: true,
      data: responseFeedbacks,
    } as ApiResponse<IInterviewFeedback[]>);
  } catch (error) {
    console.error("Get interview feedback error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse<never>);
  }
};

export const getAvailableInterviewers: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    // Only HR and Admin can get this list
    if (user.role !== "hr" && user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      } as ApiResponse<never>);
    }

    const allUsers = await EmployeeUser.find({})
      .select("-password")
      .sort({ firstName: 1, lastName: 1 });

    const interviewers = allUsers
      .filter((u) => u.role === "Employee" || u.role === "Manager")
      .map((u) => ({
        id: u._id.toString(),
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        department: u.department || "General",
        role: u.role.toLowerCase(),
      }));

    res.json({
      success: true,
      data: interviewers,
    } as ApiResponse<typeof interviewers>);
  } catch (error) {
    console.error("Get available interviewers error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse<never>);
  }
};

export const getPendingInterviews: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    console.log("📋 Fetching pending interviews for user:", user.id, "role:", user.role);

    // Only Admin and HR can access this endpoint
    if (user.role !== "admin" && user.role !== "hr") {
      return res.status(403).json({
        success: false,
        error: "Only administrators and HR personnel can access pending interviews",
      } as ApiResponse<never>);
    }

    // Get all interviews with status "scheduled" (pending)
    const pendingInterviews = await Interview.find({
      status: "scheduled"
    }).sort({ date: 1, time: 1 }); // Sort by date and time

    console.log("📋 Found pending interviews:", pendingInterviews.length);

    // Get user details and feedback for each interview
    const interviewsWithDetails = await Promise.all(
      pendingInterviews.map(async (interview) => {
        try {
          const candidate = await EmployeeUser.findById(interview.candidateId).select("-password");
          const interviewer = await EmployeeUser.findById(interview.interviewerId).select("-password");

          // Get feedback for this interview
          const feedback = await InterviewFeedback.findOne({
            interviewId: interview._id
          });

          // Calculate average rating if feedback exists
          let averageRating = null;
          if (feedback) {
            const ratings = feedback.ratings;
            const totalRating = Object.values(ratings).reduce((sum, rating) => sum + rating, 0);
            averageRating = totalRating / Object.keys(ratings).length;
          }

          return {
            id: interview._id.toString(),
            candidateId: interview.candidateId,
            interviewerId: interview.interviewerId,
            scheduledBy: interview.scheduledBy,
            date: interview.date,
            time: interview.time,
            type: interview.type,
            duration: interview.duration,
            status: interview.status,
            createdAt: interview.createdAt!,
            updatedAt: interview.updatedAt!,
            candidate: candidate ? {
              id: candidate._id.toString(),
              firstName: candidate.firstName,
              lastName: candidate.lastName,
              email: candidate.email,
              department: candidate.department || "General",
            } : null,
            interviewer: interviewer ? {
              id: interviewer._id.toString(),
              firstName: interviewer.firstName,
              lastName: interviewer.lastName,
              email: interviewer.email,
              department: interviewer.department || "General",
            } : null,
            feedback: feedback ? {
              id: feedback._id.toString(),
              interviewId: feedback.interviewId.toString(),
              candidateId: feedback.candidateId,
              submittedBy: feedback.submittedBy,
              ratings: feedback.ratings,
              averageRating: Math.round(averageRating! * 10) / 10,
              writtenFeedback: feedback.writtenFeedback,
              createdAt: feedback.createdAt!,
              updatedAt: feedback.updatedAt!,
            } : null,
          };
        } catch (err) {
          console.error("Error processing interview:", interview._id, err);
          return null;
        }
      }),
    );

    // Filter out any null results
    const validInterviews = interviewsWithDetails.filter(
      (interview) => interview !== null,
    );

    res.json({
      success: true,
      data: validInterviews,
    } as ApiResponse<typeof validInterviews>);
  } catch (error) {
    console.error("Get pending interviews error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ApiResponse<never>);
  }
};
