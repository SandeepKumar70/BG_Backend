import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}`)
        console.log(`\n Mongo Connected Successfully !! DB HOST: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("MongoDB connnection error !!.", error)
        process.exit(1)
    }
}

export default connectDB;