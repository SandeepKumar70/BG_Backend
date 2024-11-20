import { Employee } from "../model/employee.model.js";
import { nanoid } from "nanoid";
import { notifyAdmin, onMailer } from "../utils/mailer.js";
import mongoose from "mongoose";
import { uploadFileonCloudinary } from "../utils/cloudinary.js";
import fs from "fs";
import { Task } from "../model/task.model.js";
import { Break } from "../model/break.model.js";
import { Leave } from "../model/leave.model.js";
import sendPasswordResetEmail from "../utils/changepassword.js";
import { Admin } from "../model/admin.model.js";
import { Config } from "../model/config.model.js";

const generateAccessAndRefreshToken = async (userid) => {
  try {
    const user = await Employee.findById(userid);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    return { accessToken, refreshToken };
  } catch (error) {
    return res.status(400).json({
      messaage: "something went wrong while creating user",
      success: false,
    });
  }
};
const createEmployee = async (req, res) => {
  const { name, position, email, employeeId, password, joiningDate } = req.body;
  const adminEmail = "jassijas182002@gmail.com"; // Admin's email address

  if (!name && !position && !employeeId && !email && password && !joiningDate) {
    return res.status(400).json({
      message: "All fields are required",
      success: false,
    });
  }

  const userExists = await Employee.findOne({ employeeId });
  if (userExists) {
    return res.status(400).json({
      message: "Employee id already exists",
      success: false,
    });
  }

  try {
    // const password = nanoid(10);
    if (!password) {
      return res.status(500).json({
        message: "Password is not created during employee registration",
        success: false,
      });
    }
    const createdUser = await Employee.create({
      name,
      position,
      email,
      employeeId,
      password,
      joiningDate
    });
    if (!createdUser) {
      return res.status(500).json({
        message: "Something went wrong while creating user!",
        success: false,
      });
    }
    const employeeMailSent = await onMailer(email, employeeId, password);
    const adminNotified = await notifyAdmin(adminEmail, createdUser);
    return res.status(200).json({
      message: "Employee created",
      data: createdUser,
      password: password,
      success: true,
      employeeMail: employeeMailSent
        ? "Mail sent successfully to employee"
        : "Could not send email to employee!",
      adminNotification: adminNotified
        ? "Admin notified successfully"
        : "Could not notify admin!",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error while creating employee",
      error: error.message,
      success: false,
    });
  }
};

