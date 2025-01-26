const moment = require("moment-timezone");
const { determineCurrentShift } = require("../../utils/DetermineCurrentShift");
const { readEvents } = require("../../EventController");
const { getCombinedNotesForEvent } = require("./helpers");
const {
  readAssetWithEventFilter,
} = require("../../AssetController");
const { createReport } = require("../../MineMaintenanceReportController");

exports.readWorkCompleted = async () => {
  try {
    const { date, shiftType } = determineCurrentShift();

    //Derive shift start and end times
    const shiftStart =
      shiftType === "Day Shift"
        ? moment.tz(
            `${date} 06:30:00`,
            "YYYY-MM-DD HH:mm:ss",
            "America/Vancouver"
          )
        : moment.tz(
            `${date} 18:30:00`,
            "YYYY-MM-DD HH:mm:ss",
            "America/Vancouver"
          );

    const shiftEnd = moment(shiftStart).add(12, "hours");

    const filter = {
      actualOutDate: {
        $exists: true,
        $gte: shiftStart.toDate(),
        $lt: shiftEnd.toDate(),
      },
      $expr: {
        // Ensure at least 30 minutes elapsed between downDate and actualOutDate
        $gte: [{ $subtract: ["$actualOutDate", "$downDate"] }, 30 * 60 * 1000],
      },
    };

    const events = await readEvents(filter);
    const eventsWithNotes = await Promise.all(
      events.map(async (event) => {
        const combinedNotes = await getCombinedNotesForEvent(event._id);
        return { ...event.toObject(), notes: combinedNotes };
      })
    );
    return eventsWithNotes;
  } catch (error) {
    console.error("Error reading work completed events:", error);
  }
};

exports.readWorkToBeCompleted = async () => {
  try {
    const assets = await readAssetWithEventFilter({}, {}, {}, false);
    const activeEvents = assets
      .filter((asset) => asset.activeEvent)
      .map((asset) => asset.activeEvent);
    return activeEvents;
  } catch (error) {
    console.error(error);
  }
};
