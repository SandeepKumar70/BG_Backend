import { Employee } from "../model/employee.model.js";
import { Task } from "../model/task.model.js";
import mongoose from "mongoose";

const createTask = async (req, res) => {
  const {
    title,
    description,
    link,
    timeFrom,
    timeTo,
    employeeId,
    date,
    isDailyTask,
    isDueTask
  } = req.body;
  if (!title && !description && !timeFrom && !timeTo && !date) {
    return res.status(400).json({
      messaage: "all fields are required",
      success: false,
    });
  }

  try {
    const createdTask = await Task.create({
      title,
      description,
      link,
      timeFrom,
      timeTo,
      date,
      createdBy: req.role,
      assignedTo: employeeId,
      tasktype: "new",
      isDailyTask,
      isDueTask
    });

    if (!createdTask) {
      return res.status(500).json({
        messaage: "Something went wrong while creating task !!",
        success: false,
      });
    }
    return res.status(200).json({
      messaage: "Task created",
      data: createdTask,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      error: error,
      messaage: "Error while creating task",
      success: false,
    });
  }
};
const createMultipleTasks = async (req, res) => {
  const {
    title,
    description,
    link,
    timeFrom,
    timeTo,
    employeeId,
    date,
    isDailyTask,
    isDueTask,
    selected
  } = req.body;

  if (!title || !description || !timeFrom || !timeTo || !date) {
    return res.status(400).json({
      message: "Title, description, timeFrom, timeTo, and date are required!",
      success: false,
    });
  }

  if ((!selected || !Array.isArray(selected) || selected.length === 0) && !employeeId) {
    return res.status(400).json({
      message: "Either selected array or employeeId must be provided!",
      success: false,
    });
  }

  try {
    let employeesToAssign = [];

    // Add employeeId to the list if it exists
    if (employeeId) {
      employeesToAssign.push({ value: employeeId });
    }

    // Add selected employees to the list
    if (selected && Array.isArray(selected)) {
      employeesToAssign = [...employeesToAssign, ...selected];
    }

    const tasks = employeesToAssign.map(employee => ({
      title,
      description,
      link,
      timeFrom,
      timeTo,
      date,
      createdBy: req.role,
      assignedTo: employee.value,
      tasktype: "new",
      isDailyTask,
      isDueTask
    }));

    const createdTasks = await Task.insertMany(tasks);

    if (!createdTasks || createdTasks.length === 0) {
      return res.status(500).json({
        message: "Something went wrong while creating tasks!",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Tasks created successfully",
      data: createdTasks,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      message: "Error while creating tasks",
      success: false,
    });
  }
};

const getAllTasks = async (req, res) => {
  try {
    const allTasks = await Task.aggregate([
      {
        $lookup: {
          from: "employees",
          localField: "assignedTo",
          foreignField: "_id",
          as: "assignedEmployee",
        },
      },
      {
        $unwind: {
          path: "$assignedEmployee",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          title: 1,
          description: 1,
          link: 1,
          timeFrom: 1,
          timeTo: 1,
          completion: 1,
          isVerify: 1,
          createdBy: 1,
          isModify: 1,
          isUpdated: 1,
          date: 1,
          createdAt: 1,
          updatedAt: 1,
          newModifyDate: 1,
          newModifyDes: 1,
          newModifyTimeFrom: 1,
          newModifyTimeto: 1,
          newUpdateDate: 1,
          newUpdateLink: 1,
          newUpdatedDes: 1,
          newUpdatedTimeFrom: 1,
          newUpdatedTimeto: 1,
          tasktype: 1,
          completiontime: 1,
          taskcompleteLink: 1,
          modifycompletiontime: 1,
          updatedcompletiontime: 1,
          timeExceeded: 1,
          updatedtasklink: 1,
          updatedtimeExceeded: 1,
          modifytasklink: 1,
          modifytimeExceeded: 1,
          priorityTask: 1,
          isDailyTask: 1,
          rating: 1,
          assignedTo: {
            _id: "$assignedEmployee._id",
            name: "$assignedEmployee.name",
            email: "$assignedEmployee.email",
            position: "assignedEmployee.position",
          },
        },
      },
    ]);

    if (!allTasks) {
      return res.status(500).json({
        message: "Error while getting all tasks",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Tasks fetched successfully!",
      data: allTasks,
      count: allTasks.length,
      success: true,
    });
  } catch (error) {
    console.error("Error in getAllTasks:", error);
    return res.status(500).json({
      message: "Error while getting all tasks",
      error: error.message,
      success: false,
    });
  }
};
const getSpecificEmployeeTask = async (req, res) => {
  let id;
  if (req.body._id) {
    id = new mongoose.Types.ObjectId(req.body._id);
  } else if (req.user?._id) {
    id = req.user?._id;
  }

  const user = await Employee.findById({ _id: id });

  if (!user) {
    return res.status(400).json({
      messaage: "user not found",
      success: false,
    });
  }
  const tasks = await Task.aggregate([
    {
      $match: {
        assignedTo: user._id,
      },
    },
  ]);

  if (!tasks) {
    return res.status(500).json({
      messaage: "tasks not found",
      success: false,
    });
  }

  return res.status(200).json({
    data: tasks,
    messaage: "Tasks fetched",
    success: true,
  });
};
const taskVerifyHandler = async (req, res) => {
  const { _id, link, timeExceedChecker, taskType, date } = req.body;
  const now = new Date();
  const completiontime = date;
  let verifiedTask;
  if (taskType && taskType === "Modified Task") {
    verifiedTask = await Task.findByIdAndUpdate(
      _id,
      {
        $set: {
          completion: true,
          modifytasklink: link,
          modifytimeExceeded: timeExceedChecker,
          modifycompletiontime: completiontime,
        },
      },
      { new: true }
    );
  } else if (taskType && taskType === "Updated Task") {
    verifiedTask = await Task.findByIdAndUpdate(
      _id,
      {
        $set: {
          completion: true,
          updatedtasklink: link,
          updatedtimeExceeded: timeExceedChecker,
          updatedcompletiontime: completiontime,
        },
      },
      { new: true }
    );
  } else {
    verifiedTask = await Task.findByIdAndUpdate(
      _id,
      {
        $set: {
          completion: true,
          taskcompleteLink: link,
          timeExceeded: timeExceedChecker,
          completiontime: completiontime,
        },
      },
      { new: true }
    );
  }

  if (!verifiedTask) {
    return res.status(500).json({
      messaage: "Error while verifying task",
      success: false,
    });
  }
  return res.status(200).json({
    data: verifiedTask,
    messaage: "Task verified !!",
    success: true,
  });
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
const taskDelete = async (req, res) => {
  const { _id } = req.body;

  if (!_id) {
    return res.status(400).json({
      messaage: "Task id is required",
      success: false,
    });
  }
  if (!req.user) {
    return res.status(400).json({
      messaage: "UnAuthorized Requiest",
      success: false,
    });
  }
  const task = await Task.findByIdAndDelete({ _id });
  if (!task) {
    return res.status(500).json({
      messaage: "Task is Not Fund",
      success: false,
    });
  }
  return res.status(200).json({
    messaage: "Task deleted successfully",
    success: true,
  });
};
const editTaskHandler = async (req, res) => {
  const {
    _id,
    title,
    description ,
    timeTo,
    timeFrom,
    link,
    date,
  } = req.body;
  console.log(req.body);
  try {
    if (
      !title &&
      !description &&
      !timeTo &&
      !timeFrom &&
      !date
    ) {
      return res.status(400).json({
        messaage: "All field are required",
        success: false,
      });
    }
    const task = await Task.findById(_id);
    if (!task) {
      return res.status(400).json({
        messaage: "Task Not Found",
        success: false,
      });
    }
    task.title = title;
    task.description = description;
    task.timeTo = timeTo;
    task.timeFrom = timeFrom;
    task.date = date
    task.link = link
    task.tasktype = "new";
    const editedTask = await task.save();
    if (!editedTask) {
      return res.status(500).json({
        messaage: "Error while Modifying task",
        success: false,
      });
    }
    return res.status(200).json({
      data: editedTask,
      messaage: "Task Edited Successfully",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      messaage: "Internal Server Error",
      success: false,
      error,
    });
  }
};
const modifyTaskHandler = async (req, res) => {
  const {
    _id,
    newModifydes,
    newModifyTimeto,
    newModifyTimeFrom,
    newModifyLink,
    newModifyDate,
  } = req.body;
  console.log(req.body);
  try {
    if (
      !newModifydes &&
      !newModifyTimeto &&
      !newModifyTimeFrom &&
      !newModifyDate
    ) {
      return res.status(400).json({
        messaage: "All field are required",
        success: false,
      });
    }
    const task = await Task.findById(_id);
    if (!task) {
      return res.status(400).json({
        messaage: "Task Not Found",
        success: false,
      });
    }
    const now = new Date();
    const completiontime = formatDate(now);
    task.newModifyLink = newModifyLink;
    task.newModifyDes = newModifydes;
    task.newModifyTimeto = newModifyTimeto;
    task.newModifyTimeFrom = newModifyTimeFrom;
    task.newModifyDate = newModifyDate;
    task.isModify = true;
    task.tasktype = "modifyed";
    (task.modifycompletiontime = completiontime), (task.completion = false);
    const modifiedTask = await task.save();
    if (!modifiedTask) {
      return res.status(500).json({
        messaage: "Error while Modifying task",
        success: false,
      });
    }
    return res.status(200).json({
      data: modifiedTask,
      messaage: "Task Modified Successfully",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      messaage: "Internal Server Error",
      success: false,
      error,
    });
  }
};
const updateTaskHandler = async (req, res) => {
  try {
    const {
      _id,
      newUpdatedDes,
      newUpdatedTimeto,
      newUpdatedTimeFrom,
      newUpdateLink,
      newUpdateDate,
    } = req.body;
    console.log(req.body);
    if (
      !newUpdatedDes &&
      !newUpdatedTimeto &&
      !newUpdatedTimeFrom &&
      !newUpdateDate
    ) {
      return res.status(400).json({
        messaage: "All field are required",
        success: false,
      });
    }

    const task = await Task.findById(_id);
    if (!task) {
      return res.status(400).json({
        messaage: "Task Not Found",
        success: false,
      });
    }
    const now = new Date();
    const completiontime = formatDate(now);
    task.newUpdateLink = newUpdateLink;
    task.newUpdatedDes = newUpdatedDes;
    task.newUpdatedTimeto = newUpdatedTimeto;
    task.newUpdatedTimeFrom = newUpdatedTimeFrom;
    task.newUpdateDate = newUpdateDate;
    task.isUpdated = true;
    task.tasktype = "updated";
    task.updatedcompletiontime = completiontime;
    task.completion = false;
    const updatedTask = await task.save();
    if (!updatedTask) {
      return res.status(500).json({
        messaage: "Error while Upadting task",
        success: false,
      });
    }
    return res.status(200).json({
      data: updatedTask,
      messaage: "Task Updated Successfully",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      messaage: "Internal Server Error",
      success: false,
      error,
    });
  }
};
const taskAdminVerificationHandler = async (req, res) => {
  const { _id, rating } = req.body;
  const today = new Date().toISOString().split("T")[0];

  const verifiedTask = await Task.findByIdAndUpdate(
    _id,
    {
      $set: {
        isVerify: true,
        rating: rating,
        verificationDate: today,
      },
    },
    { new: true }
  );
  if (!verifiedTask) {
    return res.status(500).json({
      messaage: "Error while verifying task by Admin",
      success: false,
    });
  }
  return res.status(200).json({
    data: verifiedTask,
    messaage: "Task verified !!",
    success: true,
  });
};
const getTodayTasks = async (req, res) => {
  try {
    const today = dayjs().startOf("day");
    const tasks = await Task.find({
      date: {
        $gte: today.toDate(),
        $lt: today.add(1, "day").toDate(),
      },
      completion: false,
    }).populate("assignedTo", "name");

    res.status(200).json(tasks);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching tasks", error: error.message });
  }
};

const setPriorityTask = async (req, res) => {
  const { taskId, priority } = req.body;
  try {
    const task = await Task.findByIdAndUpdate(
      taskId,
      {
        $set: {
          priorityTask: priority,
        },
      },
      { new: true }
    );
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    return res.status(200).json({
      message: "Task priority updated successfully",
      task,
      success: true,
      priority: task.priorityTask,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error setting task priority",
      error: error.message,
      success: false,
    });
  }
};
async function createAndAssignDailyTasks() {

  try {
    console.log("createAndAssignDailyTasks///////////////////")
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    console.log("yesterday::==",yesterday)
    console.log("Today is today :=",today)

    const employees = await Employee.find();

    for (const employee of employees) {
      const yesterdayTasks = await Task.find({
        assignedTo: employee._id,
        date: yesterday.toISOString().split("T")[0],
        isDailyTask: true,
      });

      console.log("yesterdayTasks:======",yesterdayTasks)

      if (yesterdayTasks.length > 0) {
        for (const yesterdayTask of yesterdayTasks) {
          const newTask = new Task({
            title: yesterdayTask.title,
            description: yesterdayTask.description,
            link: yesterdayTask.link,
            timeFrom: yesterdayTask.timeFrom,
            timeTo: yesterdayTask.timeTo,
            createdBy: yesterdayTask.createdBy,
            assignedTo: employee._id,
            tasktype: "new",
            isDailyTask: true,
            date: today.toISOString().split("T")[0],
            priorityTask: yesterdayTask.priorityTask,
          });

          await newTask.save();
          console.log(
            `Daily task "${newTask.title}" created and assigned to ${employee.name}`
          );
        }
      }
    }
  } catch (error) {
    console.error("Error in creating and assigning daily tasks:", error);
  }
}

const calculateRating = async () => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const employees = await Employee.find();
    let rating

    for (const employee of employees) {
      rating = 0
      console.log("employee: ", employee)
      console.log(employee.monthlyRating)
      const todayTasks = await Task.find({
        assignedTo: employee._id,
        isVerify: true,
        verificationDate: today,
      });
      console.log("todayTasks:", todayTasks.length)

      if (todayTasks.length > 0) {
        const totalRating = todayTasks.reduce((sum, task) => sum + (task.rating || 0), 0);
        console.log("Total rating:", totalRating); 

        const maxPossibleRating = todayTasks.length * 5;
        console.log("Max possible rating:", maxPossibleRating);

        const dailyRatingPercentage = (totalRating / maxPossibleRating) * 100;
        console.log("Daily rating percentage:", dailyRatingPercentage);

        // Ensure the monthly rating is a number before adding
        const currentMonthlyRating = isNaN(employee.monthlyRating) ? 0 : employee.monthlyRating;
        
        // Add the daily rating to the monthly rating
        employee.monthlyRating = currentMonthlyRating + dailyRatingPercentage;
        employee.maxMonthlyRating += 100
        
        console.log("New monthly rating:", employee.monthlyRating);
      } else {
        console.log("No tasks for today, monthly rating unchanged");
      }

      await employee.save();
    }

    console.log("Worked Correctly !! Rating calculated.....")
  } catch (error) {
    console.log("Error while Rating calculated.....")
  }
};

const toggleDailyTask = async (req, res) => {
  const { dailyTask, _id } = req.body;

  try {
    const toggledTask = await Task.findByIdAndUpdate(
      _id,
      {
        $set: {
          isDailyTask: dailyTask,
        },
      },
      { new: true }
    );

    if (!toggledTask) {
      return res.status(500).json({
        message: "No task found !!",
        success: false,
      });
    }

    return res.status(200).json({
      data: toggledTask,
      message: "Toggled Daily Task Successfully !!",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error while toggling daily task !!",
      success: false,
    });
  }
};

const getSpecificTask = async(req, res) => {
  const { _id } = req.body 
  try {
    const task = await Task.findOne({ _id })

    if (!task) {
      return res.status(500).json({
        message: "Task Not found !!",
        success: false,
      });
    }

    return res.status(200).json({
      data: task,
      message: "Task Fetched !!",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error while getting task !!",
      success: false,
    });
  }
}
export {
  createTask,
  getAllTasks,
  getSpecificEmployeeTask,
  taskVerifyHandler,
  taskDelete,
  editTaskHandler,
  modifyTaskHandler,
  updateTaskHandler,
  taskAdminVerificationHandler,
  getTodayTasks,
  setPriorityTask,
  createAndAssignDailyTasks,
  toggleDailyTask,
  getSpecificTask,
  calculateRating,
  createMultipleTasks
};
