import { Project } from "../model/project.model.js";
import { Employee } from "../model/employee.model.js";

const createProject = async (req, res) => {
  const { name, description, link, startDate, endDate, technologies } =
    req.body;

  console.log(req.body);

  if (!name && !description && !startDate && !technologies) {
    return res.status(400).json({
      messaage: "All fields are required !!",
      success: false,
    });
  }
  try {
    const project = await Project.create({
      name,
      description,
      link,
      startDate,
      endDate,
      technologies,
    });

    if (!project) {
      return res.status(500).json({
        messaage: "Something went wrong while creating project",
        success: false,
      });
    }

    return res.status(200).json({
      data: project,
      messaage: "Project Created !!",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      messaage: "Error while creating project !!",
      success: false,
    });
  }
};

const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find({});

    if (!projects) {
      return res.status(500).json({
        message: "Projects not found!",
        success: false,
      });
    }

    const projectsWithTeamDetails = await Promise.all(projects.map(async (project) => {
      const teamDetails = await Promise.all(project.team.map(async (member) => {
        const employeeDetails = await Employee.findOne({ employeeId: member.value });
        if (employeeDetails) {
          return {
            name: employeeDetails.name,
            employeeId: employeeDetails.employeeId,
            profileImageUrl: employeeDetails.profileImageUrl,
            position: employeeDetails.position,
            _id: employeeDetails._id
          };
        }
        return null;
      }));

      const projectObject = project.toObject();
      return {
        ...projectObject,
        teamDetails: teamDetails.filter(member => member !== null)
      };
    }));

    return res.status(200).json({
      data: projectsWithTeamDetails,
      message: "Projects fetched with team details!",
      success: true,
    });
  } catch (error) {
    console.error("Error in getAllProjects:", error);
    return res.status(500).json({
      message: "Error while fetching projects!",
      success: false,
    });
  }
};

const deleteProject = async (req, res) => {
  const { _id } = req.body;

  try {
    const project = await Project.findByIdAndDelete({ _id });

    if (!project) {
      return res.status(500).json({
        messaage: "Projects not found !!",
        success: false,
      });
    }
    return res.status(200).json({
      messaage: "Projects deleted !!",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      messaage: "Error while deleting project !!",
      success: false,
    });
  }
};

const addTeamMembers = async (req, res) => {
  const { team, _id } = req.body;

  try {
    const project = await Project.findByIdAndUpdate(
      _id,
      {
        $set: {
          team: team,
        },
      },
      { new: true }
    );

    if (!project) {
      return res.status(500).json({
        messaage: "Project not found !!",
        success: false,
      });
    }

    return res.status(200).json({
      data: project,
      messaage: "Team members added !!",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      messaage: "error while adding members to the project !!",
      success: false,
    });
  }
};

const editProject = async (req, res) => {
  const { name, description, link, startDate, endDate, technologies, _id } =
    req.body;

  if (!name && !description && !startDate && !technologies) {
    return res.status(400).json({
      messaage: "All fields are required !!",
      success: false,
    });
  }

  try {
    const editedProject = await Project.findByIdAndUpdate(
      _id,
      {
        name,
        description,
        link,
        startDate,
        endDate,
        technologies,
      },
      { new: true }
    );

    if (!editedProject) {
      return res.status(500).json({
        messaage: "Project not found !!",
        success: false,
      });
    }

    return res.status(200).json({
      data: editedProject,
      messaage: "Project edited !!",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      messaage: "Error while editing project !!",
      success: false,
    });
  }
};

const statusHandler = async(req, res) => {
  const { status, _id } = req.body

  try {
    const statusChanged = await Project.findByIdAndUpdate(
      _id,
      {
        $set: {
          status: status
        }
      },
      { new: true }
    )

    if (!statusChanged) {
      return res.status(500).json({
        messaage: "Project not found !!",
        success: false,
      });
    }

    return res.status(200).json({
      data: statusChanged,
      messaage: "Status Updated !!",
      success: true,
    });
    
  } catch (error) {
    return res.status(500).json({
      messaage: "error while changing status !!",
      success: false,
    });
  }
}

const getSpecificProject = async (req, res) => {
  const { _id } = req.body;
  try {
    const project = await Project.findOne({ _id });

    if (!project) {
      return res.status(404).json({
        message: "Project not found!",
        success: false,
      });
    }

    const teamDetails = await Promise.all(project.team.map(async (member) => {
      const employeeDetails = await Employee.findOne({ employeeId: member.value });
      if (employeeDetails) {
        return {
          name: employeeDetails.name,
          employeeId: employeeDetails.employeeId,
          profileImageUrl: employeeDetails.profileImageUrl,
          position: employeeDetails.position,
          _id: employeeDetails._id
        };
      }
      return null;
    }));

    const projectObject = project.toObject();
    const projectWithTeamDetails = {
      ...projectObject,
      teamDetails: teamDetails.filter(member => member !== null)
    };

    return res.status(200).json({
      data: projectWithTeamDetails,
      message: "Project fetched with team details!",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error while fetching project!",
      success: false,
    });
  }
};

const getSpecificEmployeeProject = async(req, res) => {
  try { 
    const employee = await Employee.findById(req.user?._id)
    const employeeId = employee.employeeId

    if (!employee) {
      return res.status(500).json({
        message: "Employee Not found !!",
        success: false,
      });
    }

    const projects = await Project.find({})

    if (!projects) {
      return res.status(500).json({
        message: "Projects Not found !!",
        success: false,
      });
    }

    const employeeProjects = projects.filter((project) => (
      project.team.find((member) => (
        employeeId === member.value
      ))
    ))

    if (!employeeProjects) {
      return res.status(500).json({
        message: "Employee Projects Not found !!",
        success: false,
      });
    }

    return res.status(200).json({
      data: employeeProjects,
      message: "Projects found !!",
      success: true,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Error while fetching employee project!",
      success: false,
    });
  }
}

export {
  createProject,
  getAllProjects,
  deleteProject,
  addTeamMembers,
  editProject,
  statusHandler,
  getSpecificProject,
  getSpecificEmployeeProject
};
