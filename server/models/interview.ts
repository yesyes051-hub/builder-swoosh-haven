import mongoose, { Schema, Document } from "mongoose";

export interface IInterview extends Document {
  candidateId: string;
  interviewerId: string;
  scheduledBy: string;
  date: Date;
  time: string;
  type: "technical" | "behavioral" | "system-design" | "general";
  duration: number; // minutes
  status: "pending" | "accepted" | "rejected" | "scheduled" | "in-progress" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification extends Document {
  interviewId: mongoose.Types.ObjectId;
  candidateId: string;
  message: string;
  status: "unread" | "read";
  createdAt: Date;
  updatedAt: Date;
}

export interface IInterviewFeedback extends Document {
  interviewId: mongoose.Types.ObjectId;
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
}

const InterviewSchema: Schema = new Schema(
  {
    candidateId: { type: String, required: true },
    interviewerId: { type: String, required: true },
    scheduledBy: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    type: {
      type: String,
      enum: ["technical", "behavioral", "system-design", "general"],
      required: true,
    },
    duration: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "scheduled", "in-progress", "completed", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

const InterviewFeedbackSchema: Schema = new Schema(
  {
    interviewId: {
      type: Schema.Types.ObjectId,
      ref: "Interview",
      required: true,
    },
    candidateId: { type: String, required: true },
    submittedBy: { type: String, required: true },
    ratings: {
      communication: { type: Number, min: 1, max: 5, required: true },
      confidence: { type: Number, min: 1, max: 5, required: true },
      presenceOfMind: { type: Number, min: 1, max: 5, required: true },
      interpersonalSkills: { type: Number, min: 1, max: 5, required: true },
      bodyGesture: { type: Number, min: 1, max: 5, required: true },
      technicalQuestionHandling: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
      codingElaboration: { type: Number, min: 1, max: 5, required: true },
      energyInInterview: { type: Number, min: 1, max: 5, required: true },
      analyticalThinking: { type: Number, min: 1, max: 5, required: true },
    },
    writtenFeedback: { type: String, required: true },
  },
  {
    timestamps: true,
  },
);

const NotificationSchema: Schema = new Schema(
  {
    interviewId: {
      type: Schema.Types.ObjectId,
      ref: "Interview",
      required: true,
    },
    candidateId: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["unread", "read"],
      default: "unread",
    },
  },
  {
    timestamps: true,
  },
);

export const Interview = mongoose.model<IInterview>(
  "Interview",
  InterviewSchema,
);
export const InterviewFeedback = mongoose.model<IInterviewFeedback>(
  "InterviewFeedback",
  InterviewFeedbackSchema,
);
export const Notification = mongoose.model<INotification>(
  "Notification",
  NotificationSchema,
);
