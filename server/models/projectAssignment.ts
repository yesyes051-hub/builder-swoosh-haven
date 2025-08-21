import mongoose, { Document, Schema } from "mongoose";

// Project Assignment Schema
export interface IProjectAssignment extends Document {
  employeeId: string; // Employee ID from PMSUser
  employeeName: string; // Employee name for easy display
  projectName: string;
  deadline: Date;
  priority: "High" | "Medium" | "Low";
  notes?: string;
  assignedBy: string; // Manager ID
  assignedAt: Date;
  status: "Assigned" | "In Progress" | "Completed" | "Cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const ProjectAssignmentSchema = new Schema<IProjectAssignment>(
  {
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    projectName: { type: String, required: true },
    deadline: { type: Date, required: true },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },
    notes: { type: String },
    assignedBy: { type: String, required: true },
    assignedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["Assigned", "In Progress", "Completed", "Cancelled"],
      default: "Assigned",
    },
  },
  { timestamps: true },
);

// Create indexes for better performance
ProjectAssignmentSchema.index({ employeeId: 1 });
ProjectAssignmentSchema.index({ assignedBy: 1 });
ProjectAssignmentSchema.index({ assignedAt: -1 });

export const ProjectAssignment =
  mongoose.models.ProjectAssignment ||
  mongoose.model<IProjectAssignment>(
    "ProjectAssignment",
    ProjectAssignmentSchema,
  );
