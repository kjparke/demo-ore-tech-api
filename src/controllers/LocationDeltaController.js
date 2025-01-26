const LocationDelta = require("../models/LocationDelta");

exports.createLocationDelta = async (location, bay, eventId) => {
  try {
    const locationDelta = {
      location: location,
      bay: bay,
      eventId: eventId,
    };

    const newLocationDelta = new LocationDelta(locationDelta);
    await newLocationDelta.save()
    return newLocationDelta;
  } catch (error) {
    throw error;
  }
};

exports._createNewLocationDelta = async (delta) => {
  try {
    const { _id, eventId, ...deltaWithoutId } = delta; 
    const newLocationDelta = new LocationDelta({ ...deltaWithoutId, eventId, startTime: new Date() });
    
    await this.updateLastLocationDeltaEndTime(eventId); 
    return await newLocationDelta.save();
  } catch (error) {
    console.error(error);
    throw new Error("An error occurred while attempting to create a new location delta");
  }
};

exports.readLocationDeltas = async (eventId) => {
  try {
    const filter = { eventId: eventId };
    const locationDeltas = await LocationDelta.find(filter);
    return locationDeltas;
  } catch (error) {
    throw error;
  }
};

exports.updateLocationDeltas = async (id, update) => {
  try {
    const updatedLocationDelta = await LocationDelta.findByIdAndUpdate(
      { _id: id },
      update,
      { new: true }
    );

    console.log(updatedLocationDelta)
    return updatedLocationDelta;
  } catch (error) {
    throw error;
  }
};

exports.updateLastLocationDeltaEndTime = async (eventId) => {
  try {
    const lastLocationDelta = await LocationDelta.findOne({ eventId })
      .sort({ createdAt: -1 })
      .exec();

    // If there is a previous location delta and it hasn't been ended, update its endTime
    if (lastLocationDelta && !lastLocationDelta.endTime) {
      lastLocationDelta.endTime = new Date();
      await lastLocationDelta.save();
    }
  } catch (error) {
    console.error({ "Error updating last location delta end time": error });
    throw new Error("An error occurred while updating the last location delta.");
  }
};
