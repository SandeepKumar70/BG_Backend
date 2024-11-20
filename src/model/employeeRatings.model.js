import mongoose, { Schema } from "mongoose";

const employeeRatingSchema = new Schema(
  {
    name: String,
    position: String,
    score: Number,
    status: String,
    rank: Number,
  },
  {
    timestamps: true,
  }
);

export const EmployeeRating = mongoose.model(
  "EmployeeRating",
  employeeRatingSchema
);
