import mongoose, { Schema } from "mongoose";

const leaveSchema = new Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    leaveType: {
      type: String,
      enum: ["Absent", "Medical Leave", "Half-Day"],
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    date: {
        type: String,
        required: true
    }
  },
  {
    timestamps: true,
  }
);
export const Leave = mongoose.model("Leave", leaveSchema);