const editEmployee = async(req, res) => {
  const { name, position, email, employeeId, password, joiningDate, _id } = req.body
  try {
    if (!name && !position && !email && !employeeId && !joiningDate) {
      return res.status(404).json({
        messaage: "All fields are required",
        success: false,
      });
    }

    const employee = await Employee.findByIdAndUpdate(
      _id,
      {
        $set: {
          name,
          position,
          email,
          employeeId,
          joiningDate
        }
      },
      { new: true }
    )

    if (!employee) {
      return res.status(500).json({
        messaage: "Employee Not Found !!",
        success: false,
      });
    }

    let passwordUpdate = false
    if (password && password.length > 7) {
      employee.password = password
      employee.save()
      passwordUpdate = true
    }

    return res.status(200).json({
      data: employee,
      passwordUpdated: passwordUpdate,
      messaage: "Employee Updated Successfully !!",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      messaage: "Error while editing employee. Try Later !!",
      success: false,
    });
  }
}
const updatePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const id = req.user?._id;
  if (!oldPassword && !newPassword) {
    return res.status(400).json({
      message: "All fields are required",
      success: false,
    });
  }
  try {
    const user = await Employee.findById(id);
    if (!user) {
      return res.status(400).json({
        messaage: "Invalid credentials",
        success: false,
      });
    }
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
      return res.status(400).json({
        status: 400,
        message: "Wrong Password",
        success: false,
      });
    }

    // console.log(isPasswordCorrect);
    user.password = newPassword;
    user.ispasswordupdated = true;
    await user.save({ validateBeforeSave: false });
    return res.status(200).json({
      messaage: "Password Update Successfully !!",
      data: user.ispasswordupdated,
      success: true,
    });
  } catch (error) {
    return res.status(400).json({
      messaage: "Something went wrong while Updating Password",
      success: false,
    });
  }
};
const loginEmployee = async (req, res) => {
  const { employeeId, password, date } = req.body;
  if (!employeeId || !password) {
    return res.status(400).json({
      message: "All fields are required",
      success: false,
    });
  }
  try {
    const user = await Employee.findOne({ employeeId });
    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
        success: false,
      });
    }
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Wrong Password",
        success: false,
      });
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );
    const now = new Date();
    const formattedLoginTimestamp = date;
    const today = now;

    if (user.availability && Array.isArray(user.availability)) {
      const todayAvailabilityIndex = user.availability.findIndex((entry) => {
        if (entry && entry.availableFrom) {
          console.log("Entry availableFrom:", entry.availableFrom); // Debug log
          const entryDate = parseCustomDate(entry.availableFrom);
          return (
            entryDate.getDate() === today.getDate() &&
            entryDate.getMonth() === today.getMonth() &&
            entryDate.getFullYear() === today.getFullYear()
          );
        }
        return false;
      });

      if (todayAvailabilityIndex !== -1) {
        user.availability[todayAvailabilityIndex].isAvailable = true;
      } else {
        const newAvailability = {
          availableFrom: formattedLoginTimestamp,
          owner: "Employee",
          isAvailable: true,
        };
        user.availability.push(newAvailability);
      }
    } else {
      user.availability = [
        {
          availableFrom: formattedLoginTimestamp,
          owner: "Employee",
          isAvailable: true,
          type: "Full-Day",
        },
      ];
      // user.availability.push(newAvailability);
    }

    user.refreshToken = refreshToken;
    user.isOnline = true;
    await user.save();
    const loggedInUser = await Employee.findById(user._id).select(
      "-password -refreshToken"
    );
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        data: loggedInUser,
        id: loggedInUser._id,
        senderType: "employee",
        accessToken,
        message: "Logged In Successfully!",
        success: true,
      });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong while logging in user",
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};
function parseCustomDate(dateString) {
  if (!dateString) {
    console.error("Invalid date string:", dateString);
    return new Date(); // Return current date as fallback
  }
  const [datePart, timePart] = dateString.split(",");
  const [day, month, year] = datePart.split("-");
  const [time, ampm] = timePart.split(/(?=[ap]m)/i);
  const [hours, minutes] = time.split(":");
  let parsedHours = parseInt(hours);
  if (ampm.toLowerCase() === "pm" && parsedHours !== 12) {
    parsedHours += 12;
  } else if (ampm.toLowerCase() === "am" && parsedHours === 12) {
    parsedHours = 0;
  }
  return new Date(year, month - 1, day, parsedHours, parseInt(minutes));
}
const logoutEmployee = async (req, res) => {
  const { id, date } = req.body;
  console.log(req.body)
  if (!id) {
    return res.status(400).json({
      message: "All fields are required",
      success: false,
    });
  }
  console.log("Req Body", req.body);

  try {
    const user = await Employee.findById(req.user?._id);
    // const now = new Date();
    const formattedLoginTimestamp = date;

    // Update the specific availability entry
    const updatedUser = await Employee.findOneAndUpdate(
      {
        _id: user._id,
        "availability._id": new mongoose.Types.ObjectId(id),
      },
      {
        $set: {
          "availability.$.availableTo": formattedLoginTimestamp,
          // "availability.$.isAvailable": false,
          isOnline: false,
        },
      },
      { new: true }
    );
    console.log("updatedUser =>", updatedUser);

    if (!updatedUser) {
      return res.status(404).json({
        message: "User or availability entry not found",
        success: false,
      });
    }

    console.log("Updated User", updatedUser);

    const options = {
      httpOnly: true,
      secure: false,
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json({
        message: "Employee Logged Out Successfully",
        success: true,
        data: updatedUser,
      });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({
      message: "Error While Employee Logged Out",
      success: false,
      error: error.message,
    });
  }
};
function formatDate(date) {
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedTime = `${hours}:${minutes}${ampm}`;

  return `${day}-${month}-${year},${formattedTime}`;
}

const getAllEmployee = async (req, res) => {
  const { year, month } = req.body; // Assuming year and month are provided in the request body

  try {
    const pipeline = [
      {
        $addFields: {
          availabilityArray: {
            $cond: {
              if: { $isArray: "$availability" },
              then: "$availability",
              else: [],
            },
          },
        },
      },
      {
        $unwind: {
          path: "$availabilityArray",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          parsedDate: {
            $cond: {
              if: { $ne: ["$availabilityArray", undefined] },
              then: {
                $dateFromString: {
                  dateString: {
                    $arrayElemAt: [
                      { $split: ["$availabilityArray.availableFrom", ","] },
                      0,
                    ],
                  },
                  format: "%d-%m-%Y",
                },
              },
              else: null,
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          employee: { $first: "$$ROOT" },
          loginCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$parsedDate", null] },
                    { $eq: [{ $year: "$parsedDate" }, parseInt(year)] },
                    { $eq: [{ $month: "$parsedDate" }, parseInt(month)] },
                  ],
                },
                {
                  $cond: [
                    { $eq: ["$availabilityArray.type", "Half-Day"] },
                    0.5,
                    1,
                  ],
                },
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          employee: {
            $mergeObjects: [
              {
                $arrayToObject: {
                  $filter: {
                    input: { $objectToArray: "$employee" },
                    cond: { $ne: ["$$this.k", "availabilityArray"] },
                  },
                },
              },
              { loginCount: "$loginCount" },
            ],
          },
        },
      },
      {
        $sort: { "employee.createdAt": -1 },
      },
    ];

    const allEmployees = await Employee.aggregate(pipeline);

    const employeePositions = await Employee.aggregate([
      {
        $group: {
          _id: "$position",
          value: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          value: 1,
        },
      },
      {
        $sort: { value: -1 },
      },
    ]);

    console.log("employee Positions: ", employeePositions);

    if (!allEmployees || allEmployees.length === 0) {
      return res.status(404).json({
        message: "No employees found",
        success: false,
      });
    }

    // Remove sensitive information
    const sanitizedEmployees = allEmployees.map(({ employee }) => {
      const { password, refreshToken, ...sanitizedEmployee } = employee;
      return sanitizedEmployee;
    });

    return res.status(200).json({
      message: "All Employees fetched with login counts!",
      data: sanitizedEmployees,
      positionsSummary: employeePositions,
      count: sanitizedEmployees.length,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Something went wrong while fetching all employees",
      success: false,
    });
  }
};

const getEmployeeData = async (req, res) => {
  let id;
  if (req.body._id) {
    id = new mongoose.Types.ObjectId(req.body._id);
  } else if (req.user?._id) {
    id = req.user?._id;
  }
  try {
    const employee = await Employee.findById(id).select(
      "-password -refreshToken"
    );

    if (!employee) {
      return res.status(400).json({
        messaage: "Employee not found",
        success: false,
      });
    }

    return res.status(200).json({
      data: employee,
      messaage: "Employee fetched !!",
      success: true,
    });
  } catch (error) {
    return res.status(200).json({
      messaage: "error while getting Employee data !!",
      success: false,
    });
  }
};
const getSpecificEmployeeTasks = async (req, res) => {
  const { _id } = req.body;
  let id;
  if (req.body._id) {
    id = req.body._id;
  } else if (req.user?._id) {
    id = req.user?._id;
  }

  try {
    const employee = await Employee.findById({ id });

    if (!employee) {
      return res.status(400).json({
        messaage: "employee not found",
        success: false,
      });
    }

    const tasks = employee.tasks;

    return res.status(500).json({
      data: tasks,
      messaage: "tasks fetched !!",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      messaage: "something went wrong while fetching tasks",
      success: false,
    });
  }
};
const getCurrentEmployee = async (req, res) => {
  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const { _id } = req.query;
  let id;
  if (_id) {
    id = new mongoose.Types.ObjectId(_id);
  } else {
    id = req.user?._id;
  }
  try {
    const pipeline = [
      {
        $match: {
          _id: id,
        },
      },
      {
        $addFields: {
          availabilityArray: {
            $cond: {
              if: { $isArray: "$availability" },
              then: "$availability",
              else: [],
            },
          },
        },
      },
      {
        $unwind: {
          path: "$availabilityArray",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          parsedDate: {
            $cond: {
              if: { $ne: ["$availabilityArray", undefined] },
              then: {
                $dateFromString: {
                  dateString: {
                    $arrayElemAt: [
                      { $split: ["$availabilityArray.availableFrom", ","] },
                      0,
                    ],
                  },
                  format: "%d-%m-%Y",
                },
              },
              else: null,
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          employee: { $first: "$$ROOT" },
          loginCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$parsedDate", null] },
                    { $eq: [{ $year: "$parsedDate" }, parseInt(year)] },
                    { $eq: [{ $month: "$parsedDate" }, parseInt(month)] },
                  ],
                },
                {
                  $cond: [
                    { $eq: ["$availabilityArray.type", "Half-Day"] },
                    0.5,
                    1,
                  ],
                },
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          employee: {
            $mergeObjects: [
              {
                $arrayToObject: {
                  $filter: {
                    input: { $objectToArray: "$employee" },
                    cond: { $ne: ["$$this.k", "availabilityArray"] },
                  },
                },
              },
              { loginCount: "$loginCount" },
            ],
          },
        },
      },
    ];
    const employee = await Employee.aggregate(pipeline);

    if (!employee) {
      return res.status(404).json({
        message: "No employees found",
        success: false,
      });
    }

    // Remove sensitive information
    const sanitizedEmployees = employee.map(({ employee }) => {
      const { password, refreshToken, ...sanitizedEmployee } = employee;
      return sanitizedEmployee;
    });

    console.log("sanitizedEmployees: ", sanitizedEmployees);

    return res.status(200).json({
      message: "All Employees fetched with login counts!",
      data: sanitizedEmployees[0],
      count: sanitizedEmployees.length,
      success: true,
    });

    // const employee = await Employee.findById(req.user?._id).select(
    //   "-password -refreshToken"
    // );

    // if (!employee) {
    //   return res.status(400).json({
    //     messaage: "Employee Not Found !!",
    //     success: false,
    //   });
    // }

    // return res.status(200).json({
    //   data: employee,
    //   messaage: "Employee fetched !!",
    //   success: true,
    // });
  } catch (error) {
    return res.status(500).json({
      messaage: "Error while fetching employee !!",
      success: false,
    });
  }
};
const getSpecificEmployeeData = async (req, res) => {
  const { id } = req.body;
  let _id;
  if (id) {
    _id = new mongoose.Types.ObjectId(id);
  } else {
    _id = req.user?._id;
  }
  console.log("Req Body", req.body);
  if (!_id) {
    return res.status(400).json({
      messaage: "Employee ID is required",
      success: false,
    });
  }
  try {
    const employee = await Employee.findById(_id).select(
      "-password -refreshToken"
    );
    if (!employee) {
      return res.status(400).json({
        messaage: "Employee Not Found!!",
        success: false,
      });
    }

    return res.status(200).json({
      data: employee,
      messaage: "Employee fetched!!",
      success: true,
    });
  } catch (error) {}
};
const uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  console.log("Uploading image =>", req.file);

  if (!fs.existsSync(req.file.path)) {
    return res
      .status(400)
      .json({ error: "File does not exist at the specified path" });
  }
  try {
    console.log("Image Path =>", req.file.path);
    const result = await uploadFileonCloudinary(req.file.path);
    console.log("Result =>", result);
    if (result && result.url) {
      res.json({ url: result.url });
    } else {
      throw new Error("Failed to upload image to Cloudinary");
    }
  } catch (error) {
    console.error("Error in image upload:", error);
    res
      .status(500)
      .json({ error: "Failed to upload image", details: error.message });
  }
};
const updateEmployee = async (req, res) => {
  const { profile } = req.body;
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          name: profile.firstName,
          email: profile.email,
          phoneNo: profile.phone,
          permanentAddress: profile.permanentAddress,
          currentAddress: profile.currentAddress,
          gender: profile.gender,
          dob: profile.dateOfBirth,
          twitter: profile.twitter,
          linkedIn: profile.linkedIn,
          profileImageUrl: profile.profileImageUrl,
        },
      },
      { new: true }
    ).select("-password -refreshToken");
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    return res.status(200).json({
      message: "Employee updated successfully",
      employee,
      success: true,
    });
  } catch (error) {
    console.error("Error in updating employee:", error);
    res
      .status(500)
      .json({ message: "Failed to update employee", details: error.message });
  }
};
const changeNewPassword = async (req, res) => {
  const { newPassword, otp, id } = req.body;
  if (!newPassword || !otp || !id) {
    return res.status(400).json({
      message: "New password, OTP, and employee ID are required",
      success: false,
    });
  }

  try {
    console.log("EmployeeID and OTP =>", id, otp);
    const employee = await Employee.findOne({
      employeeId: id,
      changepasswordcode: otp,
    });
    console.log("Employee found =>", employee);
    if (!employee) {
      return res.status(404).json({
        message: "Employee not found or OTP is expired",
        success: false,
      });
    }
    employee.password = newPassword;
    employee.changepasswordcode = null;
    await employee.save();

    return res.status(200).json({
      message: "Password updated successfully",
      employee: employee,
      success: true,
    });
  } catch (error) {
    console.error("Error in changing new password:", error);
    return res.status(500).json({
      message: "Failed to update password",
      details: error.message,
      success: false,
    });
  }
};
const getEmployeeRatings = async (req, res) => {
  try {
    const employees = await Employee.find().select(
      "name position monthlyRating maxMonthlyRating"
    );

    const getStatus = (score) => {
      if (score >= 90) return "Excellent";
      if (score >= 80) return "Very Good";
      if (score >= 70) return "Good";
      if (score >= 60) return "Satisfactory";
      return "Poor";
    };

    const statusCounts = {
      Excellent: 0,
      "Very Good": 0,
      Good: 0,
      Satisfactory: 0,
      Poor: 0,
    };

    const employeeRatings = employees.map((employee) => {
      const averageScore =
        employee.maxMonthlyRating > 0
          ? (employee.monthlyRating / employee.maxMonthlyRating) * 100
          : 0

      const roundedScore = Math.round(averageScore);
      const status = getStatus(roundedScore); 

      // Increment the count for this status
      statusCounts[status]++;

      return {
        name: employee.name,
        position: employee.position,
        score: roundedScore,
        status: status,
      };
    });

    // Sort employees by score in descending order
    employeeRatings.sort((a, b) => b.score - a.score);

    // Add rank to each employee
    const rankedEmployeeRatings = employeeRatings.map((employee, index) => ({
      rank: index + 1,
      ...employee,
    }))

    // Convert statusCounts to the format needed for the pie chart
    const statusData = Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
    }));

    return res.status(200).json({
      message: "Employee ratings fetched successfully",
      data: {
        employeeRatings: rankedEmployeeRatings,
        statusSummary: statusData,
      },
      success: true,
    });
  } catch (error) {
    console.error("Error in getEmployeeRatings:", error);
    return res.status(500).json({
      error: error.message,
      message: "Error while fetching employee ratings",
      success: false,
    });
  }
};

