const MainMaintenanceReport = require("../models/MineMaintenanceReport");

// CREATE
const createReport = async (report) => {
  try {
    const newReport = new MainMaintenanceReport(report);
    const savedReport = await newReport.save();
    return savedReport
  } catch (error) {
    console.error(error);
    throw new Error("An error occured while trying to create this report. Please try again");
  }
};

// READ
const getAllReports = async () => {
    try {
      const reports = await MainMaintenanceReport.find({})
        .populate("createdBy")
  
      return reports;
    } catch (error) {
      console.error("Error retrieving reports:", error.message);
      throw new Error("An error occurred while retrieving reports. Please try again.");
    }
  };

const getReportById = async (req, res) => {
  try {
    const report = await MainMaintenanceReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: "Error fetching report", error: error.message });
  }
};

// UPDATE
const updateMineMaintenanceCrossoverReport = async (report) => {
  try {
    const updatedReport = await MainMaintenanceReport.findOneAndUpdate(
      { _id: report._id }, 
      report, 
      { new: true }, 
    );
    return updatedReport;
  } catch (error) {
    console.error("Error while updating minemaintenance report", error);
  }
};

// DELETE
const deleteReport = async (req, res) => {
  try {
    const deletedReport = await MainMaintenanceReport.findByIdAndDelete(req.params.id);
    if (!deletedReport) {
      return res.status(404).json({ message: "Report not found" });
    }
    res.status(200).json({ message: "Report successfully deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting report", error: error.message });
  }
};

module.exports = {
  createReport,
  getAllReports,
  getReportById,
  updateMineMaintenanceCrossoverReport,
  deleteReport,
};