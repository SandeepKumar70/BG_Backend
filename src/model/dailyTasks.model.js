import mongoose, { Schema} from "mongoose";

const dailyTasksSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            unique: true
        },
        desc: {
            type: String,
            required: true
        },
        timeFrom: {
            type: String,
        },
        timeTo: {
            type: String,
        },
        link: {
            type: String
        }
    },
    {
        timestamps: true
    }
)

export const DailyTasks = mongoose.model("DailyTasks", dailyTasksSchema)