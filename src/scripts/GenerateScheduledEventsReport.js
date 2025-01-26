const mongoose = require("mongoose");
const moment = require("moment");
const Event = require("../models/Event");
const EventDelta = require("../models/EventDelta");
const { DOWN_SCHEDULED } = require("../constants/constants");
const { printCSV } = require("../controllers/export-service/exportToCSV");

const mongoURI = "mongodb://localhost:27017/ore-tech-db";

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected...");
    findDownScheduledEvents();
  })
  .catch((err) => console.error("MongoDB connection error:", err));

async function findDownScheduledEvents() {
  const startDate = moment("2024-09-01").startOf("day").toDate();
  const endDate = moment("2024-09-30").endOf("day").toDate();

  try {
    // Step 1: Find all events that had a down_scheduled status during September
    const downScheduledDeltas = await EventDelta.aggregate([
      {
        $match: {
          status: DOWN_SCHEDULED,
          startTime: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$eventId",
          lastDownScheduledDelta: { $last: "$$ROOT" },
        },
      },
    ]).option({ maxTimeMS: 60000 });

    const eventIds = downScheduledDeltas.map((delta) => delta._id);

    // Step 2: Get the events that match the event deltas (events with down_scheduled status)
    const downScheduledEvents = await Event.find({
      _id: { $in: eventIds },
    }).lean();

    // Step 4: Prepare the results for CSV
    const results = downScheduledEvents.map((event) => {
      return {
        unitId: event.unitId,
        location: event.location || "N/A",
        status: DOWN_SCHEDULED,
        secondaryStatus: event.secondaryStatus || "N/A",
        actualOutDate: event.actualOutDate
          ? moment(event.actualOutDate).format("MM/DD/YYYY HH:mm:ss")
          : "N/A",
        downDate: event.downDate
          ? moment(event.downDate).format("MM/DD/YYYY HH:mm:ss")
          : "N/A",
        eventId: event._id.toString(),
      };
    });

    // Step 5: Prepare CSV fields
    const csvFields = [
        { label: "Event ID", value: "eventId" },
        { label: "Unit ID", value: "unitId" },
        { label: "Last Location", value: "location" },
        { label: "Status", value: "status" },
        { label: "Secondary Status", value: "secondaryStatus"},
        { label: "Down Date", value: "downDate" },
        { label: "Actual Out Date", value: "actualOutDate" },
      ];

    // Step 6: Export the results to CSV using printCSV
    printCSV(results, csvFields, "down_scheduled_events_september.csv");
  } catch (err) {
    console.error(
      "Error finding events with down_scheduled status:",
      err
    );
  }
}