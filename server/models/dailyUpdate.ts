import mongoose, { Schema, Document } from "mongoose";

export interface IDailyUpdate extends Document {
  userId: string;
  date: Date; // normalized to 00:00:00
  tasks: string[];
  accomplishments: string[];
  challenges: string[];
  nextDayPlans: string[];
  progressScore: number; // 1-10
  createdAt: Date;
  updatedAt: Date;
}

const DailyUpdateSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    tasks: { type: [String], default: [] },
    accomplishments: { type: [String], default: [] },
    challenges: { type: [String], default: [] },
    nextDayPlans: { type: [String], default: [] },
    progressScore: { type: Number, min: 1, max: 10, required: true },
  },
  { timestamps: true }
);

// Ensure one update per user per day
DailyUpdateSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyUpdateModel =
  mongoose.models.DailyUpdate ||
  mongoose.model<IDailyUpdate>("DailyUpdate", DailyUpdateSchema);
