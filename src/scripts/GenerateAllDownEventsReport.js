const mongoose = require("mongoose");
const moment = require("moment");
const Event = require("../models/Event");
const { DOWN_SCHEDULED, DOWN_WAITING, DOWN_UNSCHEDULED } = require("../constants/constants");
const { printCSV } = require("../controllers/export-service/exportToCSV");
const SecondaryStatus = require("../models/SecondaryStatus");

const mongoURI = "mongodb://localhost:27017/ore-tech-db";

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected...");
    findDownEvents();
  })
  .catch((err) => console.error("MongoDB connection error:", err));

async function findDownEvents() {
  const startDate = moment("2024-09-01").startOf("day").toDate();
  const endDate = moment("2024-09-30").endOf("day").toDate();

  try {
    // Step 1: Find all events that were down during September
    const downEvents = await Event.find({
      status: { $in: [DOWN_SCHEDULED, DOWN_WAITING, DOWN_UNSCHEDULED] },
      downDate: { $gte: startDate, $lte: endDate },
    }).lean();

    // Step 2: Prepare the results for CSV
    const results = downEvents.map((event) => {
      return {
        unitId: event.unitId,
        location: event.location || "N/A",
        status: event.status || "N/A",
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

    // Step 3: Prepare CSV fields
    const csvFields = [
      { label: "Event ID", value: "eventId" },
      { label: "Unit ID", value: "unitId" },
      { label: "Last Location", value: "location" },
      { label: "Status", value: "status" },
      { label: "Secondary Status", value: "secondaryStatus"},
      { label: "Down Date", value: "downDate" },
      { label: "Actual Out Date", value: "actualOutDate" },
    ];

    // Step 4: Export the results to CSV using printCSV
    printCSV(results, csvFields, "down_events_september.csv");
  } catch (err) {
    console.error("Error finding down events:", err);
  }
}