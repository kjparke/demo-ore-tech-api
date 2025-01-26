const ShiftRoster = require("../models/ShiftRoster");

// Create a new Shift Roster
exports.createShiftRoster = async (shiftRosterData) => {
  try {
    const newShiftRoster = new ShiftRoster(shiftRosterData);
    return await newShiftRoster.save();
  } catch (error) {
    console.error("Error creating shift roster:", error);
    throw new Error(
      `An error was encountered while creating the shift roster: ${JSON.stringify(shiftRosterData)}`
    );
  }
};

exports.readShiftRoster = async (filter) => {
	try {
		const shiftRoster = await ShiftRoster.findOne(filter);
		return shiftRoster;
	} catch (error) {
		console.error(error);
		throw new Error("An error was encountered while reading this shift roster. Please refresh to try again.")
	}
}

exports.readTechnicianNamesForEventShift = async (event, shiftType, shiftDate) => {
  try {
    const filter = {
      eventId: event._id,
      shift: shiftType,
      date: shiftDate,
    };

    const shiftRoster = await ShiftRoster.findOne(filter);
    
    if (!shiftRoster || !shiftRoster.names) {
      return []; 
    }

    return shiftRoster.names; 
  } catch (error) {
    console.error("Error fetching technician names for event shift:", error);
    throw new Error("Error fetching technician names, please try again.");
  }
};

// Update an existing Shift Roster
exports.updateShiftRoster = async (filter, update) => {
  try {
    const updatedShiftRoster = await ShiftRoster.findOneAndUpdate(
      filter, 
      update, 
      { new: true } 
    );

    return updatedShiftRoster; 
  } catch (error) {
    console.error("Error updating shift roster:", error);
    throw new Error(
      `An error was encountered while updating the shift roster with filter: ${JSON.stringify(filter)}`
    );
  }
};
