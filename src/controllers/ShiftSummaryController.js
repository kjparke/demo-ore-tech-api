const moment = require("moment");
const EventDelta = require("../models/EventDelta");
const eventController = require("./EventController");
const {
  OPERATIONAL_STATUSES,
  DOWN_WAITING,
  DOWN_SCHEDULED,
  DOWN_UNSCHEDULED,
} = require("../constants/constants");

const formatDownStatuses = (status) => {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const getStartOfDay = (date) => {
  return moment(date).startOf("day").toDate();
};

const getEndOfDay = (date) => {
  return moment(date).endOf("day").toDate();
};

const isToday = (date) => {
  const queryDate = moment(date).startOf("day");
  const today = moment().startOf("day");
  return today.isSame(queryDate);
};

const buildEventPipeline = (startOfDay, endOfDay, exclusionDate, sortField, sortDirection) => [
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
  {
    $sort: { [sortField]: sortDirection },
  },
];

const buildDeltaQuery = (eventIds, startOfDay, endOfDay) => ({
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
});

const buildSingleDeltaQuery = (eventId, startOfDay, endOfDay) => ({
  $and: [
    {
      eventId: eventId,
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
});

const readShiftDeltas = async (eventIds, startOfDay, endOfDay) => {
  const deltaQuery = buildDeltaQuery(eventIds, startOfDay, endOfDay);
  return await EventDelta.find(deltaQuery);
};

const readSingleEventDeltas = async (eventId, startOfDay, endOfDay) => {
  const deltaQuery = buildSingleDeltaQuery(eventId, startOfDay, endOfDay);
  return await EventDelta.find(deltaQuery);
};

const processDeltas = (events, deltas, queryDate, currentLocalTime) => {
  return events.map((event) => {
    const eventDeltas = filterAndSortDeltas(deltas, event._id);
    const deltasByHour = groupDeltasByHour(eventDeltas, queryDate);

    const sortedDeltas = Object.values(deltasByHour).sort(
      (a, b) => moment(a.startTime).valueOf() - moment(b.startTime).valueOf()
    );

    return formatEventWithDeltas(
      event.unitId,
      sortedDeltas,
      queryDate,
      currentLocalTime
    );
  });
};

const filterAndSortDeltas = (deltas, eventId) => {
  const eventDeltas = deltas.filter(
    (delta) => delta.eventId.toString() === eventId.toString()
  );
  eventDeltas.sort(
    (a, b) => moment(a.startTime).valueOf() - moment(b.startTime).valueOf()
  );
  return eventDeltas;
};

const groupDeltasByHour = (eventDeltas, queryDate) => {
  const startOfDay = getStartOfDay(queryDate);
  return eventDeltas.reduce((acc, delta) => {
    const startTime = moment(delta.startTime);
    const hourKey =
      startTime < moment(startOfDay) ? "00:00" : startTime.format("HH:00");

    if (
      !acc[hourKey] ||
      moment(acc[hourKey].startTime).valueOf() < startTime.valueOf()
    ) {
      acc[hourKey] = delta;
    }
    return acc;
  }, {});
};

const formatEventWithDeltas = (unitId, deltas, queryDate, currentLocalTime) => {
  return {
    unitId,
    events: deltas.map((delta, index, array) => {
      const startTime = moment(delta.startTime);
      const formattedStartTime =
        startTime < getStartOfDay(queryDate)
          ? "00:00"
          : startTime.format("HH:00");

      let endTime = calculateEndTime(delta, queryDate, currentLocalTime);

      return {
        id: delta._id,
        eventId: delta.eventId,
        status: delta.status,
        secondaryStatus: delta.secondaryStatus,
        startTime: formattedStartTime,
        endTime,
      };
    }),
  };
};

const calculateEndTime = (delta, queryDate, currentLocalTime) => {
  const endOfDay = getEndOfDay(queryDate);

  if (delta.endTime && moment(delta.endTime).isAfter(endOfDay)) {
    return "23:00";
  } else if (delta.endTime) {
    return moment(delta.endTime).format("HH:00");
  } else if (isToday(queryDate)) {
    return moment(currentLocalTime).format("HH:00");
  } else {
    return "23:00";
  }
};

const groupEventsByUnitId = (eventsWithDeltas) => {
  return eventsWithDeltas.reduce((acc, event) => {
    let existingUnit = acc.find(e => e.unitId === event.unitId);

    if (existingUnit) {
      existingUnit.events = existingUnit.events.concat(event.events);
    } else {
      acc.push({
        unitId: event.unitId,
        events: event.events,
      });
    }

    return acc;
  }, []);
};

const readShiftSummaryByDate = async (date, sortField, sortDirection) => {
  try {
    const queryDate = moment(date);
    const startOfDay = getStartOfDay(queryDate);
    const endOfDay = getEndOfDay(queryDate);
    const exclusionDate = moment("2024-05-24T07:00:00.000Z").toDate();
    const currentLocalTime = moment();
    const sortDir = sortDirection === "desc" ? -1 : 1;

    const pipeline = buildEventPipeline(
      startOfDay,
      endOfDay,
      exclusionDate,
      sortField,
      sortDir
    );
    const events = await eventController.readEventsWithPipeline(pipeline);
    const eventIds = events.map((event) => event._id);
    const deltas = await readShiftDeltas(eventIds, startOfDay, endOfDay);

    const eventsWithDeltas = processDeltas(
      events,
      deltas,
      queryDate,
      currentLocalTime
    );

    return groupEventsByUnitId(eventsWithDeltas);
  } catch (error) {
    console.error("Error in readShiftSummaryByDate:", error);
    throw error;
  }
};

const readDeltasForSingleEvent = async (eventId, date) => {
  try {
    const queryDate = moment(date);
    const startOfDay = getStartOfDay(queryDate);
    const endOfDay = getEndOfDay(queryDate);
    const currentLocalTime = moment();

    const event = await eventController.readEventById(eventId);
    if (!event) throw new Error("Event not found");

    const deltas = await readSingleEventDeltas(eventId, startOfDay, endOfDay);

    const eventWithDeltas = processDeltas(
      [event],
      deltas,
      queryDate,
      currentLocalTime
    );

    return eventWithDeltas[0]; // Return the single event with deltas
  } catch (error) {
    console.error("Error in readDeltasForSingleEvent:", error);
    throw error;
  }
};

module.exports = {
  processDeltas,
  readShiftSummaryByDate,
  readDeltasForSingleEvent,
  formatDownStatuses,
  getStartOfDay,
  getEndOfDay,
  filterAndSortDeltas,
  groupDeltasByHour,
};