const checkSalary = async (req, res) => {
  const employeeId = req.user?._id;
  const { password } = req.body;
  console.log("password =>", password, employeeId);
  if (!employeeId || !password) {
    return res.status(400).json({
      message: "Enter a Rights Password",
      success: false,
    });
  }
  try {
    const user = await Employee.findById({ _id: employeeId });
    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
        success: false,
      });
    }
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Wrong Password",
        success: false,
      });
    }
    return res.status(200).json({
      message: "Salary Check Successful",
      success: true,
    });
  } catch {
    console.error("Error in checking salary:", error);
    return res.status(500).json({
      message: "Error while checking salary",
      success: false,
    });
  }
};

const deleteEmployee = async (req, res) => {
  const { _id } = req.body;

  try {
    const deletedEmployee = await Employee.findByIdAndDelete({ _id });

    const deletedTasks = await Task.deleteMany({
      assignedTo: new mongoose.Types.ObjectId(_id),
    });

    const deletedBreaksRecord = await Break.deleteMany({
      employeeId: new mongoose.Types.ObjectId(_id),
    });

    const deletedLeavesRecord = await Leave.deleteMany({
      employeeId: new mongoose.Types.ObjectId(_id),
    });

    if (!deletedEmployee) {
      return res.status(500).json({
        message: "Employee Not Found !!",
        success: false,
      });
    }

    return res.status(200).json({
      data: deleteEmployee,
      tasks: deletedTasks,
      breaks: deletedBreaksRecord,
      leaves: deletedLeavesRecord,
      message: "Employee Deleted Successfully !!",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      message: "Error while deleting employee !!",
      success: false,
    });
  }
};
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Example usage

const sendMailTochangePassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res
      .status(400)
      .json({ message: "Email is required", success: false });
  }
  const employee = await Employee.findOne({ email });
  if (!employee) {
    return res
      .status(404)
      .json({ message: "Employee not found", success: false });
  }
  const generatedOTP = generateOTP();
  employee.changepasswordcode = generatedOTP;
  await employee.save();
  const emailSent = await sendPasswordResetEmail(email, generatedOTP);
  if (emailSent) {
    res
      .status(200)
      .json({ message: "Password reset email sent", success: true });
  } else {
    res
      .status(500)
      .json({ message: "Failed to send password reset email", success: false });
  }
};

const sendMessage = async (req, res) => {
  const { message, receiverId, senderType } = req.body;
  const senderId = req.user._id;

  try {
    const newMessage = {
      message,
      sender: senderId,
      receiver: receiverId,
      timestamp: new Date(),
      status: 'sent',
      read: false
    };

    const senderModel = senderType === "employee" ? Employee : Admin;
    const receiverModel = senderType === "employee" ? Admin : Employee;

    // Fix the typo here
    await senderModel.findByIdAndUpdate(senderId, {
      $push: { massage: newMessage },
    });

    await receiverModel.findByIdAndUpdate(receiverId, {
      $push: { massage: { ...newMessage, status: 'delivered' } },
    });

    // Emit to both sender and receiver rooms
    const io = req.app.get("io");
    io.to(senderId.toString()).emit("message_status", { messageId: newMessage._id, status: 'sent' });
    io.to(senderId.toString())
      .to(receiverId.toString())
      .emit("new_message", newMessage);

      res.status(200).json({ success: true, message: "Message sent successfully", messageId: newMessage._id });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ success: false, message: "Error sending message" });
  }
};

