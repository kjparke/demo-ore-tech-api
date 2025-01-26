const mongoose = require("mongoose");

const PhysicalAvailabilitySchema = new mongoose.Schema(
  {
    haulTruck: {
      operational: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    },
    dozer: {
      operational: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    },
    graders: {
      operational: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    },
    letourneau: {
      operational: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    },
    shovels: {
      operational: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    },
    drills: {
      operational: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    },
    overall: {
      operational: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

const PhysicalAvailability = mongoose.model("PhysicalAvailability", PhysicalAvailabilitySchema);
module.exports = PhysicalAvailability;