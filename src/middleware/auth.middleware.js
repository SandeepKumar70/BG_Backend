import jwt from "jsonwebtoken"
import { Employee } from "../model/employee.model.js";
import { Admin } from "../model/admin.model.js";

export const verifyJWT = (roles) => async (req, res, next) => {
    console.log("headers token: ", req.header('Authorization'))
    console.log("cookies token", req.cookies?.accessToken)
    console.log(roles)
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (!token) {
            return res.status(401).json({
                message: "Unauthorized request",
                success: false,
            })
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        let user;
        if (roles.includes('admin')) {
            user = await Admin.findById(decodedToken?._id).select("-password -refreshToken")
            if (!user && roles.includes('employee')) {
                user = await Employee.findById(decodedToken?._id).select("-password -refreshToken")
            }
        } else if (roles.includes('employee')) {
            user = await Employee.findById(decodedToken?._id).select("-password -refreshToken")
        }
        if (!user) {
            return res.status(401).json({
                message: "Access token not found",
                success: false,
            })
        }
        req.user = user
        req.role = user instanceof Admin ? 'admin' : 'employee'
        next()

    } catch (error) {
        return res.status(401).json({
            message: "Invalid access token",
            success: false,
        })
    }
}