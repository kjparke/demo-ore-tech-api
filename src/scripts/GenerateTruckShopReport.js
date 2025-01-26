const mongoose = require("mongoose");
const moment = require("moment");
const Event = require("../models/Event");
const LocationDelta = require("../models/LocationDelta");
const EventDelta = require("../models/EventDelta");
const { DOWN_SCHEDULED } = require("../constants/constants");
const { printCSV } = require("../controllers/export-service/exportToCSV");

const mongoURI = "mongodb://localhost:27017/ore-tech-db";

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected...");
    findEventsInTruckShopAndNextDown();
  })
  .catch((err) => console.error("MongoDB connection error:", err));

async function findEventsInTruckShopAndNextDown() {
  const thirtyDaysAgo = moment().subtract(30, "days").toDate();

  try {
    // Step 1: Find all events that have been in the truck shop in the last 30 days
    const truckShopLocationDeltas = await LocationDelta.aggregate([
      {
        $match: {
          location: "Truck Shop",
          $or: [
            { createdAt: { $gte: thirtyDaysAgo } },
            { updatedAt: { $gte: thirtyDaysAgo } },
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
      actualOutDate: { $exists: true },
    }).lean();

    // Step 3: Get the status deltas for events that have a down_scheduled status within the time range
    const statusDeltas = await EventDelta.find({
      eventId: { $in: eventIds },
      status: DOWN_SCHEDULED, // Match events that were 'down_scheduled'
      startTime: { $gte: thirtyDaysAgo },
    }).lean();

    // Step 4: Combine the truck shop events with status deltas
    const results = truckShopEvents.map((event) => {
      const eventStatusDelta = statusDeltas.find(
        (delta) => delta.eventId === event._id.toString()
      );

      return {
        unitId: event.unitId,
        location: event.location || "N/A",
        status: event.status || "N/A",
        actualOutDate: event.actualOutDate
          ? moment(event.actualOutDate).format("YYYY-MM-DD")
          : "N/A",
        downDate: event.downDate
          ? moment(event.downDate).format("YYYY-MM-DD")
          : "N/A",
        eventId: event._id.toString()
      };
    });

    // Step 5: Prepare CSV fields
    const csvFields = [
      { label: "Event ID", value: "eventId" },
      { label: "Unit ID", value: "unitId" },
      { label: "Last Location", value: "location" },
      { label: "Last Status", value: "status" },
      { label: "Down Date", value: "downDate" },
      { label: "Actual Out Date", value: "actualOutDate" },
    ];

    // Step 6: Export the results to CSV using printCSV
    printCSV(results, csvFields, "truck_shop_report.csv");
  } catch (err) {
    console.error(
      "Error finding events in the truck shop and status deltas:",
      err
    );
  }
}