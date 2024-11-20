import mongoose from "mongoose";
import { Break } from "../model/break.model.js";
import { Employee } from "../model/employee.model.js";

const breakSetter = async (req, res) => {
  const { type, startTime, endTime, date } = req.body;

  try {
    let breakRes;

    if (type === "Lunch") {
      breakRes = await Break.create({
        breakType: type,
        lunchBreakStart: startTime,
        lunchBreakEnd: endTime,
        date: date,
        employeeId: req.user?._id,
      });
    } else if (type === "Snacks") {
      breakRes = await Break.create({
        breakType: type,
        snacksBreakStart: startTime,
        snacksBreakEnd: endTime,
        date: date,
        employeeId: req.user?._id,
      });
    } else if (type === "Tea") {
      breakRes = await Break.create({
        breakType: type,
        teaBreakStart: startTime,
        teaBreakEnd: endTime,
        date: date,
        employeeId: req.user?._id,
      });
    }

    if (!breakRes) {
      return res.status(500).json({
        error: error.message,
        message: "User not found",
        success: false,
      });
    }

    return res.status(200).json({
      data: breakRes,
      message: "Break set !!",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      message: "Error while setting break !!",
      success: false,
    });
  }
};

const setEndTime = async (req, res) => {
  const { type, endTime, date } = req.body;
  console.log(req.body);

  try {
    let breakRes;

    if (type === "Lunch") {
      breakRes = await Break.findOneAndUpdate(
        {
          employeeId: req.user?._id,
          breakType: type,
          date: date,
        },
        {
          $set: {
            lunchBreakEnd: endTime,
          },
        },
        { new: true }
      );
    } else if (type === "Snacks") {
      breakRes = await Break.findOneAndUpdate(
        {
          employeeId: req.user?._id,
          breakType: type,
          date: date,
        },
        {
          $set: {
            snacksBreakEnd: endTime,
          },
        },
        { new: true }
      );
    } else if (type === "Tea") {
      breakRes = await Break.findOneAndUpdate(
        {
          employeeId: req.user?._id,
          breakType: type,
          date: date,
        },
        {
          $set: {
            teaBreakEnd: endTime,
          },
        },
        { new: true }
      );
    }

    if (!breakRes) {
      return res.status(500).json({
        error: error.message,
        message: "Break Document not found !!",
        success: false,
      });
    }

    return res.status(200).json({
      data: breakRes,
      message: "End time set !!",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      message: "Error while set end time !!",
      success: false,
    });
  }
};

const getEmployeesTodayBreaks = async (req, res) => {
  try {
    // Get today's date in the format "YYYY-MM-DD"
    const today = new Date().toISOString().split("T")[0];

    // Find all employees
    const allEmployees = await Employee.find({}, 'name email');

    // Find all breaks for today
    const todayBreaks = await Break.find({ date: today })
      .populate("employeeId", "name email")
      .sort({ createdAt: 1 });

    // Create a map of employee IDs to their breaks
    const breakMap = new Map(todayBreaks.map(breakItem => [breakItem.employeeId._id.toString(), breakItem]));

    // Combine employee data with break data
    const combinedData = allEmployees.map(employee => {
      const employeeBreak = breakMap.get(employee._id.toString());
      return {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        date: today,
        lunchBreak: employeeBreak?.lunchBreakStart ? `${employeeBreak.lunchBreakStart} - ${employeeBreak.lunchBreakEnd}` : "",
        teaBreak: employeeBreak?.teaBreakStart ? `${employeeBreak.teaBreakStart} - ${employeeBreak.teaBreakEnd}` : "",
        snacksBreak: employeeBreak?.snacksBreakStart ? `${employeeBreak.snacksBreakStart} - ${employeeBreak.snacksBreakEnd}` : "",
      };
    });

    return res.status(200).json({
      message: "Successfully retrieved today's employee data",
      success: true,
      data: combinedData,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      message: "Error while getting employees today's data",
      success: false,
    });
  }
};

const getEmployeeMonthlyBreaks = async (req, res) => {
  try {
    const { employeeId, month, year } = req.body; // Now expecting monthYear parameter
    console.log("req.body: >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>",req.body)

    // Validate if the employeeId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        message: "Invalid employee ID",
        success: false
      });
    }

    // Validate monthYear format
    // const monthYearRegex = /^\d{4}-\d{2}$/;
    // if (!monthYearRegex.test(monthYear)) {
    //   return res.status(400).json({
    //     message: "Invalid month-year format. Expected format: YYYY-MM",
    //     success: false
    //   });
    // }

    // Parse the month and year
    // const [year, month] = monthYear.split('-').map(Number);

    // Get the first and last day of the specified month
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0);

    console.log("firstDayOfMonth: ", firstDayOfMonth)
    console.log("lastDayOfMonth: ", lastDayOfMonth)

    // Format dates as strings to match your schema
    const startDate = `${year}-${month}-${String(firstDayOfMonth.getDate()).padStart(2, '0')}`
    const endDate = `${year}-${month}-${String(lastDayOfMonth.getDate()).padStart(2, '0')}`

    console.log("startDate: ", startDate)
    console.log("endDate: ", endDate)

    // Query for the employee's breaks in the specified month
    const breaks = await Break.find({
      employeeId: employeeId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // Process the breaks to group by date and break type
    const processedBreaks = breaks.reduce((acc, breakItem) => {
      if (!acc[breakItem.date]) {
        acc[breakItem.date] = {
          date: breakItem.date,
          lunchBreak: '',
          teaBreak: '',
          snacksBreak: ''
        };
      }

      const formatTime = (start, end) => start && end ? `${start} - ${end}` : '';

      switch (breakItem.breakType) {
        case 'Lunch':
          acc[breakItem.date].lunchBreak = formatTime(breakItem.lunchBreakStart, breakItem.lunchBreakEnd);
          break;
        case 'Tea':
          acc[breakItem.date].teaBreak = formatTime(breakItem.teaBreakStart, breakItem.teaBreakEnd);
          break;
        case 'Snacks':
          acc[breakItem.date].snacksBreak = formatTime(breakItem.snacksBreakStart, breakItem.snacksBreakEnd);
          break;
      }

      return acc;
    }, {});

    // Convert the processed breaks object to an array
    const breakSummary = Object.values(processedBreaks);

    return res.status(200).json({
      message: `Successfully retrieved employee's breaks`,
      success: true,
      data: breakSummary
    });

  } catch (error) {
    console.log(error)
    return res.status(500).json({
      error: error.message,
      message: "Error while getting employee's monthly breaks!",
      success: false,
    });
  }
};

export { breakSetter, setEndTime, getEmployeesTodayBreaks, getEmployeeMonthlyBreaks };
