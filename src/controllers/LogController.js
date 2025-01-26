const Log  = require('../models/Log');

/* Create */
exports.createLog = async (log) => {
    const newLog = new Log(log);
    return newLog.save();
}

/* READ */
exports.readLogsById = async (eventId) => {
    const logs = await Log.find({eventId: eventId});
    return logs;
};

exports.readlogs = async (req, res) => {
    try {
        const logs = await Log.find({});
        res.status(200).json(logs)
    } catch (error) {
        res.status(500).json(error);
    }
}

exports.readGroupedLogs = async (req, res) => {
  const { eventId } = req.params;
  res.status(200).json({ "eventId": eventId });
};