const markMessagesAsRead = async (req, res) => {
  const { otherUserId, userType } = req.body;
  const userId = req.user._id;

  try {

    const Model = userType === "admin" ? Admin : Employee
    const user = await Model.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const updatedMessages = user.massage.map(msg => {
      if (msg.sender.toString() === otherUserId && msg.status !== 'read') {
        msg.status = 'read';
        return msg;
      }
      return msg;
    });

    user.massage = updatedMessages;
    await user.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAllMessages = async (req, res) => {
  const userId = req.user._id;
  const { otherUserId, userType } = req.body; // userType can be 'admin' or 'employee'

  try {
    let user;
    if (userType === "admin") {
      user = await Admin.findById(userId);
    } else if (userType === "employee") {
      user = await Employee.findById(userId);
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user type" });
    }

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!user.massage || !Array.isArray(user.massage)) {
      return res.status(200).json({ success: true, messages: [] });
    }

    const messages = user.massage
      .filter(
        (msg) => msg.sender === otherUserId || msg.receiver === otherUserId
      )
      .sort((a, b) => a.timestamp - b.timestamp);

    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error("Error fetching message history:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching message history" });
  }
};

const addSalary = async (req, res) => {
  const { salary } = req.body;
  let _id;
  if (req.body.employeeId) {
    _id = new mongoose.Types.ObjectId(req.body.employeeId);
  } else {
    _id = req.user?._id;
  }
  console.log("Id in add salary: >>", _id);

  try {
    const employee = await Employee.findById({ _id });

    if (!employee) {
      return res.status(400).json({
        error: error.message,
        message: "Employee not found !!",
        success: false,
      });
    }

    employee.salary = salary;
    await employee.save();

    return res.status(200).json({
      data: employee,
      message: "Salary Added Successfully !!",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      message: "Error while adding salary !!",
      success: false,
    });
  }
};

