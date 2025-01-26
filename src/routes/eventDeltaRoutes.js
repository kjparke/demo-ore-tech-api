const express = require("express");
const {
  readLastEventDeltaPerHour,
} = require("../controllers/EventDeltaController");

const {
  readShiftSummaryByDate,
  readDeltasForSingleEvent,
} = require("../controllers/ShiftSummaryController");

const {
  updateDeltas,
} = require('../controllers/ShiftSummaryModalController');

const authMiddleware = require("../middleware/authMiddleWare");

const router = express.Router();
router.get("/:id", readLastEventDeltaPerHour);

router.get("/", async (req, res) => {
  const { date, eventId } = req.query;
  const sortParam = req.query.sort || "createdAt:asc";
  const [sortField, sortDir] = sortParam.split(":");

  try {
    if (!Date.parse(date)) {
      res.json({ msg: "Invalid date." });
    }

    if(eventId) {
      const shiftSummaryData = await readDeltasForSingleEvent(eventId, date);
      res.status(200).json(shiftSummaryData);
    } else {
      const shiftSummaryData = await readShiftSummaryByDate(date, sortField, sortDir);
      res.status(200).json(shiftSummaryData);
    }
  } catch (error) {
    console.error(error);
  }
});

router.patch("/update-deltas", authMiddleware.verifyToken, authMiddleware.verifyPermissions("canUpdateAll"), async (req, res) => {
  const { originalDeltas, modifiedDeltas, date } = req.body.data;

  try {
    const result = await updateDeltas(date, originalDeltas, modifiedDeltas);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error updating deltas:", error);
    res.status(500).json({ error: "Failed to update deltas" });
  }
});

module.exports = router;
