import { Employee } from "../model/employee.model.js";
import { Config } from "./../model/config.model.js";

const employeeRole = async (req, res) => {
  console.log(req.body);
  try {
    const { roles } = req.body;

    if (!Array.isArray(roles) || roles.length === 0) {
      return res
        .status(400)
        .json({ message: "Invalid input. Roles should be a non-empty array." });
    }
    let config = await Config.findOne();

    if (!config) {
      config = new Config({ options: [] });
    }

    const newRoles = roles.filter(
      (role) =>
        !config.options.some(
          (option) => option.value.toLowerCase() === role.toLowerCase()
        )
    );

    config.options.push(...newRoles.map((role) => ({ value: role })));

    await config.save();

    res.status(200).json({
      message: "Roles updated successfully",
      addedRoles: newRoles,
      success: true,
      allRoles: config.options.map((option) => option.value),
    });
  } catch (error) {
    console.error("Error in employeeRole:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllrole = async (req, res) => {
  try {
    const config = await Config.findOne().sort("-createdAt");
    if (!config) {
      return res.status(404).json({ message: "No roles found" });
    }
    res.status(200).json({
      allRoles: config.options.map((option) => option.value),
      data: config.options,
    });
  } catch (error) {
    console.error("Error in getAllRoles:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const addHolidays = async (req, res) => {
  try {
    const { holidays } = req.body;

    if (!holidays || !Array.isArray(holidays)) {
      return res.status(400).json({ message: "Holidays array is required" });
    }

    let config = await Config.findOne();
    if (!config) {
      config = new Config({ holidays: [], options: [] });
    }

    const newHolidays = holidays.map((date) => ({ date: new Date(date) }));

    // Filter out existing holidays
    const uniqueNewHolidays = newHolidays.filter(
      (newHoliday) =>
        !config.holidays.some(
          (existingHoliday) =>
            existingHoliday.date.toISOString().split("T")[0] ===
            newHoliday.date.toISOString().split("T")[0]
        )
    );
    config.holidays.push(...uniqueNewHolidays);
    await config.save();

    res.status(201).json({
      message: "Holidays added successfully",
      addedHolidays: uniqueNewHolidays,
      success: true,
    });
  } catch (error) {
    console.error("Error in addHolidays:", error);
    res
      .status(500)
      .json({ message: "Internal server error", success: false, error: error });
  }
};

const getHolidays = async (req, res) => {
  try {
    const config = await Config.findOne().sort("-createdAt");
    if (!config) {
      return res.status(404).json({ message: "Holidays not found" });
    }
    res.status(200).json(config.holidays);
  } catch (error) {
    console.error("Error in getHolidays:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const deleteRole = async (req, res) => {
  const { role } = req.body;

  try {
    const config = await Config.findOne();
    if (!config) {
      return res
        .status(404)
        .json({ message: "No roles found", success: false });
    }

    const filteredRoles = config.options.filter(
      (option) => option.value !== role
    );

    config.options = filteredRoles;
    await config.save();

    return res.status(200).json({
      data: config.options,
      message: "Role deleted successfully !!",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error while deleting role",
      success: false,
    });
  }
};

const editRole = async (req, res) => {
  const { role, editRole } = req.body;
  console.log(req.body)

  try {
    const config = await Config.findOne();
    if (!config) {
      return res
        .status(404)
        .json({ message: "No roles found", success: false });
    }
    const filteredRoles = config.options.filter((option) =>
      option._id == role._id ? (option.value = editRole) : option
    );

    config.options = filteredRoles;
    await config.save();

    const employees = await Employee.find({ position: role.value });

    if (employees.length === 0) {
      return res.status(200).json({
        data: filteredRoles,
        message: "Role Edited Successfully, but no employees found with this role",
        success: true,
      });
    }

    const updatePromises = employees.map(employee => {
      employee.position = editRole;
      return employee.save();
    });

    await Promise.all(updatePromises);

    return res.status(200).json({
      data: filteredRoles,
      message: "Role Edited Successfully !!",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      message: "Error while editing role",
      success: false,
    });
  }
};

const deleteHoliday = async (req, res) => {
  try {
    const { date } = req.body;
    console.log("Date to delete:", date);

    if (!date) {
      return res.status(400).json({ message: "Date is required", success: false });
    }

    const holidayDate = new Date(date);

    if (isNaN(holidayDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format", success: false });
    }

    const config = await Config.findOne();
    if (!config) {
      return res.status(404).json({ message: "No configuration found", success: false });
    }

    const initialLength = config.holidays.length;
    
    config.holidays = config.holidays.filter(
      (holiday) => holiday.date.toISOString().split('T')[0] !== holidayDate.toISOString().split('T')[0]
    );

    if (config.holidays.length === initialLength) {
      return res.status(404).json({ message: "Holiday not found", success: false });
    }

    await config.save();

    return res.status(200).json({
      data: config.holidays,
      message: "Holiday deleted successfully!",
      success: true,
    });
  } catch (error) {
    console.error("Error while deleting Holiday:", error);
    return res.status(500).json({
      message: "Error while deleting Holiday",
      error: error.message,
      success: false,
    });
  }
};

export {
  employeeRole,
  getAllrole,
  deleteRole,
  editRole,
  addHolidays,
  getHolidays,
  deleteHoliday,
};