const editSalary = async (req, res) => {
  const { salary } = req.body;
  let _id;
  if (req.body.employeeId) {
    _id = new mongoose.Types.ObjectId(req.body.employeeId);
  } else {
    _id = req.user?._id;
  }
  console.log("Id in edit salary: >>", _id);

  try {
    const employee = await Employee.findByIdAndUpdate(
      _id,
      {
        $set: {
          salary: salary,
        },
      },
      { new: true }
    );

    if (!employee) {
      return res.status(400).json({
        error: error.message,
        message: "Employee not found !!",
        success: false,
      });
    }

    return res.status(200).json({
      data: employee,
      message: "Salary Edited Successfully !!",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      message: "Error while editing salary !!",
      success: false,
    });
  }
};

// import { Employee } from "../models/employee.model.js";
// import { Leave } from "../models/leave.model.js";
// import { Salary } from "../models/salary.model.js";
// import { Config } from "../models/config.model.js";

const getEmployeeSalary = async (req, res) => {
  let _id;
  if (req.body.employeeId) {
    _id = new mongoose.Types.ObjectId(req.body.employeeId);
  } else {
    _id = req.user?._id;
  }

  console.log("ID: ", _id);
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
    const currentYear = currentDate.getFullYear();

    // Get employee's base salary
    const employee = await Employee.findOne({ _id }).sort({ createdAt: -1 });
    if (!employee) {
      return res.status(404).json({
        message: "Employee not found !!",
        success: false,
      });
    }

    console.log("employee: >", employee);

    const baseSalary = employee.salary;

    console.log("base salary: ", baseSalary);

    if (!baseSalary) {
      return res.status(404).json({
        message: "Salary not added yet !!",
        success: false,
      });
    }

    // Get leave records for the current month
    const leaves = await Leave.find({
      employeeId: _id,
      date: new RegExp(`-${currentMonth}-${currentYear}$`),
    });

    console.log("Leaves: ", leaves);

    // Get holidays from Config
    const config = await Config.findOne({});
    const holidays = config.holidays.filter((holiday) => {
      const holidayDate = new Date(holiday.date);
      return (
        holidayDate.getMonth() === currentMonth - 1 &&
        holidayDate.getFullYear() === currentYear
      );
    });

    console.log("holidays: ", holidays);

    // Calculate working days in the current month
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    let workingDays = daysInMonth;

    console.log("days in month: ", daysInMonth);

    // Subtract Sundays
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(Date.UTC(currentYear, currentMonth - 1, day));
      if (date.getUTCDay() === 0) {
        // Sunday
        workingDays--;
      }
      console.log(date.toISOString().split("T")[0]);
    }

    console.log("working days after minus sunday: ", workingDays);

    // Subtract holidays
    workingDays -= holidays.length;

    console.log("working days after minus holidays: ", workingDays);

    // Calculate per-day salary
    const perDaySalary = baseSalary / workingDays;

    console.log("per day salary: ", perDaySalary);

    // Calculate salary deductions
    let deductions = 0;
    leaves.forEach((leave) => {
      console.log("deductions: ", deductions);
      if (leave.leaveType === "Half-Day") {
        deductions += perDaySalary / 2;
      } 
      else if (leave.leaveType === "Medical Leave"){
        deductions += 0
      }
      else {
        deductions += perDaySalary;
      }
    });

    // Calculate final salary
    const finalSalary = baseSalary - deductions;

    console.log("final salary: ", finalSalary);

    return res.status(200).json({
      message: "Employee salary fetched successfully",
      data: {
        baseSalary,
        deductions,
        finalSalary,
        workingDays,
        leavesCount: leaves.length,
      },
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch employee salary",
      error: error.message,
      success: false,
    });
  }
};

export {
  createEmployee,
  editEmployee,
  loginEmployee,
  logoutEmployee,
  getAllEmployee,
  updatePassword,
  getEmployeeData,
  getSpecificEmployeeTasks,
  getCurrentEmployee,
  getSpecificEmployeeData,
  uploadImage,
  updateEmployee,
  changeNewPassword,
  getEmployeeRatings,
  deleteEmployee,
  checkSalary,
  sendMailTochangePassword,
  sendMessage,
  markMessagesAsRead,
  getAllMessages,
  addSalary,
  editSalary,
  getEmployeeSalary,
};
