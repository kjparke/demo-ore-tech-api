const mongoose = require("mongoose");

const ShiftRosterSchema = new mongoose.Schema(
  {
    names: {
      type: [String],
      required: true,
    },
    shift: {
      type: String,
      enum: ["Day Shift", "Night Shift"],
      required: true,
    },
    eventId: {
			type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
			required: true, 
		}, 
    date: {
      type: Date,
      required: true,
    }
  },
  { timestamps: true }
);

const ShiftRoster = mongoose.model("ShiftRoster", ShiftRosterSchema);
module.exports = ShiftRoster;
