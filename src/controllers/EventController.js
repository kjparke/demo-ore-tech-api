const Log = require("../models/Log");
const Event = require("../models/Event");
const Asset = require("../models/Asset");
const moment = require('moment');
const noteController = require("./NoteController");
const LogController = require("./LogController");
const { createNewEventDelta, updateLastEventDeltaEndTime } = require("./EventDeltaController");
const { createLocationDelta, _createNewLocationDelta, updateLastLocationDeltaEndTime } = require("./LocationDeltaController");
const { _isNewDelta, _isNewLocation } = require("./deltas/helpers");
const { DOWN_STATUSES } = require("../constants/constants");

// CREATE EVENT
exports.createEvent = async (req, res) => {
  const newEvent = req.body.event;
  const user = req.body.user;
  try {
    const event = new Event(newEvent);
    await event.save();
    const log = await LogController.createLog({
      eventId: event._id,
      eventChangeText: `NOTE ADDED: ${user.firstName} ${user.lastName} added a new note.`,
      status: event.status,
      user: body.user._id,
    });
    await log.save();
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};

exports._createEvent = async (event) => {
  try {
    await this.updateManyActualOutDates(event.unitId);

    const newEvent = new Event(event); 
    await newEvent.save();  

    // Create deltas using the saved event's _id
    await createNewEventDelta({ ...event, eventId: newEvent._id });
    await _createNewLocationDelta({ ...event, eventId: newEvent._id });

    return newEvent;
  } catch (error) {
    console.error(error);
    throw new Error("An error occurred while creating the event");
  }
};

exports.createOperationalEvent = async (event) => {
  try {
    const newEvent = new Event(event);
    newEvent.save();
    return newEvent;
  } catch (error) {
    console.error(error);
  }
};

exports.addNoteToEvent = async (req, res) => {
  const eventId = req.params.eventId;
  const data = req.body.data;

  try {
    const note = await noteController.createNote(data);
    const event = await Event.findOne({ _id: eventId });
    if (!event) {
      return res.status(404).json({ Error: "Event not found" });
    }

    const log = new Log({
      eventId: eventId,
      eventChangeText: `Note added by ${note.user.firstName} ${note.user.lastName}`,
      status: event.status,
      user: data.user,
    });
    const savedLog = await log.save();

    res.status(200).json({ msg: "Note added and log created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* READ */
exports.readEventById = async(eventId) => {
  try {
    const event = await Event.findById(eventId);
    return event;
  } catch (error) {
    console.error(error);
    return {message: "There was an error while reading this event"}
  }
}

exports.readEvents = async (filter) => {
  try {
    const events = await Event.find(filter);
    return events
  } catch (error) {
    console.error(error);
    return { data: {}, message: "Error while reading events" };
  }
};

exports.readOneEvent = async (filter) => {
  try {
    const event = await Event.findOne(filter)
      .sort({ createdAt: -1 });
    return event;
  } catch (error) {
    console.error(error);
    throw new Error("Error encountered while reading an event");
  }
}

exports.readEventNotes = async (req, res) => {
  const id = req.params.id;
  try {
    const foundEvent = await Event.findById(id).populate("notes");
    if (!foundEvent) {
      return res.status(404).json({ Error: "Event not found with id: " + id });
    }
    if (!foundEvent.notes || foundEvent.notes.length === 0) {
      return res
        .status(200)
        .json({ message: "There are no notes associated with this event." });
    }
    res.status(200).json(foundEvent.notes);
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};

exports.readEventsWithPipeline = async (pipeline) => {
  try {
    const events = await Event.aggregate(pipeline);
    return events;
  } catch(error) {
    throw error
  }
}

/* UPDATE */
exports.updateEvent = async (req, res) => {
  const eventId = req.params.id;
	const asset = req.body.data;

	try {
		const update = await processEventUpdate(asset);

    // Delete assignedTechnicians only from activeEvent if it exists
    if (update.activeEvent) {
      delete update.activeEvent.assignedTechnicians;
    }

		const updatedEvent = await Event.findOneAndUpdate(
			{ _id: update._id },
			update,
			{ new: true }
		);

		if (!updatedEvent) {
			return res
				.status(404)
				.json({ Error: `Event with ID ${eventId} not found.` });
		}

		res.status(200).json(updatedEvent.toObject());
	} catch(error) {
		console.error(error.message);
	}
}

exports._updateEvent = async (filter, update) => {
  try {
    const eventToUpdate = await Event.findOne(filter);
    if (!eventToUpdate) {
      throw new Error("Event not found");
    }

    const isNewStatusDelta = _isNewDelta(update, eventToUpdate);
    const isNewLocationDelta = _isNewLocation(update, eventToUpdate)

    if (isNewStatusDelta) {
      await createNewEventDelta(
        {
          ...update, 
          eventId: eventToUpdate._id,
          endTime: update.actualOutDate ? update.actualOutDate : undefined
        }
      )
    } else if (!isNewStatusDelta && update.actualOutDate){
      await updateLastEventDeltaEndTime(eventToUpdate._id);
    }

    if (isNewLocationDelta) {
       await _createNewLocationDelta(
        {
          ...update, 
          eventId: eventToUpdate._id,
          endTime: update.actualOutDate ? update.actualOutDate : undefined
        }
      )
    } else if (!isNewLocationDelta && update.actualOutDate) {
      await updateLastLocationDeltaEndTime(eventToUpdate._id);
    }

    Object.assign(eventToUpdate, update);
    return await eventToUpdate.save();

  } catch (error) {
    console.error(error);
    throw new Error("An error occurred while updating the event. Please try again.");
  }
};

exports.updateActualOutDate = async (id) => {
  const filter = {_id: id};
  const update = {actualOutDate: new Date()}

  try {
    const updatedEvent = await Event.findOneAndUpdate(filter, update, {new: true});
    return updatedEvent;
  } catch (error) {
    console.error(error);
  }
}

exports.updateManyActualOutDates = async (unitId) => {
  try {
    const events = await Event.find({
      unitId: unitId,
      status: { $in: DOWN_STATUSES },
      actualOutDate: { $in: [null, undefined] }
    });

    if (events.length > 0) {
      // Update all found events by setting actualOutDate to the current date and time
      const currentDate = moment().toDate();

      await Event.updateMany(
        { _id: { $in: events.map(event => event._id) } },
        { $set: { actualOutDate: currentDate } }
      );
    }
  } catch (error) {
    console.error(`Error updating actualOutDates for unit ${unitId}:`, error);
    throw new Error(`Error updating actualOutDates for unit ${unitId}`);
  }
};

/* DELETE */
exports.deleteEvent = async (req, res) => {
  const id = req.params.id;
  const unitId = req.body.unitId;
  try {
    const foundAsset = await Asset.find({ unitId: unitId });
    if (!foundAsset)
      res
        .status(400)
        .json({
          Error: "This event could not be deleted from its associated ",
        });
    await Asset.updateOne(
      { unitId: unitId },
      { $pull: { events: { eventId: mongoose.Types.ObjectId(id) } } }
    );

    const foundEvent = await Event.deleteOne({
      _id: mongoose.Types.ObjectId(id),
    });
    if (foundEvent.deletedCount === 0) {
      return res.status(400).json({ Error: "Event not found" });
    }

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};


//Helpers
const processEventUpdate = async (asset) => {
	const eventUpdate = asset.activeEvent;
	const assetUpdate = {...asset, activeEvent: asset.activeEvent._id};

	try { 
		updateAsset({ unitId: asset.unitId }, assetUpdate);

		const prevEvent = await Event.findOne({ _id: eventUpdate._id });
		if (!prevEvent) console.error("Could not find previous event");

		if (isNewDelta(eventUpdate, prevEvent)) {
			const newEventDelta = createEventDeltaObject(eventUpdate);
			eventUpdate['isStatusChangeManual'] = true;
			createNewEventDelta(newEventDelta);
		}

    if (isNewLocation(eventUpdate, prevEvent)) {
      await createLocationDelta(eventUpdate.location, eventUpdate.bay, prevEvent._id);
    }

		return eventUpdate;
	} catch(error) {
		console.log("Error while processing event update: " + error.message);
	}

}

const createEventDeltaObject = (eventUpdate) => {
	const update = {
		eventId: eventUpdate._id, 
		status: eventUpdate.status, 
		secondaryStatus: eventUpdate.secondaryStatus
	}
	return update
}

const isNewDelta = (currentEventUpdate, prevEvent) => {
  const isStatusChanged = currentEventUpdate.status !== prevEvent.status;
  const isSecondaryStatusChanged =
    currentEventUpdate.secondaryStatus !== prevEvent.secondaryStatus;

  return isStatusChanged || isSecondaryStatusChanged;
};

const isNewLocation = (currentEventUpdate, prevEvent) => {
  const isLocationChanged = currentEventUpdate.location !== prevEvent.location;
  const isBayChanged =
    currentEventUpdate.bay !== prevEvent.bay;

  return isLocationChanged || isBayChanged;
};

const updateAsset = async (filter, update) => {
	try {
			const asset = await Asset.findOneAndUpdate(filter, update);
			console.log({"Updated asset": asset});
	} catch (error) {
			console.error({"UpdateAsset Error": error})
	}
}