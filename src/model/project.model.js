import mongoose, { Schema } from "mongoose";

const projectSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        link: {
            type: String,
        },
        startDate: {
            type: String,
            required: true
        },
        endDate: {
            type: String,
        },
        team : {
            type: Array
        },
        status: {
            type: String,
            enum: ['Not Started', 'In Progress', 'Completed', 'On Hold'],
            default: 'Not Started'
        },
        technologies: [{
            type: String
        }],
    },
    {
        timestamps: true
    }
)

export const Project = mongoose.model("Project", projectSchema)