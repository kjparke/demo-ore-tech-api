const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EventDeltaSchema = new Schema(
  {
    eventId: {
      type: String,
      required: true,
    },
    status: { type: String },
    secondaryStatus: { type: String },
    startTime: { type: Date },
    endTime: { type: Date },
    isManuallyInserted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const EventDelta = mongoose.model("EventDelta", EventDeltaSchema);
module.exports = EventDelta;
