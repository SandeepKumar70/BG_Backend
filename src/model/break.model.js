import mongoose, { Schema } from "mongoose";

const breakSchema = new Schema(
    {
        snacksBreakStart:{
            type:String,
        },
        teaBreakStart:{
            type:String,
        },
        lunchBreakStart:{
            type:String,
        },
        snacksBreakEnd:{
            type:String,
        },
        teaBreakEnd:{
            type:String,
        },
        lunchBreakEnd:{
            type:String,
        },
        breakType: {
            type: String,
            enum: ["Tea", "Lunch", "Snacks"]
        },
        date: {
            type: String
        },
        employeeId: {
            type: Schema.Types.ObjectId,
            ref: "Employee"
        }
    },
    {
        timestamps: true
    }
)

export const Break = mongoose.model("Break", breakSchema)