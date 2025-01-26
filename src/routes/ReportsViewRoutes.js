const express = require("express");
const {
  readWorkCompleted,
  readWorkToBeCompleted,
} = require("../controllers/page-controllers/reports/MineMaintenanceReportModal");
const {
  createReport,
  getAllReports,
  updateMineMaintenanceCrossoverReport,
} = require("../controllers/MineMaintenanceReportController");
const { createMultipleNotes } = require("../controllers/NoteController");

const router = express.Router();
router.get("/work-completed", async (_, res) => {
  try {
    const workCompleted = await readWorkCompleted();
    res.status(200).send(workCompleted);
  } catch (error) {
    console.error(error);
  }
});

router.get("/work-pending", async (_, res) => {
  try {
    const workPending = await readWorkToBeCompleted();
    res.status(200).send(workPending);
  } catch (error) {
    console.error(error);
  }
});

router.get("/", async (req, res) => {
  try {
    const reports = await getAllReports();
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.post("/create-mine-maintenance-report", async (req, res) => {
  const data = req.body;

  try {
    const { workToBeCompleted, createdBy } = data;

    const user = {
      _id: createdBy.id,
      ...createdBy,
    };

    delete user.id;

    // Check if any "workToBeCompleted" item has a note
    const notesToCreate = workToBeCompleted
      .filter((item) => item.notes && item.notes.trim() !== "")
      .map((item) => ({
        text: item.notes,
        eventId: item._id,
        userId: user._id,
      }));

    if (notesToCreate.length > 0) {
      await createMultipleNotes(notesToCreate);
    }

    data.createdBy = user;

    const newReport = await createReport(data);
    res.status(200).json(newReport);
  } catch (error) {
    console.error("Error processing report:", error);
    res
      .status(500)
      .json({ message: "An error occurred while creating the report." });
  }
});

router.patch("/update-mine-maintenance-report", async (req, res) => {
  try {
    const { data } = req.body;
    console.log(data);
    const updatedReport = await updateMineMaintenanceCrossoverReport(data);
    res.status(201).json(updatedReport);
  } catch (error) {
    console.error("Error updating report:", error);
    res
      .status(500)
      .json({ message: "An error occurred while updating the report." });
  }
});

module.exports = router;
