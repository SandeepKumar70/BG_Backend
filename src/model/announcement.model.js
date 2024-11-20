import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    sender: {
      name: String,
      email: String,
    },
    category: {
      type: String,
      enum: ["General", "Event", "Emergency"],
      default: "General",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    imageUrl: {
      type: String,
    },
    expiryDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ category: 1, priority: 1 });

export const Announcement = mongoose.model("Announcement", announcementSchema);
