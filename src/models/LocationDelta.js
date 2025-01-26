const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LocationDeltaSchema = new Schema(
  {
    eventId: {
      type: String,
      required: true,
    },
    location: { type: String },
    bay: { type: String },
    startTime: { type: Date }, 
    endTime: { type: Date },
  },
  { timestamps: true }
);

const LocationDelta = mongoose.model("LocationDelta", LocationDeltaSchema);
module.exports = LocationDelta;
