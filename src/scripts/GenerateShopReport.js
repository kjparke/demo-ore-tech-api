const mongoose = require("mongoose");
const moment = require("moment");
const Event = require("../models/Event");
const LocationDelta = require("../models/LocationDelta");
const { DOWN_SCHEDULED, DOWN_WAITING, DOWN_UNSCHEDULED } = require("../constants/constants");
const { printCSV } = require("../controllers/export-service/exportToCSV");

const mongoURI = "mongodb://localhost:27017/ore-tech-db";

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected...");
    findInShopEvents();
  })
  .catch((err) => console.error("MongoDB connection error:", err));

async function findInShopEvents() {
  const startDate = moment("2024-09-01").startOf("day").toDate();
  const endDate = moment("2024-09-30").endOf("day").toDate();

  try {
    // Step 1: Find all events that have been in the truck shop during September
    const truckShopLocationDeltas = await LocationDelta.aggregate([
      {
        $match: {
          location: "Truck Shop",
          $or: [
            { createdAt: { $gte: startDate, $lte: endDate } },
            { updatedAt: { $gte: startDate, $lte: endDate } },
          ],
        },
      },
      {
        $group: {
          _id: "$eventId",
          lastTruckShopDelta: { $last: "$$ROOT" },
        },
      },
    ]).option({ maxTimeMS: 60000 });

    const eventIds = truckShopLocationDeltas.map((delta) => delta._id);

    // Step 2: Get the events that match the location deltas (events in the truck shop)
    const truckShopEvents = await Event.find({
      _id: { $in: eventIds },
      status: { $in: [DOWN_WAITING, DOWN_SCHEDULED, DOWN_UNSCHEDULED] },
      downDate: { $gte: startDate, $lte: endDate },
    }).lean();

    // Step 4: Combine the truck shop events with status deltas
    const results = truckShopEvents.map((event) => {
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
    printCSV(results, csvFields, "truck_shop_report_september.csv");
  } catch (err) {
    console.error(
      "Error finding events in the truck shop and status deltas:",
      err
    );
  }
}