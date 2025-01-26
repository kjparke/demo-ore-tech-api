const mongoose = require("mongoose");
const EventDelta = require("../models/EventDelta");
const eventController = require("./EventController");
const {
  OPERATIONAL_STATUSES,
  DOWN_STATUSES,
  DOWN_WAITING,
  DOWN_SCHEDULED,
  DOWN_UNSCHEDULED,
} = require("../constants/constants");

exports.createNewEventDelta = async (delta) => {
  try {
    const { _id, eventId, ...deltaWithoutId } = delta;
    const newDelta = new EventDelta({ ...deltaWithoutId, eventId, startTime: new Date() });

    // Update the last event delta's endTime
    await this.updateLastEventDeltaEndTime(eventId);

    // Save the new delta
    await newDelta.save();
  } catch (error) {
    console.log({ "Error creating event delta": error });
    throw error;
  }
};

exports.readEventDelta = async (id) => {
  try {
    const eventDelta = await EventDelta.findById(id);
    return eventDelta;
  } catch (error) {
    throw error;
  }
}

exports.readShiftSummaryByDate = async (date) => {
  try {
    const queryDate = new Date(date);
    const startOfDay = getStartOfDay(queryDate);
    const endOfDay = getEndOfDay(queryDate);
    const exclusionDate = new Date("2024-05-24T07:00:00.000Z");
    const currentLocalTime = new Date();

    const pipeline = buildEventPipeline(startOfDay, endOfDay, exclusionDate);
    const events = await eventController.readEventsWithPipeline(pipeline);
    const eventIds = events.map((event) => event._id);
    const deltas = await readShiftDeltas(eventIds, startOfDay, endOfDay);

    const eventsWithDeltas = processDeltas(events, deltas, startOfDay, isToday(queryDate), currentLocalTime);

    const eventsByUnitId = eventsWithDeltas.reduce((acc, event) => {
      if (event.events.length > 0) {
        if (!acc[event.unitId]) {
          acc[event.unitId] = { unitId: event.unitId, events: [] };
        }
        acc[event.unitId].events.push(...event.events);
      }
      return acc;
    }, {});

    return Object.values(eventsByUnitId);
  } catch (error) {
    console.error("Error in readShiftSummaryByDate:", error);
    throw error;
  }
};

exports.readLastEventDeltaPerHour = async (req, res) => {
  const eventId = req.params.id;

  try {
    const eventDeltas = await EventDelta.find({
      eventId: new mongoose.Types.ObjectId(eventId),
    })
      .sort("createdAt")
      .lean();

    // Group event deltas by hour
    const groupedEventDeltas = eventDeltas.reduce((acc, eventDelta) => {
      const hour =
        eventDelta.createdAt.toISOString().substring(0, 13) + ":00:00Z"; // Round down to the nearest hour
      if (!acc[hour]) {
        acc[hour] = eventDelta;
      } else {
        acc[hour] = eventDelta;
      }
      return acc;
    }, {});

    // Format results
    const lastEventDeltaPerHour = Object.keys(groupedEventDeltas).map(
      (hour) => ({
        hour,
        log: groupedEventDeltas[hour],
      })
    );

    res.status(200).json(lastEventDeltaPerHour);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
};

exports.updateEventDelta = async (req, res) => {
  const eventDeltaId = req.params.id;
  const update = req.body;
  try {
    const updatedEventDelta = await EventDelta.findByIdAndUpdate(
      { _id: eventDeltaId },
      update,
      { new: true }
    );
    if (updatedEventDelta) {
      res.status(200).json(updatedEventDelta);
    } else {
      res.status(404).json({ message: "EventDelta not found" });
    }
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.updateLastEventDeltaEndTime = async (eventId) => {
  try {
    const lastEventDelta = await EventDelta.findOne({ eventId: eventId })
    .sort({ createdAt: -1 })
    .exec();

    if (lastEventDelta) {
      lastEventDelta.endTime = new Date();
      await lastEventDelta.save();
      return lastEventDelta;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error updating the event delta:", error);
    throw error;
  }
};

const formatDownStatuses = (status) => {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const getStartOfDay = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

const getEndOfDay = (date) => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
};

const isToday = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime() === date.getTime();
};

const buildEventPipeline = (startOfDay, endOfDay, exclusionDate) => [
  {
    $match: {
      downDate: { $lte: endOfDay, $gte: exclusionDate },
      status: {
        $in: [DOWN_WAITING, DOWN_SCHEDULED, DOWN_UNSCHEDULED],
      },
      $or: [
        { actualOutDate: { $gte: startOfDay, $lte: endOfDay } },
        { actualOutDate: { $exists: false } },
      ],
    },
  },
  {
    $project: {
      unitId: 1,
      status: 1,
      downDate: 1,
      actualOutDate: 1,
    },
  },
];

const readShiftDeltas = async (eventIds, startOfDay, endOfDay) => {
  const deltaQuery = {
    $and: [
      {
        eventId: { $in: eventIds },
        status: { $nin: OPERATIONAL_STATUSES },
      },
      {
        $or: [
          { startTime: { $gte: startOfDay, $lte: endOfDay } },
          { endTime: { $gte: startOfDay, $lte: endOfDay } },
          { startTime: { $lte: startOfDay }, endTime: { $gte: endOfDay } },
          { startTime: { $lte: startOfDay }, endTime: { $exists: false } },
        ],
      },
    ],
  };
  return await EventDelta.find(deltaQuery);
};

const processDeltas = (events, deltas, startOfDay, isToday, currentLocalTime) => {
  return events.map((event) => {
    const eventDeltas = deltas.filter(
      (delta) => delta.eventId.toString() === event._id.toString()
    );

    eventDeltas.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    const deltasByHour = eventDeltas.reduce((acc, delta) => {
      const startTime = new Date(delta.startTime);
      const hourKey = startTime < startOfDay ? "00:00" : startTime.getHours().toString().padStart(2, "0") + ":00";

      if (!acc[hourKey] || new Date(acc[hourKey].startTime) < startTime) {
        acc[hourKey] = delta;
      }
      return acc;
    }, {});

    const sortedDeltas = Object.values(deltasByHour).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    return {
      unitId: event.unitId,
      events: sortedDeltas.map((delta, index, array) => {
        const startTime = new Date(delta.startTime);
        const formattedStartTime = startTime < startOfDay ? "00:00" : startTime.getHours().toString().padStart(2, "0") + ":00";

        let endTime;
        if (delta.endTime) {
          const deltaEndTime = new Date(delta.endTime);
          const formattedEndTime = deltaEndTime.getHours().toString().padStart(2, "0") + ":00";
          endTime = formattedEndTime;
        } else if (isToday) {
          endTime = currentLocalTime.getHours().toString().padStart(2, "0") + ":00";
        } else {
          endTime = "23:00";
        }

        if (index < array.length - 1) {
          const nextStartTime = new Date(array[index + 1].startTime);
          if (nextStartTime.getTime() === new Date(delta.endTime).getTime()) {
            endTime = (new Date(delta.endTime).getHours() - 1).toString().padStart(2, "0") + ":00";
          }
        }

        return {
          id: delta._id,
          status: `${
            DOWN_STATUSES.includes(delta.status)
              ? formatDownStatuses(delta.status)
              : delta.status
          } - ${delta.secondaryStatus}`,
          startTime: formattedStartTime,
          endTime: endTime,
        };
      }),
    };
  });
};