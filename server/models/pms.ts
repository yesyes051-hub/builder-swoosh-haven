import mongoose, { Document, Schema } from 'mongoose';

// User Schema for PMS (Enhanced with password reset tracking)
export interface IPMSUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  gender?: 'Male' | 'Female' | 'Other';
  contactNumber?: string;
  jobStatus?: 'Intern' | 'Full-Time' | 'On-Job Training' | 'Part-Time';
  role: 'admin' | 'hr' | 'manager' | 'employee' | 'interviewer';
  department: string;
  managerId?: string;
  isActive: boolean;
  requiresPasswordReset: boolean;
  isTemporaryPassword: boolean;
  lastPasswordChange?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PMSUserSchema = new Schema<IPMSUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['admin', 'hr', 'manager', 'employee', 'interviewer'], required: true },
  department: { type: String, required: true },
  managerId: { type: String },
  isActive: { type: Boolean, default: true },
  requiresPasswordReset: { type: Boolean, default: false },
  isTemporaryPassword: { type: Boolean, default: false },
  lastPasswordChange: { type: Date },
}, { timestamps: true });

// Project Details Schema
export interface IProjectDetail extends Document {
  projectName: string;
  projectManager: string;
  startDate: Date;
  endDate?: Date;
  status: 'Planning' | 'In Progress' | 'In Review' | 'Completed' | 'On Hold';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  teamMembers: string[];
  budget?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectDetailSchema = new Schema<IProjectDetail>({
  projectName: { type: String, required: true },
  projectManager: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  status: { type: String, enum: ['Planning', 'In Progress', 'In Review', 'Completed', 'On Hold'], default: 'Planning' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  description: { type: String, required: true },
  teamMembers: [{ type: String }],
  budget: { type: Number },
}, { timestamps: true });

// Ticket Tracking Schema
export interface ITicket extends Document {
  ticketId: string;
  projectId: string;
  title: string;
  description: string;
  assignedTo: string;
  reportedBy: string;
  status: 'Pending' | 'In Progress' | 'In Review' | 'Completed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  type: 'Bug' | 'Feature' | 'Enhancement' | 'Task';
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new Schema<ITicket>({
  ticketId: { type: String, required: true, unique: true },
  projectId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  assignedTo: { type: String, required: true },
  reportedBy: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'In Progress', 'In Review', 'Completed'], default: 'Pending' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  type: { type: String, enum: ['Bug', 'Feature', 'Enhancement', 'Task'], required: true },
  estimatedHours: { type: Number },
  actualHours: { type: Number },
  dueDate: { type: Date },
}, { timestamps: true });

// Standup Call Tracking Schema
export interface IStandupCall extends Document {
  projectId: string;
  date: Date;
  attendees: string[];
  agenda: string[];
  decisions: string[];
  actionItems: {
    item: string;
    assignedTo: string;
    dueDate?: Date;
    status: 'Pending' | 'In Progress' | 'Completed';
  }[];
  duration: number; // in minutes
  facilitator: string;
  createdAt: Date;
  updatedAt: Date;
}

const StandupCallSchema = new Schema<IStandupCall>({
  projectId: { type: String, required: true },
  date: { type: Date, required: true },
  attendees: [{ type: String }],
  agenda: [{ type: String }],
  decisions: [{ type: String }],
  actionItems: [{
    item: { type: String, required: true },
    assignedTo: { type: String, required: true },
    dueDate: { type: Date },
    status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' }
  }],
  duration: { type: Number }, // in minutes
  facilitator: { type: String, required: true },
}, { timestamps: true });

// Timesheet Status Schema
export interface ITimesheet extends Document {
  userId: string;
  userName: string;
  userEmail: string;
  projectId: string;
  projectName: string;
  date: Date;
  startTime: string;
  endTime: string;
  hoursWorked: number;
  taskDescription: string;
  category: 'Development' | 'Testing' | 'Meeting' | 'Documentation' | 'Support' | 'Other';
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  billable: boolean;
  overtime: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TimesheetSchema = new Schema<ITimesheet>({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  projectId: { type: String, required: true },
  projectName: { type: String, required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  hoursWorked: { type: Number, required: true, min: 0, max: 24 },
  taskDescription: { type: String, required: true },
  category: { type: String, enum: ['Development', 'Testing', 'Meeting', 'Documentation', 'Support', 'Other'], default: 'Development' },
  status: { type: String, enum: ['Draft', 'Submitted', 'Approved', 'Rejected'], default: 'Draft' },
  approvedBy: { type: String },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
  billable: { type: Boolean, default: true },
  overtime: { type: Boolean, default: false },
}, { timestamps: true });

// Accessories Status Schema
export interface IAccessory extends Document {
  userId: string;
  itemName: string;
  itemType: 'Laptop' | 'Monitor' | 'Keyboard' | 'Mouse' | 'Headphones' | 'Other';
  serialNumber?: string;
  assignedDate: Date;
  returnDate?: Date;
  status: 'Assigned' | 'Returned' | 'Lost' | 'Damaged';
  condition: 'New' | 'Good' | 'Fair' | 'Poor';
  cost?: number;
  vendor?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AccessorySchema = new Schema<IAccessory>({
  userId: { type: String, required: true },
  itemName: { type: String, required: true },
  itemType: { type: String, enum: ['Laptop', 'Monitor', 'Keyboard', 'Mouse', 'Headphones', 'Other'], required: true },
  serialNumber: { type: String },
  assignedDate: { type: Date, required: true },
  returnDate: { type: Date },
  status: { type: String, enum: ['Assigned', 'Returned', 'Lost', 'Damaged'], default: 'Assigned' },
  condition: { type: String, enum: ['New', 'Good', 'Fair', 'Poor'], default: 'Good' },
  cost: { type: Number },
  vendor: { type: String },
  remarks: { type: String },
}, { timestamps: true });

// Birthday Schema
export interface IBirthday extends Document {
  userId: string;
  name: string;
  department: string;
  role: string;
  birthday: Date; // Only month and day matter
  email: string;
  wishSent: boolean;
  lastWishDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BirthdaySchema = new Schema<IBirthday>({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  department: { type: String, required: true },
  role: { type: String, required: true },
  birthday: { type: Date, required: true },
  email: { type: String, required: true },
  wishSent: { type: Boolean, default: false },
  lastWishDate: { type: Date },
}, { timestamps: true });

// Enhanced Interview Feedback Schema
export interface IInterviewFeedbackEnhanced extends Document {
  interviewId: string;
  intervieweeId: string;
  interviewerId: string;
  technicalSkills: number;
  communication: number;
  problemSolving: number;
  overallRating: number;
  strengths: string[];
  areasForImprovement: string[];
  detailedFeedback: string;
  recommendations: string;
  adminComments?: string;
  feedbackDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewFeedbackEnhancedSchema = new Schema<IInterviewFeedbackEnhanced>({
  interviewId: { type: String, required: true },
  intervieweeId: { type: String, required: true },
  interviewerId: { type: String, required: true },
  technicalSkills: { type: Number, required: true, min: 1, max: 10 },
  communication: { type: Number, required: true, min: 1, max: 10 },
  problemSolving: { type: Number, required: true, min: 1, max: 10 },
  overallRating: { type: Number, required: true, min: 1, max: 10 },
  strengths: [{ type: String }],
  areasForImprovement: [{ type: String }],
  detailedFeedback: { type: String, required: true },
  recommendations: { type: String },
  adminComments: { type: String },
  feedbackDate: { type: Date, default: Date.now },
}, { timestamps: true });

// Export models
export const PMSUser = mongoose.models.PMSUser || mongoose.model<IPMSUser>('PMSUser', PMSUserSchema);
export const ProjectDetail = mongoose.models.ProjectDetail || mongoose.model<IProjectDetail>('ProjectDetail', ProjectDetailSchema);
export const Ticket = mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);
export const StandupCall = mongoose.models.StandupCall || mongoose.model<IStandupCall>('StandupCall', StandupCallSchema);
export const Timesheet = mongoose.models.Timesheet || mongoose.model<ITimesheet>('Timesheet', TimesheetSchema);
export const Accessory = mongoose.models.Accessory || mongoose.model<IAccessory>('Accessory', AccessorySchema);
export const Birthday = mongoose.models.Birthday || mongoose.model<IBirthday>('Birthday', BirthdaySchema);
export const InterviewFeedbackEnhanced = mongoose.models.InterviewFeedbackEnhanced || mongoose.model<IInterviewFeedbackEnhanced>('InterviewFeedbackEnhanced', InterviewFeedbackEnhancedSchema);
