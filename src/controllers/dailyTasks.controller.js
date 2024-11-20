import { DailyTasks } from "../model/dailyTasks.model.js";

const createDailyTask = async (req, res) => {
  const { title, desc, timeFrom, timeTo, link } = req.body;
  try {
    const isExists = await DailyTasks.findOne({ title });

    if (isExists) {
      return res.status(500).json({
        message: "Daily Task Exists With This Name !!",
        success: false,
      });
    }

    const dailyTask = await DailyTasks.create({
      title,
      desc,
      timeFrom,
      timeTo,
      link
    });

    if (!dailyTask) {
      return res.status(500).json({
        message: "Error While Creating Daily Task. Try Later !!",
        success: false,
      });
    }

    return res.status(200).json({
      data: dailyTask,
      message: "Daily Task Created !!",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      error: error,
      message: "Error while creating daily task",
      success: false,
    });
  }
};

const fetchDailyTasks = async (req, res) => {
  try {
    const dailyTasks = await DailyTasks.find({});

    if (!dailyTasks) {
      return res.status(404).json({
        message: "Daily Tasks Not Found. Try Later !!",
        success: false,
      });
    }

    return res.status(200).json({
      data: dailyTasks,
      message: "Daily Tasks Fetched !!",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      error: error,
      message: "Error while fetching daily task",
      success: false,
    });
  }
};

const editDailyTask = async (req, res) => {
  const { title, desc, timeFrom, timeTo, link, _id } = req.body;
  try {
    if (!title && !desc) {
      return res.status(500).json({
        message: "Title & Description is required !!",
        success: false,
      });
    }
    const task = await DailyTasks.findByIdAndUpdate(
      _id,
      {
        $set: {
          title,
          desc,
          timeFrom,
          timeTo,
          link,
        },
      },
      {
        new: true,
      }
    );

    if (!task) {
      return res.status(500).json({
        message: "Daily Task Not Found. !!",
        success: false,
      });
    }

    return res.status(200).json({
      data: task,
      message: "Daily Task Updated !!",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      error: error,
      message: "Error while updating daily task",
      success: false,
    });
  }
};

const deleteDailyTask = async (req, res) => {
  const { _id } = req.body;
  try {
    const deletedTask = await DailyTasks.findByIdAndDelete({ _id });

    if (!deletedTask) {
      return res.status(500).json({
        message: "Daily Task Not Found !!",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Daily Task Deleted !!",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      error: error,
      message: "Error while deleting daily task",
      success: false,
    });
  }
};

export { createDailyTask, fetchDailyTasks, editDailyTask, deleteDailyTask };
