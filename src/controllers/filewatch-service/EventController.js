const Event = require("../../models/Event");
const EventDelta = require("../../models/EventDelta");

exports.createEvent = async (newEvent) => {
  const event = new Event(newEvent);
  return event.save();
};

exports.createEventDelta = async (newEventDelta) => {
  try {
    const eventDelta = new EventDelta(newEventDelta);
    await this.updateLastEventDeltaEndTime(newEventDelta.eventId);
    return eventDelta.save();
  } catch (error) {
    throw error;
  }
};

exports.createStatusDelta = async (eventId, statusDelta) => {
  try {
    await Event.updateOne(
      { _id: eventId },
      {
        $push: {
          statusDeltas: {
            $each: [statusDelta],
            $sort: { timestamp: -1 } 
          }
        }
      }
    );
  } catch (error) { 
    console.error("Error in createStatusDelta:", error);
  }
};

exports.updateStatusDelta = async (eventId, newStatusDelta) => {
  try {
    const event = await Event.findById(eventId);

    if (!event) {
      console.error("Event not found");
      return;
    }

    // Add the new statusDelta
    const updatedStatusDeltas = [...event.statusDeltas, newStatusDelta];

    // Update the document with the new array
    await Event.updateOne(
      { _id: eventId },
      { $set: { statusDeltas: updatedStatusDeltas } }
    );
  } catch (error) { 
    console.error("Error in updateStatusDelta:", error);
  }
};


exports.updateEvent = async (id, update) => {
  const filter = { _id: id };
  return Event.findOneAndUpdate(filter, update, { new: true });
};

exports.updateActualOutDate = async (id) => {
  const filter = {_id: id};
  const update = {actualOutDate: new Date()};
  try {
    const updatedEvent = await Event.findOneAndUpdate(filter, update, {new: true});
    return updatedEvent;      
  } catch (error) {
    console.error(error)
  }
}


const OperationalStatuses = [
  "OPERATIONAL",
  "OPERATIONAL-OoS",
  "OPERATIONAL-MANUAL-RELEASE",
  "NOH",
  "STANDBY",
  "DELAY",
];

exports.findLatestOperational = async (unitId) => {
  try {
    return await Event.findOne({
      unitId: unitId,
      status: { $in: OperationalStatuses }, 
    }).sort({ createdAt: -1 });
  } catch (error) {
    console.error("Error in findLatestOperational:", error);
  }
};

exports.findLatestEXC = async (unitId) => {
  try {
    return await Event.findOne({
      unitId: unitId, 
      status: "EXC"
    }).sort({createdAt: -1});
  } catch(error) {
    console.error({"Error finding latest EXC": error});
  }
}

exports.updateLastEventDeltaEndTime = async (eventId) => {
  try {
    const lastEventDelta = await EventDelta.findOne({ eventId: eventId }).sort({ createdAt: -1 });

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
