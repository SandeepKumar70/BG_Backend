import { Employee } from "../model/employee.model.js";
import { EmployeeRating } from "../model/employeeRatings.model.js";

const calculateAndStoreEmployeeRatings = async (req, res) => {
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

      statusCounts[status]++;

      return {
        name: employee.name,
        position: employee.position,
        score: roundedScore,
        status: status,
      };
    });

    employeeRatings.sort((a, b) => b.score - a.score);

    const rankedEmployeeRatings = employeeRatings.map((employee, index) => ({
      rank: index + 1,
      ...employee,
    }));

    // Store the calculated ratings
    await EmployeeRating.deleteMany({}); // Clear existing ratings
    await EmployeeRating.insertMany(rankedEmployeeRatings);

    const statusData = Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
    }));

    return res.status(200).json({
      message: "Employee ratings calculated and stored successfully",
      data: {
        statusSummary: statusData,
      },
      success: true,
    });
  } catch (error) {
    console.error("Error in calculateAndStoreEmployeeRatings:", error);
    return res.status(500).json({
      error: error.message,
      message: "Error while calculating and storing employee ratings",
      success: false,
    });
  }
};

const fetchEmployeeRatings = async (req, res) => {
    try {
      const employeeRatings = await EmployeeRating.find().sort({ rank: 1 });
  
      const statusCounts = {
        Excellent: 0,
        "Very Good": 0,
        Good: 0,
        Satisfactory: 0,
        Poor: 0,
      };
  
      employeeRatings.forEach((rating) => {
        statusCounts[rating.status]++;
      });
  
      const statusData = Object.entries(statusCounts).map(([name, value]) => ({
        name,
        value,
      }));
  
      return res.status(200).json({
        message: "Employee ratings fetched successfully",
        data: {
          employeeRatings,
          statusSummary: statusData,
        },
        success: true,
      });
    } catch (error) {
      console.error("Error in fetchEmployeeRatings:", error);
      return res.status(500).json({
        error: error.message,
        message: "Error while fetching employee ratings",
        success: false,
      });
    }
  };

export { calculateAndStoreEmployeeRatings, fetchEmployeeRatings };