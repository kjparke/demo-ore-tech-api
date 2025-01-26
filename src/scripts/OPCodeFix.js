const mongoose = require("mongoose");
const moment = require("moment");
const { DOWN_STATUSES } = require("../constants/constants"); 
const Event = require("../models/Event"); 
const EventDelta = require("../models/EventDelta"); 

async function updateSecondaryStatus() {
  const thirtyDaysAgo = moment().subtract(45, "days").toDate();

  try {
    const events = await Event.find({
      createdAt: { $gte: thirtyDaysAgo },
      status: { $in: DOWN_STATUSES },
    });

    console.log("Updating...")
    for (const event of events) {
      const lastDownDelta = await EventDelta.findOne({
        eventId: event._id.toString(),
        status: { $in: DOWN_STATUSES },
      })
        .sort({ createdAt: -1 }) 
        .exec();

      if (lastDownDelta) {
        await Event.updateOne(
          { _id: event._id },
          { $set: { secondaryStatus: lastDownDelta.secondaryStatus } }
        );
        console.log(`${event._id}: secondary status ${event.secondaryStatus} updated to ${lastDownDelta.secondaryStatus}`)
      }
    }

    console.log("Secondary status updated for all relevant events.");
  } catch (error) {
    console.error("Error updating secondary status:", error);
  } finally {
    mongoose.connection.close();
  }
}

mongoose
  .connect("mongodb://localhost:27017/ore-tech-db", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to the database.");
    updateSecondaryStatus();
  })
  .catch((error) => console.error("Database connection error:", error));