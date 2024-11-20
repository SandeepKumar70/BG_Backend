import mongoose from "mongoose";

const holidaySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  }
})

const employeeRoleSchema = new mongoose.Schema({
  value: {
    type: String,
    required: true
  }
})

const configSchema = new mongoose.Schema({
  holidays: [holidaySchema],
  options: [employeeRoleSchema]
})

export const Config = mongoose.model('Config', configSchema)
