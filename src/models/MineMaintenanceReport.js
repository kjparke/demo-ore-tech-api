const mongoose = require("mongoose");

const MineMaintenanceCrossoverSchema = new mongoose.Schema(
  {
    reportName: { type: String, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    crew: { type: String },
    summary: { type: String },
    safety: { type: String },
    workCompleted: [
      {
        _id: { type: String, required: true },
        unitId: { type: String, required: true },
        location: { type: String },
        actualOutDate: { type: String },
        status: { type: String, required: true },
        secondaryStatus: { type: String, required: true },
        notes: { type: String },
      },
    ],
    workToBeCompleted: [
      {
        _id: { type: String, required: true },
        unitId: { type: String, required: true },
        status: { type: String, required: true },
        secondaryStatus: { type: String, required: true },
        location: { type: String },
        scheduleOutDate: { type: String },
        notes: { type: String },
      },
    ],
  },
  { timestamps: true }
);

const MineMaintenanceCrossover = mongoose.model(
  "MineMaintenanceCrossover",
  MineMaintenanceCrossoverSchema
);
module.exports = MineMaintenanceCrossover;
