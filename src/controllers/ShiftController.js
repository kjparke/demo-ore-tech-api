const Shift = require("../models/Shift");
const Log = require("../models/Log");
const mongoose = require("mongoose");

/* CREATE */
exports.addShift = async (req, res) => {
  try {
    const data = req.body;
    const shift = new Shift(data);
    const savedShift = await shift.save();
    if (!savedShift)
      return res
        .status(400)
        .json({ Error: "There was an error adding this shift." });
    res.status(200).json(savedShift);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* READ */
exports.getAllShifts = async (req, res) => {
  try {
    const allShifts = await Shift.find({});
    res.status(200).json(allShifts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.readShiftSummary = async (req, res) => {
  const eventId = req.params.id;

  try {
    const logs = await Log.find({
      eventId: new mongoose.Types.ObjectId(eventId),
    })
      //   .populate('user', 'firstName lastName email accessLevel lastLoggedIn')
      .lean();

    // Group logs by hour
    const groupedLogs = logs.reduce((acc, log) => {
      const hour = log.createdAt.toISOString().substring(0, 13) + ":00:00Z"; // Round down to the nearest hour
      if (!acc[hour]) {
        acc[hour] = [];
      }
      acc[hour].push(log);
      return acc;
    }, {});

    // Format results
    const hourlyChanges = Object.keys(groupedLogs).map((hour) => ({
      hour,
      logs: groupedLogs[hour].map((log) => ({
        ...log,
      })),
    }));

    res.status(200).json(hourlyChanges);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
};

exports.getShift = async (req, res) => {
  try {
    const id = req.params.id;
    const shift = await Shift.find({ _id: id });
    if (!shift) return res.status(400).json({ Error: "Shift data not found" });
    res.status(200).json(shift);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
