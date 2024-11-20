import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const employeeSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    position: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    employeeId: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },
    phoneNo: {
      type: String,
    },
    currentAddress: {
      type: String,
    },
    permanentAddress: {
      type: String,
    },
    changepasswordcode: {
      type: String,
    },
    gender: {
      type: String,
      // enum: ['Male', 'Female', 'Other'],
    },
    dob: {
      type: String,
    },
    twitter: {
      type: String,
    },
    linkedIn: {
      type: String,
    },
    profileImageUrl: {
      type: String,
    },
    massage: [
      {
        message: String,
        sender: {
          type: String,
        },
        receiver: {
          type: String,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['sent', 'delivered', 'read'],
          default: 'sent'
        },
        read: { type: Boolean, default: false },
      },
    ],
    availability: [ 
      {
        availableTo: String,
        availableFrom: String,
        isAvailable: {
          type: Boolean,
          default: false,
        },
        date: {
          type: String,
        },
        owner: {
          type: String,
          required: true,
        },
        type: {
          type: String,
        },
        leaveId: {
          type: Schema.Types.ObjectId,
          ref: "Leave"
        }
      },
    ],
    ispasswordupdated: {
      type: Boolean,
      default: false,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    monthlyRating: {
      type: Number,
      default: 0,
    },
    maxMonthlyRating: {
      type: Number,
      default: 0,
    },
    snaekBreak: {
      type: String,
    },
    TeaBreak: {
      type: String,
    },
    LunchBreak: {
      type: String,
    },
    salary: {
      type: String,
    },
    joiningDate: {
      type: String,
      // required: true
    },
  },
  {
    timestamps: true,
  }
);

employeeSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

employeeSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

employeeSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
      employeeId: this.employeeId,
      position: this.position,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
employeeSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const Employee = mongoose.model("Employee", employeeSchema);
